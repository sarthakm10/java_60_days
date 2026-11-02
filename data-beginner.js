// ============================================================
// Java Fullstack — Beginner Track (100 days, from zero to job-ready)
//
// Each day lists its subtopics as one of:
//   ["b3_t1_s2", "label"]   a new beginner subtopic
//   "d1_t1_s1"              a subtopic borrowed from the Interview track (data.js), with its label and notes
//   ["d1_t1_s1", "label"]   a borrowed subtopic shown with a simpler label
// dsa(N) borrows the whole DSA topic of Interview day N (its question sets follow it here).
// `practice` lists exercise ids from practice/day-NN.md (an id dN_eM lives in day N's file).
//
// Ids are permanent progress keys: keep them when a subtopic moves to another day.
// Progress is stored per track, so a borrowed id ticked here does not tick it in the Interview track.
// ============================================================

const BEGINNER_PHASES = [
  "Phase 1: Programming Basics",
  "Phase 2: Object-Oriented Java",
  "Phase 3: Generics & Collections",
  "Phase 4: Modern Java",
  "Phase 5: Concurrency & the JVM",
  "Phase 6: Backend Foundations",
  "Phase 7: Spring Boot",
  "Phase 8: Design Principles & Patterns",
  "Phase 9: Deploy & Scale",
  "Phase 10: System Design & Interview Prep"
];

const BEGINNER_DATA = (() => {
  const interviewSubs = new Map();
  CURRICULUM_DATA.forEach(d => d.topics.forEach(t => t.subtopics.forEach(s => interviewSubs.set(s.id, s))));

  const sub = (entry) => {
    const [id, label] = Array.isArray(entry) ? entry : [entry];
    const borrowed = interviewSubs.get(id);
    if (!borrowed && !label) {
      console.error(`Beginner track: unknown subtopic id ${id}`);
      return null;
    }
    return borrowed ? { id, label: label || borrowed.label, borrowed: true } : { id, label };
  };
  // sourceDay: the Interview day whose DSA topic this replaces, so that day's question sets show up here
  const topic = (category, name, subtopics, sourceDay) => ({ category, name, subtopics, ...(sourceDay ? { sourceDay } : {}) });
  // Topic `index` of Interview day `day` (or its first DSA topic), minus ids already placed on another day
  const fromDay = (day, index, except = []) => {
    const source = CURRICULUM_DATA.find(d => d.day === day);
    const t = index === undefined ? source.topics.find(x => x.category === "DSA") : source.topics[index];
    return { category: t.category, name: t.name, subtopics: t.subtopics.map(s => s.id).filter(id => !except.includes(id)), sourceDay: day };
  };
  const dsa = (day, except) => fromDay(day, undefined, except);

  const DAYS = [
    // ===================== PHASE 1: PROGRAMMING BASICS (Days 1–12) =====================
    { p: 0, title: "Welcome to Java — Set Up and Run Your First Program", practice: ["b1_e1", "b1_e2", "b1_e3"], topics: [
      topic("Java", "Java — Getting Started", [
        ["b1_t1_s1", "What programming is — writing exact instructions that a computer follows step by step"],
        ["b1_t1_s2", "What Java is and where it is used (backend servers, Android, banks, big tech) and why it is a good first language"],
        ["b1_t1_s3", "JDK, JRE and JVM in simple words — javac turns your code into bytecode, the JVM runs it on any computer"],
        ["b1_t1_s4", "Install JDK 21 and IntelliJ IDEA Community (or VS Code with the Java extensions); create your first project"],
        ["b1_t1_s5", "Hello World line by line — class, main method, System.out.println, semicolons and curly braces"],
        ["b1_t1_s6", "Run it from the terminal: javac Hello.java then java Hello, or both in one step with java Hello.java"]
      ]),
      topic("DSA", "Practice — Your First Programs", [
        ["b1_t2_s1", "Print your name, age and city on three separate lines"],
        ["b1_t2_s2", "Print a 5 × 5 box of stars using only println"],
        ["b1_t2_s3", "Break the program on purpose (remove a semicolon, misspell main) and read what the error says"]
      ])
    ] },
    { p: 0, title: "Variables and Data Types", practice: ["b2_e1", "b2_e2", "b2_e3"], topics: [
      topic("Java", "Java — Variables & Data Types", [
        ["b2_t1_s1", "Variables — a named box that holds a value; declaring, assigning and changing it"],
        ["b2_t1_s2", "The 8 primitive types — int, long, double, float, boolean, char, byte, short — and which one to pick"],
        ["b2_t1_s3", "String for text; joining text with + and printing variables inside messages"],
        ["b2_t1_s4", "Naming rules and conventions — camelCase, meaningful names; constants with final"],
        ["b2_t1_s5", "Comments — //, /* */ and /** */; writing code other people can read"],
        ["b2_t1_s6", "var for local variables (Java 10+) — the compiler works out the type, and it still cannot change"]
      ]),
      topic("DSA", "Practice — Variables", [
        ["b2_t2_s1", "Store a student's name, roll number, marks and pass/fail in variables and print a report card"],
        ["d1_t2_s4", "Create a LeetCode or HackerRank account; solve Print Hello World and Swap Two Numbers"],
        ["b2_t2_s3", "Swap two numbers without a third variable (using + and −)"]
      ])
    ] },
    { p: 0, title: "Operators, Input and Type Casting", practice: ["b3_e1", "b3_e2", "b3_e3"], topics: [
      topic("Java", "Java — Operators & Input", [
        ["b3_t1_s1", "Arithmetic operators + − * / % and the integer-division surprise (7 / 2 is 3)"],
        ["b3_t1_s2", "Assignment shortcuts (+=, −=, ++, −−) and the difference between i++ and ++i"],
        ["b3_t1_s3", "Comparison (==, !=, <, >, <=, >=) and logical operators (&&, ||, !)"],
        ["b3_t1_s4", "Type casting — widening happens automatically, narrowing needs a cast and can overflow"],
        ["b3_t1_s5", "Reading input with Scanner — nextInt, nextDouble, nextLine and the leftover-newline trap"],
        ["b3_t1_s6", "The Math class — max, min, abs, pow, sqrt, round, random"]
      ]),
      topic("DSA", "Practice — Calculations", [
        ["b3_t2_s1", "Simple-interest calculator that reads principal, rate and years from the user"],
        ["b3_t2_s2", "Celsius ↔ Fahrenheit converter"],
        ["b3_t2_s3", "Sum, average and remainder of three numbers entered by the user"]
      ])
    ] },
    { p: 0, title: "Making Decisions — if, else and switch", practice: ["b4_e1", "b4_e2", "b4_e3"], topics: [
      topic("Java", "Java — Conditions", [
        ["b4_t1_s1", "if, else if, else — choosing which code runs"],
        ["b4_t1_s2", "Nested conditions and combining checks with && and ||"],
        ["b4_t1_s3", "The ternary operator: condition ? valueIfTrue : valueIfFalse"],
        ["b4_t1_s4", "switch statements — case, break, default and accidental fall-through"],
        ["b4_t1_s5", "Modern switch with arrows (Java 14+) — no break needed, and it can return a value"]
      ]),
      topic("DSA", "Practice — Decisions", [
        ["b4_t2_s1", "Even or odd, positive or negative"],
        ["b4_t2_s2", "Largest of three numbers"],
        ["b4_t2_s3", "Marks to grade (A/B/C/D/F) with if-else, then again with switch"],
        ["b4_t2_s4", "Leap-year checker"]
      ])
    ] },
    { p: 0, title: "Loops — Repeating Work", practice: ["b5_e1", "b5_e2", "b5_e3"], topics: [
      topic("Java", "Java — Loops", [
        ["b5_t1_s1", "for loop — start, condition, update; counting up and down"],
        ["b5_t1_s2", "while and do-while — when you don't know in advance how many times to repeat"],
        ["b5_t1_s3", "break and continue — leaving a loop early or skipping one round"],
        ["b5_t1_s4", "Nested loops — a loop inside a loop (rows and columns)"],
        ["b5_t1_s5", "Common mistakes — off-by-one errors and infinite loops, and how to spot them"]
      ]),
      topic("DSA", "Practice — Loops & Patterns", [
        ["b5_t2_s1", "Multiplication table of any number"],
        ["b5_t2_s2", "Sum of 1 to N, and the sum of only the even numbers"],
        ["b5_t2_s3", "Star patterns — right triangle, inverted triangle, pyramid"],
        ["b5_t2_s4", "Count the digits of a number and add them up"]
      ])
    ] },
    { p: 0, title: "Methods — Reusable Blocks of Code", practice: ["b6_e1", "b6_e2", "b6_e3"], topics: [
      topic("Java", "Java — Methods", [
        ["b6_t1_s1", "Why methods — give a piece of logic a name and reuse it"],
        ["b6_t1_s2", "Parameters and return values; void methods that return nothing"],
        ["b6_t1_s3", "Method overloading — the same name with different parameters"],
        ["b6_t1_s4", "Scope — a variable only exists inside the block where it is declared"],
        ["b6_t1_s5", "How method calls work — the call stack in simple words"],
        ["b6_t1_s6", "Java passes copies of values into methods (pass-by-value) — what that means for your variables"]
      ]),
      topic("DSA", "Practice — Methods", [
        ["b6_t2_s1", "isPrime(n) and a loop that prints all primes up to 100"],
        ["b6_t2_s2", "factorial(n) using a loop"],
        ["b6_t2_s3", "A calculator with one method per operation (add, subtract, multiply, divide)"]
      ])
    ] },
    { p: 0, title: "Arrays", practice: ["b7_e1", "b7_e2", "b7_e3"], topics: [
      topic("Java", "Java — Arrays", [
        ["d2_t2_s1", "What an array is — a fixed-size row of values of one type; declaring, creating, index starts at 0"],
        ["b7_t1_s2", "Looping over arrays with for and for-each; ArrayIndexOutOfBoundsException"],
        ["b7_t1_s3", "The Arrays helper class — Arrays.toString, Arrays.sort, Arrays.fill, Arrays.copyOf"],
        ["b7_t1_s4", "2D arrays — rows and columns, looping over a grid"],
        ["b7_t1_s5", "Arrays are references — two variables can point to the same array"]
      ]),
      topic("DSA", "DSA — Arrays: First Problems", ["d2_t2_s2", "d2_t2_s3", "d2_t2_s4", "d2_t2_s5"], 2)
    ] },
    { p: 0, title: "Strings and Characters", practice: ["b8_e1", "b8_e2", "b8_e3"], topics: [
      topic("Java", "Java — Strings", [
        ["b8_t1_s1", "char and its number code (ASCII / Unicode); 'a' + 1 and Character helper methods"],
        ["b8_t1_s2", "Everyday String methods — length, charAt, substring, indexOf, contains, toUpperCase, trim, split, replace"],
        ["b8_t1_s3", "Compare strings with equals(), not == (why, in simple words)"],
        ["b8_t1_s4", "Strings never change — every \"change\" creates a new String"],
        ["b8_t1_s5", "StringBuilder for building text in a loop — append, insert, reverse, toString"]
      ]),
      dsa(4)
    ] },
    { p: 0, title: "Debugging, Errors and Organising Code", practice: ["b9_e1", "b9_e2"], topics: [
      topic("Java", "Java — Debugging & Project Structure", [
        ["b9_t1_s1", "Reading compiler errors — cannot find symbol, missing semicolon, incompatible types"],
        ["b9_t1_s2", "Runtime errors and stack traces — how to read one from the top"],
        ["b9_t1_s3", "The IDE debugger — breakpoints, step over / step into, watching variables"],
        ["b9_t1_s4", "Packages and imports — organising classes into folders; import java.util.Scanner"],
        ["b9_t1_s5", "A project's layout — the src folder, package names, one public class per file"]
      ]),
      topic("DSA", "Practice — Find the Bug", [
        ["b9_t2_s1", "Fix a program with three compile errors using only the error messages"],
        ["b9_t2_s2", "Use breakpoints to find why a sum loop gives the wrong answer"],
        ["b9_t2_s3", "Move your earlier programs into packages and run them again"]
      ])
    ] },
    { p: 0, title: "Logic Building Practice", practice: ["b10_e1", "b10_e2", "b10_e3"], topics: [
      topic("DSA", "Practice — Number Problems", [
        ["b10_t1_s1", "Reverse a number and check if it is a palindrome"],
        ["b10_t1_s2", "Fibonacci series up to N terms (with a loop)"],
        ["b10_t1_s3", "GCD and LCM of two numbers"],
        ["b10_t1_s4", "Armstrong numbers and perfect numbers"],
        ["b10_t1_s5", "FizzBuzz from 1 to 100"]
      ]),
      topic("Java", "Java — Phase 1 Check-in", [
        ["b10_t2_s1", "Write a variable, an if, a loop, a method and an array from memory without looking"],
        ["b10_t2_s2", "Explain out loud: JDK vs JVM, int vs double, == vs equals() for Strings"]
      ])
    ] },
    { p: 0, title: "Time Complexity — How Fast Is My Code?", practice: ["b11_e1", "b11_e2"], topics: [
      topic("DSA", "DSA — Complexity Analysis", [
        "d1_t2_s1", "d1_t2_s2", "d1_t2_s3",
        ["b11_t1_s4", "Find the Big-O of five loops you wrote this week (single, nested, halving)"]
      ], 1),
      topic("DSA", "Practice — Faster Solutions", [
        ["b11_t2_s1", "Sum of 1 to N in O(1) with a formula instead of a loop"],
        ["b11_t2_s2", "Check primes faster by looping only up to √n"]
      ])
    ] },
    { p: 0, title: "Git, GitHub and Your First Mini Project", practice: ["b12_e1"], topics: [
      topic("DB/DevOps", "Tools — Terminal, Git & GitHub", [
        ["b12_t1_s1", "Terminal basics — cd, ls / dir, mkdir; running Java from the terminal"],
        ["b12_t1_s2", "Git in simple words — save snapshots of your project: init, status, add, commit, log"],
        ["b12_t1_s3", "GitHub — create a repository, push your code, write a README"],
        ["b12_t1_s4", "Branches — create, switch and merge one; .gitignore for build files"]
      ]),
      topic("Java", "Project — Guess the Number", [
        ["b12_t2_s1", "Build a console game: the computer picks a random number, the player guesses, the game says higher or lower"],
        ["b12_t2_s2", "Count attempts, add a play-again option, split the code into methods"],
        ["b12_t2_s3", "Push the project to GitHub with a README that explains how to run it"]
      ])
    ] },

    // ===================== PHASE 2: OBJECT-ORIENTED JAVA (Days 13–23) =====================
    { p: 1, title: "Classes and Objects", practice: ["b13_e1", "b13_e2"], topics: [
      topic("Java", "Java — Classes & Objects", [
        ["b13_t1_s1", "Why object-oriented programming — modelling real things (a Car, a BankAccount) as objects"],
        "d1_t1_s1",
        ["b13_t1_s3", "Creating objects with new and calling their methods with a dot"],
        ["b13_t1_s4", "null and NullPointerException — a variable that points to no object"],
        ["b13_t1_s5", "Several objects of one class — each keeps its own field values"]
      ]),
      dsa(6)
    ] },
    { p: 1, title: "Encapsulation and Access Modifiers", practice: ["d1_e1"], topics: [
      topic("Java", "Java — Encapsulation", [
        "d3_t1_s1",
        "d1_t1_s2",
        ["b14_t1_s3", "Validate inside setters and constructors so an object can never hold bad data"],
        ["b14_t1_s4", "Constructor overloading and calling one constructor from another with this(...)"]
      ]),
      dsa(7)
    ] },
    { p: 1, title: "static and final", practice: ["d1_e3"], topics: [
      topic("Java", "Java — static & final", [
        "d1_t1_s4",
        "d1_t1_s5",
        ["b15_t1_s3", "When to use static — shared counters and utility methods like Math.max"],
        ["b15_t1_s4", "Constants with static final and UPPER_CASE names"]
      ]),
      dsa(15)
    ] },
    { p: 1, title: "Inheritance", practice: ["b16_e1", "b16_e2"], topics: [
      topic("Java", "Java — Inheritance", [
        "d2_t1_s1",
        ["b16_t1_s2", "The super keyword — calling the parent's constructor and methods"],
        "d1_t1_s3",
        ["b16_t1_s4", "protected in practice — what a child class can and cannot see"]
      ]),
      dsa(16)
    ] },
    { p: 1, title: "Polymorphism — One Name, Many Forms", practice: ["b17_e1", "b17_e2"], topics: [
      topic("Java", "Java — Polymorphism", [
        "d2_t1_s2",
        "d2_t1_s3",
        "d2_t1_s4",
        ["b17_t1_s4", "Parent reference, child object — Animal a = new Dog() — and which method actually runs"],
        ["b17_t1_s5", "instanceof and safe casting, including pattern matching: if (a instanceof Dog d)"]
      ]),
      dsa(10)
    ] },
    { p: 1, title: "Abstraction — Abstract Classes and Interfaces", practice: ["d2_e1", "d2_e3"], topics: [
      topic("Java", "Java — Abstraction", ["d2_t1_s5", "d2_t1_s6", "d2_t1_s7", "d2_t1_s8"]),
      dsa(17)
    ] },
    { p: 1, title: "The Object Class, equals() and Wrapper Classes", practice: ["d1_e2", "d2_e2"], topics: [
      topic("Java", "Java — Object Class & Wrappers", ["d2_t4_s1", "d1_t1_s8", "d1_t1_s6", "d1_t1_s7"]),
      dsa(9)
    ] },
    { p: 1, title: "Enums, Records, Immutability and Comparing Objects", practice: ["d3_e1", "d3_e2", "d3_e3"], topics: [
      topic("Java", "Java — Enums, Records & Comparators", ["d3_t1_s8", "d6_t1_s8", "d3_t1_s2", "d14_t1_s8"]),
      dsa(8)
    ] },
    { p: 1, title: "Exceptions — Handling Errors", practice: ["d4_e1", "d4_e2"], topics: [
      topic("Java", "Java — Exceptions", ["d7_t1_s1", "d7_t1_s2", "d7_t1_s3", "d7_t1_s4", "d7_t1_s9"]),
      dsa(12)
    ] },
    { p: 1, title: "More OOP Tools — Inner Classes, Cloning and Serialization", practice: ["b22_e1", "b22_e2"], topics: [
      topic("Java", "Java — More OOP Tools", ["d3_t1_s6", "d3_t1_s7", "d2_t4_s2", "d3_t1_s4", "d3_t1_s5"]),
      dsa(13)
    ] },
    { p: 1, title: "OOP Project and Phase 2 Review", practice: ["b23_e1"], topics: [
      topic("Java", "Project — Library Management (console)", [
        ["b23_t1_s1", "Design the classes — Book, Member, Library — with their fields, methods and relationships"],
        ["b23_t1_s2", "Use inheritance or an interface where it fits (for example EBook extends Book)"],
        ["b23_t1_s3", "Handle problems with your own exceptions (BookNotAvailableException)"],
        ["b23_t1_s4", "Push it to GitHub with a README and a class diagram"]
      ]),
      topic("DSA", "Practice — Phase 2 Review", [
        ["b23_t2_s1", "Re-solve five problems from Days 7–22 without looking at your old code"],
        ["b23_t2_s2", "Explain out loud: overloading vs overriding, abstract class vs interface, checked vs unchecked"]
      ])
    ] },

    // ===================== PHASE 3: GENERICS & COLLECTIONS (Days 24–33) =====================
    { p: 2, title: "Generics", practice: ["b24_e1", "d4_e3"], topics: [
      topic("Java", "Java — Generics", [
        ["b24_t1_s1", "Why generics — one Box<T> class that works for any type, checked by the compiler"],
        "d7_t1_s5", "d7_t1_s6", "d7_t1_s7"
      ]),
      dsa(18)
    ] },
    { p: 2, title: "The Collections Framework and ArrayList", practice: ["b25_e1", "d11_e1"], topics: [
      topic("Java", "Collections — ArrayList", [
        "d11_t1_s1",
        ["b25_t1_s2", "Using ArrayList — add, get, set, remove, size, contains, and looping over it"],
        "d17_t1_s4", "d11_t1_s2", "d11_t1_s3", "d11_t1_s8"
      ]),
      dsa(20)
    ] },
    { p: 2, title: "LinkedList and List Pitfalls", practice: ["d11_e2", "d11_e3"], topics: [
      topic("Java", "Collections — LinkedList & Pitfalls", ["d11_t1_s4", "d11_t1_s5", "d11_t1_s7", "d11_t1_s9"]),
      dsa(24)
    ] },
    { p: 2, title: "HashMap — Using It Well", practice: ["b27_e1", "d12_e3"], topics: [
      topic("Java", "Collections — Using HashMap", [
        ["d5_t2_s1", "Key → value pairs with HashMap — put, get, containsKey, remove, getOrDefault"],
        "d12_t1_s9", "d12_t1_s3", "d12_t1_s8", "d13_t1_s3", "d13_t1_s4"
      ]),
      dsa(3)
    ] },
    { p: 2, title: "HashMap — How It Works Inside", practice: ["d12_e1", "d12_e2"], topics: [
      topic("Java", "Collections — HashMap Internals", ["d12_t1_s1", "d12_t1_s2", "d12_t1_s4", "d12_t1_s5", "d12_t1_s6", "d12_t1_s7"]),
      dsa(5, ["d5_t2_s1"])   // HashMap basics are taught on Day 27
    ] },
    { p: 2, title: "Sets", practice: ["d14_e1", "d14_e2", "d14_e3"], topics: [
      topic("Java", "Collections — Sets", ["d14_t1_s1", "d14_t1_s2", "d14_t1_s3", "d14_t1_s4", "d14_t1_s5", "d14_t1_s6"]),
      dsa(11)
    ] },
    { p: 2, title: "Queues, Stacks and Priority Queues", practice: ["d15_e1", "d15_e2"], topics: [
      topic("Java", "Collections — Queue & Deque", ["d15_t1_s1", "d15_t1_s2", "d15_t1_s3", "d15_t1_s4"]),
      dsa(14)
    ] },
    { p: 2, title: "TreeMap, LRU Cache and Special Maps", practice: ["d13_e2", "d13_e3"], topics: [
      topic("Java", "Collections — Sorted & Special Maps", ["d13_t1_s8", "d13_t1_s5", "d13_t1_s7", "d13_t1_s6", "d17_t1_s2", "d17_t1_s1"]),
      dsa(19)
    ] },
    { p: 2, title: "Collections Utilities and Common Patterns", practice: ["d16_e1", "d16_e2", "d16_e3"], topics: [
      topic("Java", "Collections — Utilities & Patterns", ["d16_t1_s1", "d16_t1_s2", "d16_t1_s3", "d16_t1_s4", "d16_t1_s6", "d16_t1_s7", "d16_t1_s8", "d17_t1_s6"]),
      dsa(21)
    ] },
    { p: 2, title: "Collections Review and Mini Project", practice: ["b33_e1", "d18_e1", "d18_e2"], topics: [
      topic("Java", "Collections — Review", [
        "d18_t1_s1", "d18_t1_s3", "d18_t1_s4", "d18_t1_s6",
        ["b33_t1_s5", "Mini project: a grade book using Map<String, List<Integer>> with averages, toppers and sorted reports"]
      ]),
      dsa(32)
    ] },

    // ===================== PHASE 4: MODERN JAVA (Days 34–37) =====================
    { p: 3, title: "Lambdas and Functional Interfaces", practice: ["d5_e1", "d5_e2", "d5_e3"], topics: [
      topic("Java", "Java — Lambdas & Functional Interfaces", ["d4_t1_s1", "d4_t1_s2", "d4_t1_s3", "d4_t1_s4", "d4_t1_s5", "d4_t1_s6", "d4_t1_s7", "d4_t1_s8"]),
      dsa(22)
    ] },
    { p: 3, title: "Streams — Part 1: Filter, Map and Collect", practice: ["d6_e1"], topics: [
      topic("Java", "Java — Stream Basics", ["d5_t1_s1", "d5_t1_s2", "d5_t1_s3", "d5_t1_s4", "d5_t1_s9"]),
      dsa(23)
    ] },
    { p: 3, title: "Streams — Part 2: Grouping and Reducing", practice: ["d6_e2", "d6_e3"], topics: [
      topic("Java", "Java — Advanced Streams", ["d5_t1_s5", "d5_t1_s6", "d5_t1_s7", "d5_t1_s8"]),
      dsa(25)
    ] },
    { p: 3, title: "Optional, Dates and Modern Java Features", practice: ["d7_e1", "d7_e2", "d7_e3"], topics: [
      topic("Java", "Java — Optional, Date/Time & Java 10–21", ["d6_t1_s1", "d6_t1_s2", "d6_t1_s3", "d6_t1_s5", "d6_t1_s6", "d6_t1_s7", "d6_t1_s9", "d7_t4_s1", "d7_t4_s2"]),
      dsa(26)
    ] },

    // ===================== PHASE 5: CONCURRENCY & THE JVM (Days 38–44) =====================
    { p: 4, title: "Threads — Doing Several Things at Once", practice: ["d8_e1"], topics: [
      topic("Java", "Java — Thread Basics", [
        ["b38_t1_s1", "Why concurrency — a program doing several things at once (an analogy with kitchen cooks)"],
        "d8_t1_s2", "d8_t1_s1", "d8_t1_s8"
      ]),
      dsa(27)
    ] },
    { p: 4, title: "Synchronization and Thread Safety", practice: ["d8_e2", "d8_e3"], topics: [
      topic("Java", "Java — Synchronization", ["d8_t1_s3", "d8_t1_s4", "d8_t1_s5", "d8_t1_s6", "d8_t1_s7"]),
      dsa(28)
    ] },
    { p: 4, title: "Executors and Thread Pools", practice: ["d9_e1", "d9_e2"], topics: [
      topic("Java", "Java — Executors & Futures", ["d9_t1_s1", "d9_t4_s1", "d9_t1_s2", "d9_t1_s3"]),
      dsa(29)
    ] },
    { p: 4, title: "Locks, Atomics and Concurrent Collections", practice: ["d13_e1", "d9_e3"], topics: [
      topic("Java", "Java — Locks & Concurrent Collections", ["d9_t1_s4", "d9_t1_s5", "d9_t1_s6", "d9_t1_s7", "d13_t1_s1", "d13_t1_s2", "d11_t1_s6", "d14_t1_s7"]),
      dsa(30)
    ] },
    { p: 4, title: "Producer–Consumer, Parallel Streams and Virtual Threads", practice: ["d15_e3", "d18_e3"], topics: [
      topic("Java", "Java — Advanced Concurrency", ["d15_t1_s5", "d15_t1_s6", "d15_t1_s7", "d17_t1_s5", "d9_t1_s8", "d9_t4_s2", "d8_t4_s1"]),
      dsa(31)
    ] },
    { p: 4, title: "Inside the JVM — Memory and Garbage Collection", practice: ["d17_e1", "d17_e2", "d17_e3"], topics: [
      topic("Java", "Java — JVM Internals", ["d7_t1_s8", "d17_t4_s1", "d17_t4_s2", "d17_t4_s3", "d10_t1_s6", "d10_t1_s7", "d17_t4_s4", "d17_t4_s5"]),
      dsa(33)
    ] },
    { p: 4, title: "Reflection, Annotations and Core Java Review", practice: ["d10_e2", "d10_e3"], topics: [
      topic("Java", "Java — Reflection & Annotations", ["d10_t4_s1", "d10_t4_s2", "d10_t4_s3"]),
      topic("Java", "Java — Core Java Review", ["d10_t1_s8", "d18_t1_s2", "d18_t1_s5", "d18_t4_s1"]),
      dsa(34)
    ] },

    // ===================== PHASE 6: BACKEND FOUNDATIONS (Days 45–51) =====================
    { p: 5, title: "How the Web Works — HTTP, REST and JSON", practice: ["b45_e1"], topics: [
      topic("Spring Boot", "Web — HTTP, REST & JSON", [
        ["b45_t1_s1", "Clients and servers — what happens when you open a URL (DNS, request, response) in simple words"],
        ["b45_t1_s2", "HTTP requests — method, URL, headers and body; GET, POST, PUT, PATCH, DELETE"],
        ["b45_t1_s3", "HTTP responses and status codes — 200, 201, 204, 400, 401, 403, 404, 409, 500"],
        ["b45_t1_s4", "What an API is; REST in simple words — URLs name resources, methods say what to do"],
        ["b45_t1_s5", "JSON — objects, arrays and values; how a Java object becomes JSON and back"],
        ["b45_t1_s6", "Try it — call a public API from the browser, curl and Postman"]
      ]),
      dsa(51)
    ] },
    { p: 5, title: "Build Tools and Unit Testing", practice: ["b46_e1"], topics: [
      topic("DB/DevOps", "Tools — Maven & Gradle", [
        ["b46_t1_s1", "Why build tools — downloading libraries, compiling, testing and packaging a JAR"],
        ["b46_t1_s2", "A Maven project — src/main/java, src/test/java, resources and pom.xml"],
        ["b46_t1_s3", "Dependencies — groupId:artifactId:version, Maven Central, transitive dependencies"],
        ["b46_t1_s4", "The Maven lifecycle — clean, compile, test, package, install; the ./mvnw wrapper"],
        ["b46_t1_s5", "Gradle in brief — build.gradle and how it compares with Maven"]
      ]),
      topic("Spring Boot", "Testing — Your First Unit Tests", [
        ["b46_t2_s1", "Why automated tests — catch mistakes before your users do"],
        "d24_t1_s5",
        "d24_t1_s8"
      ]),
      dsa(52)
    ] },
    { p: 5, title: "Databases and SQL Basics", practice: ["b47_e1"], topics: [
      topic("DB/DevOps", "SQL — Basics", [
        ["b47_t1_s1", "What a database is — tables, rows, columns and primary keys"],
        ["b47_t1_s2", "Install PostgreSQL (or open an online SQL playground) and create a database"],
        ["b47_t1_s3", "CREATE TABLE and column types; INSERT, UPDATE and DELETE rows"],
        ["b47_t1_s4", "SELECT with WHERE, ORDER BY and LIMIT; AND, OR, IN, BETWEEN, LIKE"],
        ["b47_t1_s5", "COUNT, SUM, AVG, MIN, MAX and GROUP BY"],
        "d51_t1_s5",
        ["b47_t1_s7", "Foreign keys and relationships — one-to-many and many-to-many with a join table"]
      ]),
      dsa(37)
    ] },
    { p: 5, title: "SQL Joins, Subqueries and CTEs", practice: ["b48_e1", "b48_e2"], topics: [
      topic("DB/DevOps", "SQL — Joins & Subqueries", ["d51_t1_s1", "d51_t1_s2", "d51_t1_s3", "d51_t1_s4", "d51_t1_s6", "d51_t1_s7"]),
      dsa(38)
    ] },
    { p: 5, title: "SQL Window Functions", practice: ["b49_e1"], topics: [
      topic("DB/DevOps", "SQL — Window Functions", ["d52_t1_s1", "d52_t1_s2", "d52_t1_s3", "d52_t1_s4", "d52_t1_s5", "d52_t1_s6", "d52_t1_s7"]),
      dsa(41)
    ] },
    { p: 5, title: "Indexes and Transactions", practice: ["b50_e1"], topics: [
      topic("DB/DevOps", "SQL — Performance & Transactions", ["d53_t1_s1", "d53_t1_s2", "d53_t1_s3", "d53_t1_s4", "d53_t1_s5", "d53_t1_s6", "d53_t1_s7"]),
      dsa(53)
    ] },
    { p: 5, title: "Database Design, JDBC and NoSQL", topics: [
      topic("DB/DevOps", "Databases — Design & JDBC", [
        "d39_t1_s5", "d39_t1_s6",
        ["b51_t1_s3", "JDBC — connect Java to a database with Connection, PreparedStatement and ResultSet"],
        ["b51_t1_s4", "SQL injection and why PreparedStatement prevents it; why frameworks like JPA exist"]
      ]),
      topic("DB/DevOps", "Databases — NoSQL", ["d54_t1_s1", "d54_t1_s2", "d54_t1_s3", "d54_t1_s4"]),
      dsa(55)
    ] },

    // ===================== PHASE 7: SPRING BOOT (Days 52–67) =====================
    { p: 6, title: "Spring Core — IoC and Dependency Injection", practice: ["d19_e1"], topics: [
      topic("Spring Boot", "Spring — IoC & Dependency Injection", [
        ["b52_t1_s1", "The problem Spring solves — objects creating their own dependencies vs being handed them"],
        "d19_t1_s1", "d19_t1_s2", "d19_t1_s3", "d19_t1_s4"
      ]),
      fromDay(42, 1)
    ] },
    { p: 6, title: "Beans — Scopes, Lifecycle and Configuration", practice: ["d19_e2"], topics: [
      topic("Spring Boot", "Spring — Beans", [
        ["b53_t1_s1", "@Configuration and @Bean — creating beans yourself, e.g. for library classes"],
        "d19_t1_s5", "d19_t1_s6", "d19_t1_s7"
      ]),
      fromDay(42, 0)
    ] },
    { p: 6, title: "Your First Spring Boot App", practice: ["b54_e1"], topics: [
      topic("Spring Boot", "Spring Boot — Getting Started", [
        ["b54_t1_s1", "Create a project at start.spring.io (Spring Web, DevTools), open it in the IDE and run it"],
        "d20_t1_s1", "d20_t1_s2",
        ["b54_t1_s4", "application.properties / application.yml — server.port, logging levels, your own settings"],
        ["b54_t1_s5", "Your first endpoint — @RestController with @GetMapping returning text, then a JSON object"]
      ]),
      dsa(46)
    ] },
    { p: 6, title: "Building a REST API", practice: ["d20_e1"], topics: [
      topic("Spring Boot", "Spring Boot — REST APIs", [
        "d20_t1_s3", "d20_t1_s4", "d20_t1_s5",
        ["b55_t1_s4", "Layers — Controller → Service → Repository, and DTOs to shape requests and responses"],
        ["b55_t1_s5", "Test every endpoint with Postman or curl, including the error cases"]
      ]),
      dsa(47)
    ] },
    { p: 6, title: "Validation and Error Handling", practice: ["d20_e2"], topics: [
      topic("Spring Boot", "Spring Boot — Validation & Errors", ["d20_t1_s6", "d20_t1_s7", "d20_t1_s8"]),
      dsa(56)
    ] },
    { p: 6, title: "Testing Spring Boot Apps", practice: ["d24_e1", "d24_e2", "d24_e3"], topics: [
      topic("Spring Boot", "Testing — Mockito & Spring Tests", ["d24_t1_s1", "d24_t1_s6", "d24_t1_s2", "d24_t1_s3", "d24_t1_s4"]),
      dsa(48)
    ] },
    { p: 6, title: "Spring Data JPA — Entities and Repositories", practice: ["d21_e1"], topics: [
      topic("Spring Boot", "Spring Data JPA — Basics", [
        ["b58_t1_s1", "ORM in simple words — Java objects ↔ table rows; JPA vs Hibernate vs Spring Data JPA"],
        "d21_t1_s1", "d21_t1_s7",
        ["b58_t1_s4", "Derived query methods — findByEmail, findByAgeGreaterThan, existsBy…"],
        "d21_t1_s5"
      ]),
      dsa(49)
    ] },
    { p: 6, title: "JPA Relationships and the N+1 Problem", practice: ["d21_e2", "d21_e3"], topics: [
      topic("Spring Boot", "Spring Data JPA — Relationships & Performance", ["d21_t1_s2", "d21_t1_s3", "d21_t1_s4", "d21_t1_s6", "d21_t1_s8"]),
      dsa(50)
    ] },
    { p: 6, title: "Transactions and Database Migrations", practice: ["d22_e1", "d22_e2", "d22_e3"], topics: [
      topic("Spring Boot", "Spring — Transactions & Hibernate", ["d22_t1_s1", "d22_t1_s2", "d22_t1_s3", "d22_t1_s4", "d22_t1_s5", "d22_t1_s6", "d22_t1_s7"])
    ] },
    { p: 6, title: "Spring Security — The Basics", practice: ["d23_e1"], topics: [
      topic("Spring Boot", "Spring Security — Basics", [
        ["b61_t1_s1", "Authentication (who are you?) vs authorization (what may you do?) in simple words"],
        "d23_t1_s1", "d23_t1_s8", "d23_t1_s6", "d23_t1_s7"
      ])
    ] },
    { p: 6, title: "Spring Security — JWT and OAuth2", practice: ["d23_e2", "d23_e3"], topics: [
      topic("Spring Boot", "Spring Security — Tokens", ["d23_t1_s2", "d23_t1_s3", "d23_t1_s4", "d23_t1_s5"])
    ] },
    { p: 6, title: "Configuration, Profiles, Logging and Actuator", practice: ["d25_e1", "d25_e2", "d25_e3"], topics: [
      topic("Spring Boot", "Spring Boot — Production Features", ["d25_t1_s4", "d25_t1_s5", "d25_t1_s6", "d25_t1_s7", "d25_t1_s1", "d25_t1_s2", "d25_t1_s3", "d25_t1_s8"])
    ] },
    { p: 6, title: "AOP and How Spring Works Inside", practice: ["d19_e3", "d26_e1", "d20_e3"], topics: [
      topic("Spring Boot", "Spring — Under the Hood", ["d19_t1_s8", "d26_t1_s6", "d26_t1_s5", "d26_t1_s1"]),
      dsa(40)
    ] },
    { p: 6, title: "Project Day 1 — Plan and Build a Task Manager API", topics: [
      topic("Spring Boot", "Project — Task Manager API (Part 1)", [
        ["b65_t1_s1", "Plan the app — users, projects and tasks; sketch the tables and the endpoints"],
        ["b65_t1_s2", "Create the project with Web, Data JPA, Validation, PostgreSQL and Flyway"],
        ["b65_t1_s3", "Entities, repositories and Flyway migration scripts"],
        ["b65_t1_s4", "CRUD endpoints for tasks with DTOs and validation"]
      ])
    ] },
    { p: 6, title: "Project Day 2 — Security and Tests", topics: [
      topic("Spring Boot", "Project — Task Manager API (Part 2)", [
        ["b66_t1_s1", "Sign-up and login with BCrypt and JWT"],
        ["b66_t1_s2", "Users can only see and change their own tasks"],
        ["b66_t1_s3", "Unit tests for the service and @WebMvcTest tests for the controller"],
        ["b66_t1_s4", "Global error handling that returns the same error JSON everywhere"]
      ])
    ] },
    { p: 6, title: "Project Day 3 — Polish and Phase 7 Review", practice: ["d26_e2", "d26_e3"], topics: [
      topic("Spring Boot", "Project — Task Manager API (Part 3)", [
        ["b67_t1_s1", "Pagination, sorting and filtering on the task list"],
        ["b67_t1_s2", "dev and prod profiles, logging and an Actuator health check"],
        ["b67_t1_s3", "A README with setup steps and the API list; push to GitHub"]
      ]),
      topic("Spring Boot", "Spring — Review", ["d26_t1_s2", "d26_t1_s3", "d26_t1_s4"])
    ] },

    // ===================== PHASE 8: DESIGN PRINCIPLES & PATTERNS (Days 68–72) =====================
    { p: 7, title: "SOLID and Clean Code Principles", practice: ["d10_e1"], topics: [
      topic("System Design", "Design — SOLID & Clean Code", ["d10_t1_s1", "d10_t1_s2", "d10_t1_s3", "d10_t1_s4", "d10_t1_s5", "d39_t1_s4"])
    ] },
    { p: 7, title: "Creational Design Patterns", topics: [fromDay(32, 0)] },
    { p: 7, title: "Structural and Behavioral Design Patterns", topics: [fromDay(33, 0)] },
    { p: 7, title: "Low-Level Design — Machine Coding I", topics: [
      topic("System Design", "LLD — Machine Coding", ["d34_t1_s1", "d34_t1_s2", "d34_t1_s3", "d34_t1_s5"])
    ] },
    { p: 7, title: "Low-Level Design — Machine Coding II", topics: [
      topic("System Design", "LLD — More Machine Coding", ["d34_t1_s4", "d39_t1_s1", "d39_t1_s2", "d39_t1_s3"])
    ] },

    // ===================== PHASE 9: DEPLOY & SCALE (Days 73–91) =====================
    { p: 8, title: "Docker Basics", topics: [
      topic("DB/DevOps", "DevOps — Docker Basics", [
        ["b73_t1_s1", "Containers in simple words — why \"it works on my machine\" happens and how images fix it"],
        "d30_t1_s1", "d30_t1_s5", "d30_t1_s3", "d30_t1_s6"
      ])
    ] },
    { p: 8, title: "Docker in Depth and Testcontainers", topics: [
      topic("DB/DevOps", "DevOps — Better Images & Real Tests", ["d30_t1_s2", "d30_t1_s4", "d24_t1_s7"])
    ] },
    { p: 8, title: "Microservices — Why and How to Split", topics: [
      topic("System Design", "Microservices — Basics", ["d27_t1_s1", "d27_t1_s2", "d27_t1_s3", "d28_t1_s3", "d28_t1_s5", "d28_t1_s6"])
    ] },
    { p: 8, title: "Microservices — Resilience", topics: [
      topic("System Design", "Microservices — Resilience", ["d27_t1_s4", "d27_t1_s5", "d29_t1_s1", "d29_t1_s2", "d29_t1_s3", "d29_t1_s7"])
    ] },
    { p: 8, title: "Microservices — Data and Transactions", topics: [
      topic("System Design", "Microservices — Data Patterns", ["d27_t1_s6", "d27_t1_s7", "d28_t1_s7", "d28_t1_s1", "d28_t1_s2", "d28_t1_s4"])
    ] },
    { p: 8, title: "Observability — Logs, Metrics and Traces", topics: [
      topic("System Design", "Microservices — Observability", ["d29_t1_s4", "d29_t1_s5", "d29_t1_s6", "d34_t1_s6", "d40_t1_s3", "d40_t1_s4", "d40_t1_s6"])
    ] },
    { p: 8, title: "Kafka — Core Concepts", topics: [
      topic("System Design", "Kafka — Fundamentals", [
        ["b79_t1_s1", "Messaging in simple words — why services publish events instead of calling each other"],
        "d35_t1_s1", "d35_t1_s2", "d35_t1_s3", "d35_t1_s4", "d35_t1_s5"
      ])
    ] },
    { p: 8, title: "Kafka with Spring Boot", topics: [
      topic("Spring Boot", "Kafka — Spring Boot Integration", ["d35_t2_s1", "d35_t2_s2", "d35_t2_s3", "d35_t1_s6", "d35_t1_s7", "d36_t1_s7"])
    ] },
    { p: 8, title: "Kafka — Reliability and Error Handling", topics: [
      topic("System Design", "Kafka — Delivery Guarantees & Errors", ["d36_t1_s1", "d36_t1_s2", "d36_t1_s3", "d36_t1_s4", "d36_t1_s5", "d36_t1_s6"]),
      topic("Spring Boot", "Kafka — Interview Q&A", ["d36_t2_s1", "d36_t2_s2", "d36_t2_s3"])
    ] },
    { p: 8, title: "Kafka — Advanced Topics", topics: [fromDay(37, 0)] },
    { p: 8, title: "Kafka — Interview Questions", topics: [
      topic("System Design", "Kafka — Consumer Deep Dive", ["d38_t1_s1", "d38_t1_s2", "d38_t1_s3", "d38_t1_s4", "d38_t1_s5", "d38_t1_s6", "d38_t1_s7"]),
      topic("System Design", "Kafka — Review", ["d40_t1_s1", "d40_t1_s2"])
    ] },
    { p: 8, title: "Kubernetes, CI/CD and Team Git Workflows", topics: [
      fromDay(31, 0),
      topic("DB/DevOps", "Tools — Git in a Team", ["d54_t1_s5", "d54_t1_s6"])
    ] },
    { p: 8, title: "AWS — Accounts, IAM and Networking", topics: [
      topic("DB/DevOps", "AWS — Getting Started", [
        ["b85_t1_s1", "Cloud in simple words — renting computers; regions and availability zones"],
        ["b85_t1_s2", "Create an AWS account safely — free tier, a billing alarm, MFA on the root user"],
        "d45_t1_s5", "d45_t1_s6", "d45_t1_s8"
      ])
    ] },
    { p: 8, title: "AWS — Compute: EC2, ECS and Lambda", topics: [fromDay(44, 0)] },
    { p: 8, title: "AWS — Storage with S3", topics: [fromDay(43, 0)] },
    { p: 8, title: "AWS — Databases, Caching and Messaging", topics: [fromDay(48, 0)] },
    { p: 8, title: "AWS — Monitoring and Security", topics: [
      topic("DB/DevOps", "AWS — Monitoring & Keys", ["d45_t1_s1", "d45_t1_s2", "d45_t1_s3", "d45_t1_s4", "d45_t1_s7"])
    ] },
    { p: 8, title: "Terraform — Infrastructure as Code", topics: [fromDay(46, 0)] },
    { p: 8, title: "Terraform Practice and Cloud Review", topics: [
      topic("DB/DevOps", "DevOps — Terraform Practice & AWS Review", ["d47_t1_s1", "d47_t1_s2", "d47_t1_s3", "d47_t1_s4", "d47_t1_s5", "d49_t1_s5", "d49_t1_s1", "d49_t1_s3", "d49_t1_s4"])
    ] },

    // ===================== PHASE 10: SYSTEM DESIGN & INTERVIEW PREP (Days 92–100) =====================
    { p: 9, title: "System Design Fundamentals — Part 1", topics: [
      topic("System Design", "HLD — Core Concepts", ["d55_t1_s1", "d55_t1_s2", "d55_t1_s4", "d55_t1_s6", "d55_t1_s7"])
    ] },
    { p: 9, title: "System Design Fundamentals — Part 2", topics: [
      topic("System Design", "HLD — Scaling Techniques", ["d55_t1_s3", "d55_t1_s5", "d55_t1_s8", "d55_t1_s9", "d57_t1_s6"])
    ] },
    { p: 9, title: "System Design Practice", topics: [
      topic("System Design", "HLD — Practice Problems", ["d57_t1_s1", "d57_t1_s2", "d57_t1_s3", "d57_t1_s4", "d57_t1_s5", "d57_t1_s7"])
    ] },
    { p: 9, title: "Revision — Java and Collections", topics: [
      topic("Java", "Revision — Core Java", [
        ["d41_t1_s1", "Go through every \"What I Missed\" note on your roadmap and clear what you can"],
        "d41_t1_s2", "d41_t1_s3", "d50_t1_s1",
        ["d50_t1_s5", "Pick your 5 weakest areas and plan the remaining days around them"]
      ])
    ] },
    { p: 9, title: "Revision — Spring, Kafka and Cloud", topics: [
      topic("Spring Boot", "Revision — Backend Stack", ["d41_t1_s4", "d50_t1_s2", "d41_t1_s5", "d50_t1_s3", "d50_t1_s4", "d49_t1_s2", "d40_t1_s5"])
    ] },
    { p: 9, title: "Revision — SQL and System Design", topics: [fromDay(56, 0)] },
    { p: 9, title: "Behavioral Interviews and Final Weak Areas", topics: [
      fromDay(58, 0),
      topic("DB/DevOps", "Review — Final Weak Area Consolidation", [
        ["d59_t2_s1", "Read your \"What I Missed\" notes one last time and close the gaps"],
        "d59_t2_s2", "d59_t2_s3", "d59_t2_s4"
      ])
    ] },
    { p: 9, title: "Resume, LinkedIn and Your Project Story", topics: [fromDay(58, 1), fromDay(59, 0)] },
    { p: 9, title: "🎯 Final Mock Interview Day — You Are Ready!", time: "5–6 hrs", topics: [
      fromDay(60, 0), fromDay(60, 1), fromDay(60, 2),
      topic("Java", "🎉 Final Checklist", [
        ["d60_t4_s1", "✅ Review your progress — celebrate how far you have come since Hello World"],
        "d60_t4_s2", "d60_t4_s3",
        ["d60_t4_s4", "✅ Mental prep: rest well, picture it going well, trust 100 days of steady work"],
        ["d60_t4_s5", "🚀 You learned it from zero, step by step. Walk in and show them!"]
      ])
    ] }
  ];

  // Phase ranges ("Days 13–23") come from the order above
  const ranges = {};
  DAYS.forEach((d, i) => {
    const r = ranges[d.p] || (ranges[d.p] = { from: i + 1, to: i + 1 });
    r.to = i + 1;
  });

  return DAYS.map((d, i) => {
    const topics = d.topics.map(t => ({ ...t, subtopics: t.subtopics.map(sub).filter(Boolean) }));
    const count = topics.reduce((n, t) => n + t.subtopics.length, 0);
    return {
      day: i + 1,
      phase: BEGINNER_PHASES[d.p],
      phaseRange: `Days ${ranges[d.p].from}–${ranges[d.p].to}`,
      categories: [...new Set(topics.map(t => t.category))],
      title: d.title,
      estimatedTime: d.time || (count > 10 ? "3–4 hrs" : "2–3 hrs"),
      practice: d.practice || [],
      topics
    };
  });
})();
