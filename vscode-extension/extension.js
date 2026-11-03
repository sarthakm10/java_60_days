// Java Step Visualizer: records the Java file you're editing (runner.js → the tracer) and shows the run in a
// panel beside it (webview/ + the website's visualizer.js). The editor follows along: the line about to run is
// highlighted, the callers' lines are marked, and what the last line changed is written at its end.
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { record, readsInput } = require("./runner");

let ext;                 // the ExtensionContext
let session = null;      // the visualized file: { panel, uri, busy, again, index, line, inputAsked }
const inputs = new Map();   // file → the text its System.in reads (kept while VS Code is open)
let decorations;
let typingTimer = null;

// Shared files: copied into media/ by install.js; when running from the repo (F5), they're read from there
function asset(name) {
  const media = path.join(ext.extensionPath, "media", name);
  if (fs.existsSync(media)) return media;
  const inRepo = { "visualizer.js": "../visualizer.js", "visualizer.css": "../visualizer.css", "Tracer.java": "../scripts/tracer/Tracer.java" }[name];
  return path.join(ext.extensionPath, inRepo);
}

const settings = () => vscode.workspace.getConfiguration("javaStepVisualizer");

function activate(context) {
  ext = context;
  decorations = {
    current: vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: new vscode.ThemeColor("editor.focusedStackFrameHighlightBackground"),
      overviewRulerColor: new vscode.ThemeColor("editorOverviewRuler.infoForeground"),
      overviewRulerLane: vscode.OverviewRulerLane.Full,
    }),
    caller: vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: new vscode.ThemeColor("editor.stackFrameHighlightBackground"),
    }),
    hint: vscode.window.createTextEditorDecorationType({
      after: { margin: "0 0 0 2.5em", color: new vscode.ThemeColor("editorCodeLens.foreground"), fontStyle: "italic" },
    }),
  };
  context.subscriptions.push(
    ...Object.values(decorations),
    vscode.commands.registerCommand("javaStepVisualizer.visualize", (uri) => visualize(uri)),
    vscode.commands.registerCommand("javaStepVisualizer.runToLine", () => {
      const editor = vscode.window.activeTextEditor;
      if (session && editor && sameFile(editor.document.uri)) post({ type: "seekLine", line: editor.selection.active.line + 1 });
    }),
    vscode.commands.registerCommand("javaStepVisualizer.next", () => post({ type: "act", act: "next" })),
    vscode.commands.registerCommand("javaStepVisualizer.prev", () => post({ type: "act", act: "prev" })),
    vscode.commands.registerCommand("javaStepVisualizer.setInput", async () => {
      if (!session) return vscode.window.showInformationMessage("Visualize a Java file first.");
      if (await askInput(session.uri, true)) refresh();
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (session && sameFile(doc.uri) && settings().get("update") === "onSave") refresh();
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!session || !sameFile(e.document.uri) || settings().get("update") !== "onType" || !e.contentChanges.length) return;
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => refresh(), 1200);
    }),
    vscode.window.onDidChangeVisibleTextEditors(() => paint()),
  );
}

const sameFile = (uri) => session && uri.toString() === session.uri.toString();
const post = (msg) => session?.panel.webview.postMessage(msg);

async function visualize(uri) {
  const editor = vscode.window.activeTextEditor;
  uri = uri instanceof vscode.Uri ? uri : editor?.document.uri;
  if (!uri || !uri.fsPath.endsWith(".java")) return vscode.window.showWarningMessage("Open a .java file to visualize it.");
  if (uri.scheme !== "file") return vscode.window.showWarningMessage("The visualizer works on Java files saved on this computer.");
  const doc = await vscode.workspace.openTextDocument(uri);
  if (doc.isDirty && settings().get("update") !== "onType") await doc.save();
  if (readsInput(doc.getText()) && !inputs.has(uri.fsPath) && !(await askInput(uri, false))) inputs.set(uri.fsPath, "");

  if (session && !sameFile(uri)) { clearPaint(); session.panel.title = title(uri); session.uri = uri; session.index = 0; session.line = null; }
  const existed = !!session;
  if (!session) {
    const panel = vscode.window.createWebviewPanel("javaStepVisualizer", title(uri),
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [...new Set([ext.extensionPath, path.dirname(asset("visualizer.js"))])].map(p => vscode.Uri.file(p)) });
    session = { panel, uri, busy: false, again: false, index: 0, line: null };
    panel.iconPath = new vscode.ThemeIcon("play-circle");
    panel.webview.html = html(panel.webview);
    panel.webview.onDidReceiveMessage(onMessage);
    panel.onDidDispose(() => {
      clearPaint();
      session = null;
      vscode.commands.executeCommand("setContext", "javaStepVisualizer.active", false);
    });
    vscode.commands.executeCommand("setContext", "javaStepVisualizer.active", true);
  } else {
    session.panel.reveal(undefined, true);
  }
  if (existed) refresh();   // a new panel records when its page says "ready"
}

const title = (uri) => `Visualize ${path.basename(uri.fsPath)}`;

// The program reads System.in: ask what to type (\n separates lines). Returns false if cancelled.
async function askInput(uri, changing) {
  const value = await vscode.window.showInputBox({
    title: `Input for ${path.basename(uri.fsPath)}`,
    prompt: changing ? "What should System.in read? Separate lines with \\n." : "This program reads input (System.in). Type what it should read; separate lines with \\n.",
    value: (inputs.get(uri.fsPath) || "").replace(/\n/g, "\\n"),
    placeHolder: "e.g. 3 4\\nhello",
  });
  if (value === undefined) return false;
  inputs.set(uri.fsPath, value.replace(/\\n/g, "\n") + "\n");
  return true;
}

// Record the file again (one recording at a time; a change during a recording triggers one more)
async function refresh() {
  if (!session) return;
  if (session.busy) { session.again = true; return; }
  session.busy = true;
  const s = session;
  post({ type: "status", text: "Recording…", busy: true });
  const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === s.uri.toString());
  const config = settings();
  const result = await record({
    file: s.uri.fsPath,
    text: doc && doc.isDirty ? doc.getText() : undefined,
    stdin: inputs.get(s.uri.fsPath),
    javaHome: config.get("javaHome"),
    storageDir: ext.globalStorageUri.fsPath,
    tracerSource: asset("Tracer.java"),
    timeoutSeconds: config.get("timeoutSeconds"),
    maxSteps: config.get("maxSteps"),
  });
  if (session !== s) return;
  s.busy = false;
  if (result.error) post({ type: "error", text: result.error });
  else post({ type: "trace", trace: result.trace, ms: result.ms, keep: { index: s.index, line: s.line }, showCode: config.get("showCodeInPanel"), hasInput: inputs.has(s.uri.fsPath) });
  if (s.again) { s.again = false; refresh(); }
}

function onMessage(msg) {
  if (!session) return;
  if (msg.type === "ready") refresh();
  else if (msg.type === "rerun") refresh();
  else if (msg.type === "setInput") vscode.commands.executeCommand("javaStepVisualizer.setInput");
  else if (msg.type === "notFound") vscode.window.setStatusBarMessage(`Line ${msg.line} doesn't run in this recording`, 3000);
  else if (msg.type === "step") {
    Object.assign(session, { index: msg.index, line: msg.line, callers: msg.callers, ran: msg.ran, hint: msg.hint });
    paint(true);
  }
}

// Highlight the step in every editor showing the file
function paint(reveal = false) {
  if (!session || !session.line) return;
  const show = settings().get("inlineHints");
  for (const editor of vscode.window.visibleTextEditors) {
    if (!sameFile(editor.document.uri)) continue;
    const doc = editor.document;
    const lineRange = (n) => (n >= 1 && n <= doc.lineCount ? doc.lineAt(n - 1).range : null);
    const cur = lineRange(session.line);
    editor.setDecorations(decorations.current, cur ? [cur] : []);
    editor.setDecorations(decorations.caller, (session.callers || []).map(lineRange).filter(Boolean));
    const hintAt = lineRange(session.ran || session.line);
    editor.setDecorations(decorations.hint, show && hintAt && session.hint
      ? [{ range: hintAt, renderOptions: { after: { contentText: `⟵ ${session.hint}` } } }] : []);
    if (reveal && cur) editor.revealRange(cur, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }
}

function clearPaint() {
  for (const editor of vscode.window.visibleTextEditors) Object.values(decorations).forEach(d => editor.setDecorations(d, []));
}

function html(webview) {
  const nonce = Array.from({ length: 24 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("");
  const uri = (file) => webview.asWebviewUri(vscode.Uri.file(file));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${uri(asset("visualizer.css"))}">
  <link rel="stylesheet" href="${uri(path.join(ext.extensionPath, "webview", "panel.css"))}">
</head>
<body>
  <div id="status" hidden></div>
  <div id="root"><div class="panel-empty">Recording…</div></div>
  <script nonce="${nonce}" src="${uri(asset("visualizer.js"))}"></script>
  <script nonce="${nonce}" src="${uri(path.join(ext.extensionPath, "webview", "panel.js"))}"></script>
</body>
</html>`;
}

function deactivate() {}

module.exports = { activate, deactivate };
