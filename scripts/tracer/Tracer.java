// Records a Java program's run, step by step, for the code visualizer — the same idea as Python Tutor.
//
// Usage: java scripts/tracer/Tracer.java <Program.java> <out.json> [options]
//   --sourcepath <dir>  the source root, so the program can use other classes next to it (they run, but only
//                       the program's own file is stepped through)
//   --stdin <file>      what System.in reads (without it, System.in is empty)
//   --timeout <s>       give up after this many seconds (default 60)
//   --max-steps <n>     step limit when the program sets no @maxSteps (default 1000)
// Exit code 0 when recorded, 1 when the program doesn't compile or can't be recorded (the reason is on stderr).
//
// The program is compiled with debug info (-g) and started in a second JVM under the JDK's own debugger
// interface (JDI, module jdk.jdi). Before each line runs, and when a method returns, the tracer saves a
// snapshot: the line, every frame of the program's own methods with its local variables, the objects they
// reach (arrays, collections, the program's own classes such as ListNode), and everything printed so far.
// JDK code is stepped over, so a call like map.put(...) is one step.
//
// Settings come from "// @key value" comment lines at the top of the program:
//   @start <method>   record only from the first call of this method (skips building the input in main)
//   @maxSteps <n>     stop recording after n steps (default 1000)
//   @hide <m> …       don't record steps inside these methods (e.g. a helper that prints a tree); "lambdas" hides lambdas
// Every @key line is also copied into the trace's "meta" for the visualizer page.
import com.sun.jdi.*;
import com.sun.jdi.connect.*;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;

import javax.tools.ToolProvider;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

public class Tracer {
    static final String RUNNER = "__VizRunner";
    static final String[] JDK_PACKAGES = { "java.*", "javax.*", "jdk.*", "sun.*", "com.sun.*", RUNNER };
    static final int MAX_HEAP_OBJECTS = 400, MAX_ITEMS = 200;

    // A failure to report in one line (no stack trace): the program doesn't compile, never finishes, …
    static class Problem extends Exception {
        Problem(String message) { super(message); }
    }

    public static void main(String[] args) throws Exception {
        List<String> rest = new ArrayList<>(List.of(args));
        Map<String, String> opts = new HashMap<>();
        for (String key : List.of("--sourcepath", "--stdin", "--timeout", "--max-steps")) {
            int at = rest.indexOf(key);
            if (at >= 0 && at + 1 < rest.size()) { opts.put(key, rest.get(at + 1)); rest.subList(at, at + 2).clear(); }
        }
        if (rest.size() != 2) {
            System.err.println("Usage: java Tracer.java <Program.java> <out.json> [--sourcepath dir] [--stdin file] [--timeout s] [--max-steps n]");
            System.exit(2);
        }
        try {
            record(Path.of(rest.get(0)), Path.of(rest.get(1)), opts);
        } catch (Problem p) {
            System.err.println(p.getMessage());
            System.exit(1);
        }
    }

    static void record(Path source, Path outFile, Map<String, String> opts) throws Exception {
        String code = Files.readString(source);
        Map<String, Object> meta = new LinkedHashMap<>();
        Matcher m = Pattern.compile("(?m)^\\s*//\\s*@(\\w+)\\s+(.*?)\\s*$").matcher(code);
        while (m.find()) meta.put(m.group(1), m.group(2));

        // The class to run: the file's name, inside the file's package if it has one
        Matcher pkg = Pattern.compile("(?m)^\\s*package\\s+([\\w.]+)\\s*;").matcher(code);
        String simpleName = source.getFileName().toString().replaceFirst("\\.java$", "");
        String mainClass = pkg.find() ? pkg.group(1) + "." + simpleName : simpleName;
        if (!Pattern.compile("\\bstatic\\s+void\\s+main\\s*\\(").matcher(code).find())
            throw new Problem("No main method: the visualizer runs a class with public static void main(String[] args).");

        Path dir = Files.createTempDirectory("viz-");
        try {
            Path sourcepath = opts.containsKey("--sourcepath") ? Path.of(opts.get("--sourcepath")) : null;
            Set<String> userClasses = compile(source, mainClass, dir, sourcepath);
            String maxSteps = (String) meta.getOrDefault("maxSteps", opts.getOrDefault("--max-steps", "1000"));
            Tracer t = new Tracer(userClasses, mainClass, (String) meta.get("start"), Integer.parseInt(maxSteps));
            if (meta.get("hide") instanceof String h) t.hidden.addAll(List.of(h.trim().split("\\s+")));
            t.timeoutMs = 1000L * Integer.parseInt(opts.getOrDefault("--timeout", "60"));
            t.stdin = opts.get("--stdin");
            t.run(dir);
            if (t.steps.isEmpty())
                throw new Problem(t.startMethod != null
                    ? "Nothing was recorded: @start names " + t.startMethod + ", but it never ran."
                    : "Nothing was recorded: the recorder missed the start of main. Try again.");
            Map<String, Object> trace = new LinkedHashMap<>();
            trace.put("program", simpleName);
            trace.put("meta", meta);
            trace.put("code", code.replace("\r\n", "\n"));
            List<Map<String, Object>> steps = withoutLoopBraces(t.steps, code.split("\r?\n"));
            trace.put("steps", steps);
            trace.put("truncated", t.truncated);
            Files.writeString(outFile, Json.write(trace) + "\n");
            System.out.println(simpleName + ": " + steps.size() + " steps" + (t.truncated ? " (truncated)" : ""));
        } finally {
            try (var walk = Files.walk(dir)) {
                walk.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
            }
        }
    }

    // javac gives a loop's closing "}" its own line entry (the jump back to the condition): drop those steps.
    // A method's last "}" stays, because there the next step is back in the caller.
    static List<Map<String, Object>> withoutLoopBraces(List<Map<String, Object>> steps, String[] lines) {
        List<Map<String, Object>> kept = new ArrayList<>();
        for (int i = 0; i < steps.size(); i++) {
            Map<String, Object> s = steps.get(i);
            boolean brace = s.get("event").equals("step") && lines[(Integer) s.get("line") - 1].trim().equals("}");
            if (brace && i + 1 < steps.size() && depth(steps.get(i + 1)) == depth(s)) continue;
            kept.add(s);
        }
        return kept;
    }

    static int depth(Map<String, Object> step) { return ((List<?>) step.get("frames")).size(); }

    // Compiles the program with -g plus a small runner that captures System.out (and feeds System.in);
    // returns the class names that come from the program's own file: the ones the tracer steps through.
    // With a sourcepath, classes the program uses from other files are compiled into dir/lib: they run, unrecorded.
    static Set<String> compile(Path source, String mainClass, Path dir, Path sourcepath) throws IOException, Problem {
        Path runner = dir.resolve(RUNNER + ".java");
        Files.writeString(runner, """
            public class %s {
                public static final java.io.ByteArrayOutputStream OUT = new java.io.ByteArrayOutputStream();
                public static void main(String[] args) throws Exception {
                    System.setOut(new java.io.PrintStream(OUT, true, "UTF-8"));
                    String in = System.getProperty("viz.stdin");
                    System.setIn(in == null ? new java.io.ByteArrayInputStream(new byte[0]) : new java.io.FileInputStream(in));
                    try { %s.main(new String[0]); } catch (Throwable t) { /* the tracer records it */ }
                }
            }
            """.formatted(RUNNER, mainClass));
        var javac = ToolProvider.getSystemJavaCompiler();
        if (javac == null) throw new Problem("No Java compiler found: the visualizer needs a JDK (not just a JRE).");
        List<String> common = new ArrayList<>(List.of("-g", "-encoding", "UTF-8", "-nowarn", "-Xlint:none"));
        if (sourcepath != null) common.addAll(List.of("-sourcepath", sourcepath.toString()));
        // -implicit:none: only the program's own classes land in dir (other files are read, not written)
        List<String> own = new ArrayList<>(common);
        own.addAll(List.of("-implicit:none", "-d", dir.toString(), source.toString(), runner.toString()));
        ByteArrayOutputStream errors = new ByteArrayOutputStream();
        if (javac.run(null, null, errors, own.toArray(new String[0])) != 0)
            throw new Problem("Compile error:\n" + errors.toString(StandardCharsets.UTF_8).replace(dir.toString(), "").trim());
        Set<String> names = new HashSet<>();
        try (var files = Files.walk(dir)) {
            files.filter(p -> p.toString().endsWith(".class"))
                 .map(p -> dir.relativize(p).toString().replace(File.separatorChar, '.').replaceFirst("\\.class$", ""))
                 .filter(n -> !n.equals(RUNNER))
                 .forEach(names::add);
        }
        if (sourcepath != null) {
            List<String> all = new ArrayList<>(common);
            all.addAll(List.of("-d", dir.resolve("lib").toString(), source.toString()));
            javac.run(null, null, OutputStream.nullOutputStream(), all.toArray(new String[0]));
        }
        return names;
    }

    final Set<String> userClasses;
    final String mainClass, startMethod;
    final int maxSteps;
    final List<Map<String, Object>> steps = new ArrayList<>();
    final Set<String> hidden = new HashSet<>();
    final List<String> libClasses = new ArrayList<>();
    long timeoutMs = 60_000;
    String stdin;
    boolean truncated, recording, done;
    VirtualMachine vm;
    String out = "";
    int outCount = 0;

    Tracer(Set<String> userClasses, String mainClass, String startMethod, int maxSteps) {
        this.userClasses = userClasses;
        this.mainClass = mainClass;
        this.startMethod = startMethod;
        this.maxSteps = maxSteps;
        this.recording = startMethod == null;
    }

    boolean isUser(ReferenceType t) { return userClasses.contains(t.name()); }

    void run(Path classpath) throws Exception {
        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> a = connector.defaultArguments();
        a.get("main").setValue(RUNNER);
        Path lib = classpath.resolve("lib");
        String cp = "\"" + classpath + (Files.isDirectory(lib) ? File.pathSeparator + lib : "") + "\"";
        if (Files.isDirectory(lib))
            try (var files = Files.walk(lib)) {   // classes from other files: run them, don't step through them
                files.filter(p -> p.toString().endsWith(".class"))
                     .map(p -> lib.relativize(p).toString().replace(File.separatorChar, '.').replaceFirst("\\.class$", ""))
                     .filter(n -> !userClasses.contains(n))
                     .forEach(libClasses::add);
            }
        a.get("options").setValue("-cp " + cp + " -Xss8m" + (stdin != null ? " \"-Dviz.stdin=" + stdin + "\"" : ""));
        vm = connector.launch(a);
        drain(vm.process().getInputStream(), System.out);
        drain(vm.process().getErrorStream(), System.err);

        EventRequestManager erm = vm.eventRequestManager();
        ClassPrepareRequest prep = erm.createClassPrepareRequest();
        prep.addClassFilter(mainClass);
        prep.enable();
        // If the class was already loaded before the request above, its prepare event never comes: hook main now
        for (ReferenceType t : vm.classesByName(mainClass)) breakAtMain(erm, t);

        long deadline = System.currentTimeMillis() + timeoutMs;
        vm.resume();
        EventQueue queue = vm.eventQueue();
        boolean alive = true;
        while (alive) {
            EventSet set = queue.remove(1000);
            if (set == null) {   // e.g. an endless loop on one line, which never reaches a new line to stop at
                if (System.currentTimeMillis() > deadline) {
                    vm.exit(1);
                    throw new Problem("The program didn't finish within " + timeoutMs / 1000 + " s. Is there an endless loop, or does it wait for input?");
                }
                continue;
            }
            for (Event e : set) {
                if (e instanceof ClassPrepareEvent cpe) {
                    breakAtMain(erm, cpe.referenceType());
                } else if (e instanceof BreakpointEvent be) {
                    if (!stepping) { startStepping(erm, be.thread()); stepping = true; }
                    onLocation(be.thread(), "step", null);
                } else if (e instanceof StepEvent se) {
                    onLocation(se.thread(), "step", null);
                } else if (e instanceof MethodExitEvent me) {
                    if (isUser(me.method().declaringType()) && !"void".equals(me.method().returnTypeName()))
                        onLocation(me.thread(), "return", me.returnValue());
                } else if (e instanceof ExceptionEvent ee) {
                    Location c = ee.catchLocation();
                    if (c == null || c.declaringType().name().equals(RUNNER)) onException(ee);
                } else if (e instanceof VMDeathEvent || e instanceof VMDisconnectEvent) {
                    alive = false;
                }
            }
            if (done && truncated) {   // out of steps: the rest of the run isn't needed
                vm.exit(0);
                break;
            }
            if (done) {   // stop stepping and let the program run to the end at full speed
                erm.deleteAllBreakpoints();
                erm.deleteEventRequests(new ArrayList<>(erm.stepRequests()));
                erm.deleteEventRequests(new ArrayList<>(erm.methodExitRequests()));
                erm.deleteEventRequests(new ArrayList<>(erm.exceptionRequests()));
                done = false;
            }
            if (alive) set.resume();
        }
        vm.process().waitFor(5, java.util.concurrent.TimeUnit.SECONDS);   // let it close its files (stdin) first
    }

    boolean stepping;
    final Set<Location> hooked = new HashSet<>();

    void breakAtMain(EventRequestManager erm, ReferenceType type) {
        for (Method main : type.methodsByName("main"))
            if (main.isStatic() && hooked.add(main.location())) erm.createBreakpointRequest(main.location()).enable();
    }

    void startStepping(EventRequestManager erm, ThreadReference thread) {
        StepRequest step = erm.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
        MethodExitRequest exit = erm.createMethodExitRequest();
        ExceptionRequest ex = erm.createExceptionRequest(null, true, true);
        for (String p : JDK_PACKAGES) { step.addClassExclusionFilter(p); exit.addClassExclusionFilter(p); }
        for (String c : libClasses) { step.addClassExclusionFilter(c); exit.addClassExclusionFilter(c); }
        exit.addThreadFilter(thread);
        ex.addThreadFilter(thread);
        step.enable(); exit.enable(); ex.enable();
    }

    void onLocation(ThreadReference thread, String event, Value returned) throws Exception {
        if (!recording) {
            if (!event.equals("step") || !thread.frame(0).location().method().name().equals(startMethod)) return;
            recording = true;
        }
        if (!isUser(thread.frame(0).location().declaringType())) return;   // e.g. a lambda's code inside a JDK call
        if (!hidden.isEmpty() && insideHidden(thread)) return;
        if (steps.size() >= maxSteps) { truncated = true; done = true; return; }
        steps.add(snapshot(thread, event, returned, null));
    }

    // @hide: helper methods (printing a tree, a sort's comparator) run without recording their steps
    boolean insideHidden(ThreadReference thread) throws IncompatibleThreadStateException {
        for (StackFrame f : thread.frames()) {
            Location loc = f.location();
            if (!isUser(loc.declaringType())) continue;
            String name = loc.method().name();
            if (hidden.contains(name) || hidden.contains("lambdas") && name.startsWith("lambda$")) return true;
        }
        return false;
    }

    void onException(ExceptionEvent ee) throws Exception {
        ObjectReference ex = ee.exception();
        Value msg = field(ex, "detailMessage");
        String text = ex.referenceType().name().replaceFirst("^.*\\.", "")
            + (msg instanceof StringReference s ? ": " + s.value() : "");
        if (recording) steps.add(snapshot(ee.thread(), "exception", null, text));
        done = true;
    }

    // ── one snapshot ──
    Map<Long, Object> heap;
    Deque<ObjectReference> pending;

    Map<String, Object> snapshot(ThreadReference thread, String event, Value returned, String exception) throws Exception {
        heap = new LinkedHashMap<>();
        pending = new ArrayDeque<>();
        List<Map<String, Object>> frames = new ArrayList<>();
        List<StackFrame> all = thread.frames();
        for (int i = all.size() - 1; i >= 0; i--) {          // outermost (main) first
            StackFrame f = all.get(i);
            Location loc = f.location();
            if (!isUser(loc.declaringType())) continue;
            Map<String, Object> frame = new LinkedHashMap<>();
            frame.put("method", loc.method().name());
            frame.put("class", loc.declaringType().name());
            frame.put("line", loc.lineNumber());
            List<Object> locals = new ArrayList<>();
            ObjectReference self = f.thisObject();
            if (self != null && !self.referenceType().allFields().stream().allMatch(Field::isStatic))
                locals.add(pair("this", value(self)));
            try {
                for (LocalVariable v : f.visibleVariables()) {
                    if (loc.method().name().equals("main") && v.name().equals("args")) continue;
                    locals.add(pair(v.name(), value(f.getValue(v))));
                }
            } catch (AbsentInformationException ignored) { }
            frame.put("locals", locals);
            frames.add(frame);
        }
        if (returned != null && !frames.isEmpty())
            frames.get(frames.size() - 1).put("returned", value(returned));

        List<Object> statics = new ArrayList<>();
        for (String name : userClasses)
            for (ReferenceType t : vm.classesByName(name))
                for (Field f : t.fields())
                    if (f.isStatic() && !f.isSynthetic() && !(f.isFinal() && isConstant(f.typeName())))
                        statics.add(pair(simple(name) + "." + f.name(), value(t.getValue(f))));

        while (!pending.isEmpty() && heap.size() < MAX_HEAP_OBJECTS) {
            ObjectReference o = pending.poll();
            if (!heap.containsKey(o.uniqueID())) heap.put(o.uniqueID(), describe(o));
        }

        Map<String, Object> s = new LinkedHashMap<>();
        s.put("event", event);
        s.put("line", frames.get(frames.size() - 1).get("line"));
        s.put("frames", frames);
        if (!statics.isEmpty()) s.put("statics", statics);
        Map<String, Object> h = new LinkedHashMap<>();
        heap.forEach((id, obj) -> h.put(String.valueOf(id), obj));
        s.put("heap", h);
        s.put("out", readOut());
        if (exception != null) s.put("exception", exception);
        return s;
    }

    static boolean isConstant(String type) {
        return type.equals("java.lang.String") || !type.contains(".") && !type.endsWith("]");
    }

    static String simple(String className) { return className.replaceFirst("^.*[.$]", ""); }

    static List<Object> pair(Object a, Object b) { return Arrays.asList(a, b); }   // List.of rejects null

    // A value as JSON: numbers/booleans as is, char {"c"}, String {"s"}, null, an object {"ref": id}
    Object value(Value v) {
        if (v == null) return null;
        if (v instanceof BooleanValue b) return b.value();
        if (v instanceof CharValue c) return Map.of("c", String.valueOf(c.value()));
        if (v instanceof LongValue l) return Math.abs(l.value()) < (1L << 53) ? l.value() : String.valueOf(l.value());
        if (v instanceof FloatValue f) return Float.isFinite(f.value()) ? f.value() : String.valueOf(f.value());
        if (v instanceof DoubleValue d) return Double.isFinite(d.value()) ? d.value() : String.valueOf(d.value());
        if (v instanceof PrimitiveValue p) return p.longValue();
        if (v instanceof StringReference s) return Map.of("s", s.value());
        ObjectReference o = (ObjectReference) v;
        String type = o.referenceType().name();
        if (type.startsWith("java.lang.") && BOXES.contains(type.substring(10))) return value(field(o, "value"));
        pending.add(o);
        return Map.of("ref", String.valueOf(o.uniqueID()));
    }

    static final Set<String> BOXES = Set.of("Integer", "Long", "Short", "Byte", "Character", "Boolean", "Double", "Float");

    Value field(ObjectReference o, String name) {
        Field f = o.referenceType().fieldByName(name);
        return f == null ? null : o.getValue(f);
    }

    int intField(ObjectReference o, String name) { return ((IntegerValue) field(o, name)).value(); }

    // An object on the heap, by kind: array, list, deque, map, set, pq (heap array), sb, object, opaque
    Map<String, Object> describe(ObjectReference o) {
        Map<String, Object> d = new LinkedHashMap<>();
        String type = o.referenceType().name();
        d.put("type", type.startsWith("java.") ? simple(type) : type.replaceFirst("^([a-z_]\\w*\\.)+", "").replace('$', '.'));
        if (o instanceof ArrayReference arr) {
            d.put("kind", "array");
            d.put("type", simple(((ArrayType) arr.referenceType()).componentTypeName()) + "[]");
            d.put("length", arr.length());
            d.put("items", values(arr.getValues(0, Math.min(arr.length(), MAX_ITEMS))));
            return d;
        }
        if (type.startsWith("java.util.Collections$Unmodifiable") || type.startsWith("java.util.Collections$Synchronized")) {
            Value inner = o.referenceType().fieldByName("m") != null ? field(o, "m") : field(o, "c");   // a view: draw what it wraps
            if (inner instanceof ObjectReference in) return describe(in);
        }
        switch (type) {
            // List.of / Set.of / Map.of / Arrays.asList: fixed-size classes with their own fields
            case "java.util.ImmutableCollections$List12", "java.util.ImmutableCollections$Set12" -> {
                d.put("type", type.endsWith("List12") ? "List" : "Set");
                d.put("kind", type.endsWith("List12") ? "list" : "set");
                d.put("items", values(present(field(o, "e0"), field(o, "e1"))));
            }
            case "java.util.ImmutableCollections$ListN", "java.util.ImmutableCollections$SetN" -> {
                d.put("type", type.endsWith("ListN") ? "List" : "Set");
                d.put("kind", type.endsWith("ListN") ? "list" : "set");
                d.put("items", values(present(((ArrayReference) field(o, "elements")).getValues().toArray(new Value[0]))));
            }
            case "java.util.ImmutableCollections$Map1", "java.util.ImmutableCollections$MapN", "java.util.Arrays$ArrayList" -> {
                d.put("type", type.endsWith("ArrayList") ? "List" : "Map");
                if (type.endsWith("ArrayList")) {
                    ArrayReference a = (ArrayReference) field(o, "a");
                    list(d, "list", a, 0, a.length());
                } else {
                    d.put("kind", "map");
                    d.put("entries", entries(rawEntries(o)));
                }
            }
            case "java.util.ArrayList" -> list(d, "list", (ArrayReference) field(o, "elementData"), 0, intField(o, "size"));
            case "java.util.Vector", "java.util.Stack" -> list(d, "list", (ArrayReference) field(o, "elementData"), 0, intField(o, "elementCount"));
            case "java.util.PriorityQueue" -> list(d, "pq", (ArrayReference) field(o, "queue"), 0, intField(o, "size"));
            case "java.util.ArrayDeque" -> {
                ArrayReference els = (ArrayReference) field(o, "elements");
                int head = intField(o, "head"), tail = intField(o, "tail"), n = els.length();
                List<Object> items = new ArrayList<>();
                for (int i = head; i != tail && items.size() < MAX_ITEMS; i = (i + 1) % n) items.add(value(els.getValue(i)));
                d.put("kind", "deque");
                d.put("items", items);
            }
            case "java.util.LinkedList" -> {
                List<Object> items = new ArrayList<>();
                for (Value n = field(o, "first"); n != null && items.size() < MAX_ITEMS; n = field((ObjectReference) n, "next"))
                    items.add(value(field((ObjectReference) n, "item")));
                d.put("kind", "deque");
                d.put("items", items);
            }
            case "java.util.HashMap", "java.util.LinkedHashMap", "java.util.TreeMap" -> {
                d.put("kind", "map");
                d.put("entries", entries(rawEntries(o)));
            }
            case "java.util.HashSet", "java.util.LinkedHashSet", "java.util.TreeSet" -> {
                ObjectReference map = (ObjectReference) field(o, type.equals("java.util.TreeSet") ? "m" : "map");
                List<Object> items = new ArrayList<>();
                for (Value[] e : rawEntries(map)) items.add(value(e[0]));   // keys only: the values are a placeholder object
                d.put("kind", "set");
                d.put("items", items);
            }
            case "java.lang.StringBuilder", "java.lang.StringBuffer" -> {
                d.put("kind", "sb");
                d.put("value", builderText(o));
            }
            default -> {
                if (type.startsWith("java.") || type.startsWith("jdk.") || type.startsWith("sun.")) {
                    d.put("kind", "opaque");
                } else {
                    d.put("kind", "object");
                    List<Object> fields = new ArrayList<>();
                    for (Field f : o.referenceType().allFields())
                        if (!f.isStatic() && !f.isSynthetic()) fields.add(pair(f.name(), value(o.getValue(f))));
                    d.put("fields", fields);
                }
            }
        }
        return d;
    }

    void list(Map<String, Object> d, String kind, ArrayReference arr, int from, int size) {
        d.put("kind", kind);
        d.put("items", values(arr.getValues(from, Math.min(size, MAX_ITEMS))));
    }

    List<Object> values(List<Value> vs) {
        List<Object> out = new ArrayList<>();
        for (Value v : vs) out.add(value(v));
        return out;
    }

    // The given values without the "no element" marker List.of/Set.of use for empty slots (a plain Object, or null)
    static List<Value> present(Value... vs) {
        List<Value> out = new ArrayList<>();
        for (Value v : vs)
            if (v != null && !(v instanceof ObjectReference r && r.referenceType().name().equals("java.lang.Object"))) out.add(v);
        return out;
    }

    List<Object> entries(List<Value[]> raw) {
        List<Object> out = new ArrayList<>();
        for (Value[] e : raw) out.add(pair(value(e[0]), value(e[1])));
        return out;
    }

    // A map's (key, value) pairs in the order it iterates them
    List<Value[]> rawEntries(ObjectReference map) {
        List<Value[]> entries = new ArrayList<>();
        String type = map.referenceType().name();
        switch (type) {
            case "java.util.TreeMap" -> {
                Deque<ObjectReference> stack = new ArrayDeque<>();
                ObjectReference n = (ObjectReference) field(map, "root");
                while ((n != null || !stack.isEmpty()) && entries.size() < MAX_ITEMS) {
                    while (n != null) { stack.push(n); n = (ObjectReference) field(n, "left"); }
                    n = stack.pop();
                    entries.add(new Value[]{ field(n, "key"), field(n, "value") });
                    n = (ObjectReference) field(n, "right");
                }
            }
            case "java.util.LinkedHashMap" -> {
                for (Value n = field(map, "head"); n != null && entries.size() < MAX_ITEMS; n = field((ObjectReference) n, "after"))
                    entries.add(new Value[]{ field((ObjectReference) n, "key"), field((ObjectReference) n, "value") });
            }
            case "java.util.ImmutableCollections$Map1" -> entries.add(new Value[]{ field(map, "k0"), field(map, "v0") });
            case "java.util.ImmutableCollections$MapN" -> {
                List<Value> table = ((ArrayReference) field(map, "table")).getValues();   // key, value, key, value… with empty slots
                for (int i = 0; i + 1 < table.size() && entries.size() < MAX_ITEMS; i += 2)
                    if (table.get(i) != null) entries.add(new Value[]{ table.get(i), table.get(i + 1) });
            }
            default -> {   // HashMap: buckets in index order, each a chain of nodes
                ArrayReference table = (ArrayReference) field(map, "table");
                if (table != null)
                    for (Value bucket : table.getValues())
                        for (Value n = bucket; n != null && entries.size() < MAX_ITEMS; n = field((ObjectReference) n, "next"))
                            entries.add(new Value[]{ field((ObjectReference) n, "key"), field((ObjectReference) n, "value") });
            }
        }
        return entries;
    }

    String builderText(ObjectReference sb) {
        ArrayReference bytes = (ArrayReference) field(sb, "value");
        int count = intField(sb, "count");
        boolean utf16 = ((ByteValue) field(sb, "coder")).value() == 1;
        StringBuilder text = new StringBuilder();
        List<Value> vs = bytes.getValues(0, utf16 ? count * 2 : count);
        for (int i = 0; i < count; i++) {
            if (!utf16) text.append((char) (((ByteValue) vs.get(i)).value() & 0xff));
            else text.append((char) ((((ByteValue) vs.get(2 * i)).value() & 0xff) | ((((ByteValue) vs.get(2 * i + 1)).value() & 0xff) << 8)));
        }
        return text.toString();
    }

    // Everything the program printed so far, read from the runner's in-memory System.out
    String readOut() {
        ReferenceType runner = vm.classesByName(RUNNER).get(0);
        ObjectReference baos = (ObjectReference) runner.getValue(runner.fieldByName("OUT"));
        int count = intField(baos, "count");
        if (count != outCount) {
            List<Value> vs = ((ArrayReference) field(baos, "buf")).getValues(0, count);
            byte[] b = new byte[count];
            for (int i = 0; i < count; i++) b[i] = ((ByteValue) vs.get(i)).value();
            out = new String(b, StandardCharsets.UTF_8).replace("\r\n", "\n");   // same trace on every OS
            outCount = count;
        }
        return out;
    }

    static void drain(InputStream in, PrintStream to) {
        Thread t = new Thread(() -> {
            try { in.transferTo(to); } catch (IOException ignored) { }
        });
        t.setDaemon(true);
        t.start();
    }

    // Minimal JSON writer for Map / List / String / Number / Boolean / null
    static class Json {
        static String write(Object o) {
            StringBuilder sb = new StringBuilder();
            write(o, sb);
            return sb.toString();
        }

        static void write(Object o, StringBuilder sb) {
            if (o == null) sb.append("null");
            else if (o instanceof String s) quote(s, sb);
            else if (o instanceof Number || o instanceof Boolean) sb.append(o);
            else if (o instanceof Map<?, ?> m) {
                sb.append('{');
                boolean first = true;
                for (var e : m.entrySet()) {
                    if (!first) sb.append(',');
                    first = false;
                    quote(String.valueOf(e.getKey()), sb);
                    sb.append(':');
                    write(e.getValue(), sb);
                }
                sb.append('}');
            } else if (o instanceof List<?> l) {
                sb.append('[');
                for (int i = 0; i < l.size(); i++) {
                    if (i > 0) sb.append(',');
                    write(l.get(i), sb);
                }
                sb.append(']');
            } else throw new IllegalArgumentException(o.getClass().toString());
        }

        static void quote(String s, StringBuilder sb) {
            sb.append('"');
            for (char c : s.toCharArray()) {
                switch (c) {
                    case '"' -> sb.append("\\\"");
                    case '\\' -> sb.append("\\\\");
                    case '\n' -> sb.append("\\n");
                    case '\r' -> sb.append("\\r");
                    case '\t' -> sb.append("\\t");
                    default -> { if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c); }
                }
            }
            sb.append('"');
        }
    }
}
