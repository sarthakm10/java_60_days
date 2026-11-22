# NotebookLM Video Prompts: Beginner Track, Days 1–83

One prompt per video for every day that has notes. Days 84–100 (AWS, Terraform, system design, revision, mocks) have no notes files, so they have no videos here.

**Where the files are:** paths are relative to your `Java_Notes_Kunal_DSA_PlayList` folder, except the two that start with `Java_60_Days/` (the roadmap and the topics-not-covered overview, which live only in this project).

**How to make each video in NotebookLM:**
1. Upload the video's files to a notebook. You can keep one notebook per phase and add files as you go.
2. Click ✏️ on **Video Overview** and choose **Explainer**.
3. Under **Sources**, tick only that video's files.
4. Paste the prompt into **Customised topic** ("Describe your own"). Skip the ready-made topic buttons.
5. Set the language to English and click **Generate now**.

Some files are shared by several days, such as the graphs, DP and complexity notes. Those prompts say which sections to use, so each video covers only that day's part. If NotebookLM won't take a `.md` file, copy it and rename the copy to `.txt`. If a prompt is too long for the box, delete the "Key points" sentence.

---

## Day 1A: Roadmap + Git & GitHub
**Upload:** `Java_60_Days/notes/kunal/java_dsa_study_roadmap.md`, `kunal-java-notes-claude/java_04_video_git_github.md`
```text
For a total beginner. Start with a 2-min tour of the roadmap phases and why that order. Then Git: why it exists, a diagram of working directory → staging → repository, and init, status, add, commit, log, push step by step showing what each command changes. Explain branches and stash with visuals. Show common mistakes, and end with a recap and a task: push a first repo to GitHub.
```

## Day 1B: Programming basics, memory, flowcharts
**Upload:** `kunal-java-notes-claude/java_05_video_intro_programming.md`, `kunal-java-notes-claude/java_06_video_flowcharts_pseudocode.md`
```text
For a total beginner. Explain procedural vs functional vs OOP, and static vs dynamic typing (when errors are caught). Draw stack vs heap: two references pointing to one array, so a change through one shows through the other. Explain garbage collection. Then flowchart symbols, pseudocode, and the prime check, and why checking up to √n is enough, using factor pairs of 36. End with a recap and quiz.
```

## Day 1C: JDK, JRE, JVM
**Upload:** `kunal-java-notes-claude/java_07_video_java_architecture.md`
```text
For a total beginner. Animate the journey Hello.java → javac → .class bytecode → JVM (class loader, verifier, interpreter + JIT) → output. Explain why bytecode makes Java platform independent, JDK vs JRE vs JVM as nested boxes, and compile-time vs runtime errors with one example each. Answer "is Java compiled or interpreted?". End with running javac and java in a terminal.
```

## Day 2: First Java program, input, data types, casting
**Upload:** `kunal-java-notes-claude/java_08_video_first_java_program.md`
```text
For a total beginner. Explain every word of Hello World: public, class, static, void, main, String[] args, System.out.println. Show compiling and running. Scanner input and the bug where nextLine is skipped after nextInt, and its fix. A table of primitive types with sizes. Widening vs narrowing casting with predict-the-output pauses: 5/2, (int)3.99, (byte)300, 'a'+'b'. End with a quiz.
```

## Day 3: Conditionals, loops, switch, patterns
**Upload:** `kunal-java-notes-claude/java_09_video_conditionals_loops.md`, `kunal-java-notes-claude/java_10_video_switch_statements.md`, `kunal-java-notes-claude/java_22_video_patterns.md`
```text
For a total beginner. if/else as a flowchart. for, while and do-while, each traced in a table of iteration, i, condition and output. Trace reversing a number with n%10 and n/10, and Fibonacci. == vs .equals() with a string pool diagram. Switch fall-through when break is missing, and the arrow switch. Pattern printing: outer loop = rows, inner loop = columns, on a star triangle. Common mistakes, then a quiz.
```

## Day 4: Functions and methods
**Upload:** `kunal-java-notes-claude/java_11_video_functions_methods.md`
```text
For a total beginner. Why methods exist, a labelled method anatomy, and a call-stack animation of main calling sum(). Prove Java is always pass-by-value with stack/heap diagrams: swap(a, b) fails, changing arr[0] works, reassigning arr does not, and String is immutable. Scope and shadowing, varargs, and how Java picks an overload. End with a quiz and an isPrime practice task.
```

## Day 5A: Time complexity and Big-O
**Upload:** `kunal-java-notes-claude/java_24_video_time_space_complexity.md`
```text
For a total beginner. Cover ONLY sections 0–5; skip recurrences and Akra-Bazzi. Why we don't measure in seconds. Count the operations of a single loop (n), nested loops (n²) and a halving loop (log n). A growth chart of 1, log n, n, n log n, n², 2ⁿ. Rules: drop constants and lower terms, take the worst case. Analyse a few snippets with predict-then-reveal. Explain why n ≤ 10⁵ needs O(n log n).
```

## Day 5B: Arrays and ArrayList
**Upload:** `kunal-java-notes-claude/java_12_video_arrays_arraylist.md`
```text
For a total beginner. Why arrays exist. Memory: the reference on the stack, a contiguous block on the heap, 0-indexing, default values. null, NullPointerException and index-out-of-bounds demos. for-each and Arrays.toString. Arrays of objects hold references. Passing an array to a method. 2D arrays as an array of arrays. ArrayList: add/get/set/remove, how it grows by copying, and an array vs ArrayList table. Then a quiz.
```

---

## Day 6: Strings and StringBuilder
**Upload:** `kunal-java-notes-claude/java_21_video_strings_stringbuilder.md`
```text
For a beginner on Day 6 of a 100-day Java + DSA plan. Teach: Strings & StringBuilder. Key points: What is String?, String Creation: String Literal, Internal Working of String, String Pooling, String Immutability, String Comparison: ==, String Creation: new Keyword, String Comparison: .equals(), PrintStream Class, toString() Method, Pretty Printing in Java, Format Specifiers, String Performance. Draw the string pool, heap and character indexes, and trace each operation step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 7: Linear Search and Binary Search
**Upload:** `kunal-java-notes-claude/java_13_video_linear_search.md`, `kunal-java-notes-claude/java_14_video_binary_search.md`
```text
For a beginner on Day 7 of a 100-day Java + DSA plan. Teach: Linear search; Binary search. Key points: What is Searching?, Linear Search, Code for Linear Search, Search in String, Search in Range, Minimum Number, Search in 2D Arrays, Even Digits, DSAwithKunal, What is Binary Search?, Binary Search Algorithm, Why Binary Search?, Code for Binary Search, Order-Agnostic Binary Search. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 8: Binary Search Questions
**Upload:** `kunal-java-notes-claude/java_15_video_binary_search_questions.md`
```text
For a beginner on Day 8 of a 100-day Java + DSA plan. Teach: Binary search questions: LC 35, 744, 34, 33, 153, 410…. Key points: Preview, When do we apply Binary Search?, Ceiling of a Number, Floor of a Number, and Q2, Smallest Letter, First and Last Position in Sorted Array, Position of an Element in Infinite Sorted Array, Peak Index in Mountain Array, Why this bootcamp is the best?, Find in Mountain Array, Rotation Count. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 9: Binary Search in 2D Arrays
**Upload:** `kunal-java-notes-claude/java_16_video_binary_search_2d_arrays.md`
```text
For a beginner on Day 9 of a 100-day Java + DSA plan. Teach: Binary search in 2D: LC 240, 74. Key points: Searching in Matrices, Row Column Matrix, Code for Q1, Sorted Matrix, Code for Q2. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 10: Bitwise Operators and Number Systems
**Upload:** `kunal-java-notes-claude/java_25_video_bitwise_number_systems.md`
```text
For a beginner on Day 10 of a 100-day Java + DSA plan. Teach: Bitwise operators & number systems. Key points: Bitwise Operators, Number Systems, Number System Conversion, More Bitwise Operators, Question-01, Question-02, Question-03, Question-04, Question-05, Question-06, Question-07, Negative Binary Numbers, Range of Numbers, Formula to Calculate Range, Question-08, Question-09 (Amazon), Question-10. Show numbers as rows of bits and animate each bitwise operation bit by bit. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 11: Maths for DSA
**Upload:** `kunal-java-notes-claude/java_26_video_maths_for_dsa.md`
```text
For a beginner on Day 11 of a 100-day Java + DSA plan. Teach: Maths: primes, sieve, square root, GCD/LCM, modulo. Key points: Prime Numbers, Sieve of Eratosthenes, Complexity Analysis of SoE, Square Root, Newton Raphson Method, Complexity Analysis of NRM, Factors, Optimised Code for Factors, Modulo Properties, Die-Hard Example, HCF/GCD, Euclidean Algorithm, LCM. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 12: Bubble, Selection and Insertion Sort
**Upload:** `kunal-java-notes-claude/java_17_video_bubble_sort.md`, `kunal-java-notes-claude/java_18_video_selection_sort.md`, `kunal-java-notes-claude/java_19_video_insertion_sort.md`
```text
For a beginner on Day 12 of a 100-day Java + DSA plan. Teach: Bubble sort; Selection sort; Insertion sort. Key points: Bubble Sort, Why Bubble Sort?, Other Names of Bubble Sort, Complexity of Bubble Sort, Best Case, What is Selection Sort?, Complexity of Selection Sort, Worst Case, Stability, Use Case, Insertion Sort, Complexity of Insertion Sort, Why use Insertion Sort?. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 13: Cyclic Sort
**Upload:** `kunal-java-notes-claude/java_20_video_cyclic_sort.md`
```text
For a beginner on Day 13 of a 100-day Java + DSA plan. Teach: Cyclic sort: LC 268, 448, 287, 442, 645, 41. Key points: Teaser, Cyclic Sort, Algorithm for Cyclic Sort, Worst Case, Code for Cyclic Sort, Missing Number, Find All Numbers Disappeared in an Array, Find the Duplicate Number, Find All Duplicates in an Array, Set Mismatch, First Missing Positive. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 14: Complexity Part 2, Count Sort and Radix Sort
**Upload:** `kunal-java-notes-claude/java_24_video_time_space_complexity.md`, `kunal-java-notes-claude/java_59_video_count_sort.md`, `kunal-java-notes-claude/java_60_video_radix_sort.md`
```text
For a beginner on Day 14 of a 100-day Java + DSA plan. Teach: Time & space complexity: Ω, Θ, little-o/ω, space, sorting; Count sort; Radix sort. Use ONLY sections 6–12 of java_24_video_time_space_complexity; skip the rest. Key points: Big-Omega Notation, Big-Theta Notation, Little-Oh Notation, Little-Omega Notation, Space Complexity, The Idea Behind Count Sort, The Frequency Array, Simple Count Sort Code and Dry Run, The Idea Behind Radix Sort, LSD Radix Sort Digit by Digit Passes, Stable Count Sort for Each Digit. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 15: HashMap Usage and Two Pointers
**Upload:** `Java_60_Days/notes/kunal/topics_not_covered.md`, `kunal-java-notes-claude/java_57_video_hashmap_hashtable.md`, `DSA Topics Not Covered Notes/dsa_gap_02_two_pointers.md`
```text
For a beginner on Day 15 of a 100-day Java + DSA plan. Teach: HashMap / HashSet usage: put, get, getOrDefault, containsKey, merge; Two pointers. Use ONLY section 4 of java_57_video_hashmap_hashtable; skip the rest. Key points: Hashmaps in Java, The Idea and the Three Shapes, Opposite Ends: Pair Sum in a Sorted Array, Opposite Ends: Reversing and Palindromes, 3Sum and k-Sum. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 16: Prefix Sum and Difference Array
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_03_prefix_sum_difference_array.md`
```text
For a beginner on Day 16 of a 100-day Java + DSA plan. Teach: Prefix sum / difference array. Key points: The Idea, Building a Prefix Sum Array, Range Sum Queries, Balance Points: Pivot Index, Prefix Sum plus HashMap, More HashMap Variants, Prefix and Suffix Products, 2D Prefix Sums, Difference Arrays for Range Updates, Prefix XOR, Pitfalls and Problem List. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 17: Kadane's Algorithm
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_04_kadanes_algorithm.md`
```text
For a beginner on Day 17 of a 100-day Java + DSA plan. Teach: Kadane's algorithm. Key points: The Maximum Subarray Problem, From Brute Force to O(n), Kadane's Algorithm, Why It Works: Kadane Is DP, Returning the Subarray Itself, Maximum Sum Circular Subarray, Maximum Product Subarray, Best Time to Buy and Sell Stock, Maximum Absolute Sum and Minimum Subarray, 2D: Maximum Sum Rectangle. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 18: Sliding Window
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_01_sliding_window.md`
```text
For a beginner on Day 18 of a 100-day Java + DSA plan. Teach: Sliding window: fixed size first, then variable size. Key points: What a Sliding Window Is, When to Use It, Fixed-Size Window, Variable Window: Longest Valid, Variable Window: Shortest Valid, Windows with Frequency Counts, Minimum Window Substring, Counting Subarrays: the At-Most-K Trick, When Sliding Window Fails, Templates, Pitfalls and Problem List. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 19: Matrix Traversal
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_11_matrix_traversal.md`
```text
For a beginner on Day 19 of a 100-day Java + DSA plan. Teach: Matrix traversal: spiral, rotate, set zeroes. Key points: Indexing Basics, Direction Arrays and Bounds, Spiral Matrix I and II, Transpose, Reshape and Rotate Image, Set Matrix Zeroes in O(1) Space, Diagonals, Game of Life: In-Place State Encoding, Valid Sudoku: Rows, Columns, Boxes, Searching a Sorted Matrix (Recap), Pitfalls and Problem List. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 20: OOP 1–2 — Classes, Objects, static and Packages
**Upload:** `kunal-java-notes-claude/java_37_video_oops.md`, `kunal-java-notes-claude/java_38_video_oop_static_packages_singleton.md`
```text
For a beginner on Day 20 of a 100-day Java + DSA plan. Teach: OOP 1: classes, objects, constructors; OOP 2: packages, static, Singleton. Key points: What is OOP?, Classes, Objects, Dynamic Memory Allocation & the new Keyword, Constructors, The this Keyword, Constructor Overloading, Wrapper Classes, Packages example, Java Packages, import statement, Static elements example, static in Java, Static variable meaning, Non-static member inside a static. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 21: OOP 3 — Inheritance, Polymorphism, Encapsulation and Abstraction
**Upload:** `kunal-java-notes-claude/java_39_video_oop_principles.md`
```text
For a beginner on Day 21 of a 100-day Java + DSA plan. Teach: OOP 3: inheritance, polymorphism, encapsulation, abstraction. Key points: Principles of OOP, Inheritance, Example: Box, Explanation, private Keyword, super Keyword, Single Inheritance, Multiple Inheritance, Hierarchical Inheritance, Hybrid Inheritance, Polymorphism, Example: Shapes, Types of Polymorphism, Static Polymorphism, Overloading, Dynamic Polymorphism, Overriding. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 22: OOP 4–5 — Access Control, the Object Class, Abstract Classes and Interfaces
**Upload:** `kunal-java-notes-claude/java_40_video_access_control_object_class.md`, `kunal-java-notes-claude/java_41_video_abstract_classes_interfaces.md`
```text
For a beginner on Day 22 of a 100-day Java + DSA plan. Teach: OOP 4: access control, the Object class; OOP 5: abstract classes & interfaces. Key points: Example: private, public and protected modifiers, Rules for modifiers, When to use which modifier?, Important point for protected modifier, io Package, Multiple Inheritance Problem, Abstract Classes, Example of Abstract Classes, Abstract Constructors, Object of an Abstract Class, Interfaces. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 23: OOP 6 — Generics, Lambdas, Exceptions and Cloning
**Upload:** `kunal-java-notes-claude/java_42_video_generics_lambdas_exceptions_cloning.md`
```text
For a beginner on Day 23 of a 100-day Java + DSA plan. Teach: OOP 6: generics, Comparable/Comparator basics, lambdas, exceptions, cloning. Key points: Custom ArrayList, Problem with Custom ArrayList, Custom ArrayList using Generics, Working with Generics, Using Java Wildcards, Comparing Objects, Lambda Functions, Exception Handling, Exception Handling Keywords, Creating Custom Exception, Object Cloning, Shallow and Deep Copy. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 24: OOP 7 — Collections Framework, Vector and Enums
**Upload:** `kunal-java-notes-claude/java_43_video_collections_vector_enums.md`
```text
For a beginner on Day 24 of a 100-day Java + DSA plan. Teach: OOP 7: Collections framework, Vector, enums. Key points: Collections Framework, Need of Collection Framework in Java, Understanding Collection Framework, Vector Class, Vector Synchronisation, Vector Code Example, Enums in Java, Enum Inheritance. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 25: StringBuffer, BigInteger, BigDecimal and File Handling
**Upload:** `kunal-java-notes-claude/java_52_video_stringbuffer_data_formatting.md`, `kunal-java-notes-claude/java_53_video_biginteger_bigdecimal.md`, `kunal-java-notes-claude/java_54_video_file_handling.md`
```text
For a beginner on Day 25 of a 100-day Java + DSA plan. Teach: StringBuffer & formatting; BigInteger & BigDecimal; File handling. Key points: StringBuffer vs StringBuilder vs String, Constructors & Capacity, StringBuffer Methods, Why Primitives Overflow, Floating-Point Precision Errors, Creating BigInteger Objects, RoundingMode, Streams: The Big Picture, Byte Streams vs Character Streams, InputStream & InputStreamReader. Draw the string pool, heap and character indexes, and trace each operation step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 26: Project — Tic-Tac-Toe
**Upload:** `kunal-java-notes-claude/java_48_video_tic_tac_toe_game.md`
```text
For a beginner on Day 26 of a 100-day Java + DSA plan. Teach: Tic-Tac-Toe project: OOP in practice, also a common LLD question. Key points: Board Representation, Input Loop, Move Validation, Win Checking: Rows, Columns, Diagonals, Draw Detection, Game Loop. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 27: Generics in Depth
**Upload:** `Java Topics Not Covered Notes/java_gap_08_generics_in_depth.md`
```text
For a beginner on Day 27 of a 100-day Java + DSA plan. Teach: Generics in depth: bounds, wildcards, PECS, type erasure. Key points: Why Generics: A Quick Recap, Generic Classes and Interfaces, Generic Methods, Bounded Type Parameters, Invariance: Why List of Integer Is Not a List of Number, Wildcards, PECS: Producer Extends, Consumer Super, Type Erasure, Restrictions Caused by Erasure, Raw Types and Heap Pollution. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 28: Comparator and Comparable in Depth
**Upload:** `Java Topics Not Covered Notes/java_gap_03_comparator_comparable.md`
```text
For a beginner on Day 28 of a 100-day Java + DSA plan. Teach: Comparator & Comparable in depth. Key points: Why Objects Need Comparing, The compare Contract, Comparable: Natural Ordering, Comparator: Custom Ordering, Comparable vs Comparator, Modern Comparator Factory Methods, Multi-Key Sorting with thenComparing, Reversing and Handling Nulls, Where Comparators Are Used, Comparators in DSA Problems. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 29: Functional Interfaces and Optional
**Upload:** `Java Topics Not Covered Notes/java_gap_06_functional_interfaces_optional.md`
```text
For a beginner on Day 29 of a 100-day Java + DSA plan. Teach: Functional interfaces & Optional. Key points: What a Functional Interface Is, Lambdas Recap and Effectively Final, The Big Four: Function, Predicate, Consumer, Supplier, Bi- and Operator Variants, Primitive Specializations, Method References, Composing Functions, Writing Your Own Functional Interface, Optional: Why It Exists. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 30: Streams API
**Upload:** `Java Topics Not Covered Notes/java_gap_02_streams_api.md`
```text
For a beginner on Day 30 of a 100-day Java + DSA plan. Teach: Streams API. Key points: What is a Stream, Creating Streams, The Pipeline and Laziness, Intermediate Operations, flatMap, Terminal Operations, reduce in Depth, Collectors, groupingBy and partitioningBy, Primitive Streams, Parallel Streams, Java 9 to 21 Additions, Common Pitfalls, Streams for DSA and Interview Questions. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 31: Modern Java (Java 9–21)
**Upload:** `Java Topics Not Covered Notes/java_gap_07_modern_java_features.md`
```text
For a beginner on Day 31 of a 100-day Java + DSA plan. Teach: Modern Java: var, List.of, records, text blocks, switch expressions, sealed types, pattern matching. Key points: The Release Timeline, var: Local Variable Type Inference, Collection Factory Methods, New String Methods, Text Blocks, Switch Expressions, Records, Pattern Matching for instanceof, Sealed Classes and Interfaces, Pattern Matching for switch, Record Patterns, Sequenced Collections, Virtual Threads. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 32: Merge Intervals
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_05_merge_intervals.md`
```text
For a beginner on Day 32 of a 100-day Java + DSA plan. Teach: Merge intervals. Key points: Intervals and How They Can Overlap, The Overlap Test, Merge Intervals, Insert Interval, Interval List Intersections, Greedy by End Time: Non-Overlapping Intervals, Minimum Arrows to Burst Balloons, Meeting Rooms: Can Attend and Rooms Needed, The Sweep Line Technique, Calendar Booking with a TreeMap. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 33: Recursion and the Complexity of Recursive Programs
**Upload:** `kunal-java-notes-claude/java_23_video_recursion_intro.md`, `kunal-java-notes-claude/java_24_video_time_space_complexity.md`
```text
For a beginner on Day 33 of a 100-day Java + DSA plan. Teach: Recursion intro; Complexity of recursive programs: recurrences, Akra-Bazzi. Use ONLY sections 13–26 of java_24_video_time_space_complexity; skip the rest. Key points: Prerequisites, Message Program, Numbers Program, Working of function calls, What is Recursion?, Recursive Function for E2, Base Condition in Recursion, Complexity Analysis: Recursive Programs, Types of Recurrence Relations, Divide-and-Conquer Recurrence Relation, Akra-Bazzi Theorem, Example. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 34: Recursion Level 1 and Recursion on Arrays
**Upload:** `kunal-java-notes-claude/java_27_video_recursion_level1.md`, `kunal-java-notes-claude/java_28_video_recursion_arrays.md`
```text
For a beginner on Day 34 of a 100-day Java + DSA plan. Teach: Recursion level 1; Recursion on arrays. Key points: Revision, Q-01: n to 1, Q-02: 1 to n, Q-03: Product of n to 1, Q-04: Sum of n to 1, Q-05: Sum of digits, Q-06: Product of digits, Way-1 for Q-07, Sorted Array, Linear Search, Linear Search (on multiple occurrences), Return an ArrayList, Return the list without passing the argument. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 35: Recursion Patterns and Recursive Sorting
**Upload:** `kunal-java-notes-claude/java_29_video_recursion_patterns_sorting.md`
```text
For a beginner on Day 35 of a 100-day Java + DSA plan. Teach: Recursion patterns + recursive bubble/selection sort. Key points: Triangle 1, Triangle 2, Bubble Sort, Selection Sort. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 36: Merge Sort and Quick Sort
**Upload:** `kunal-java-notes-claude/java_30_video_merge_sort.md`, `kunal-java-notes-claude/java_31_video_quick_sort.md`
```text
For a beginner on Day 36 of a 100-day Java + DSA plan. Teach: Merge sort; Quick sort. Key points: Merge Sort, Steps for Merge Sort, Recursive Merge Sort, Explanation of E1, Time Complexity, Space Complexity, In-place Merge Sort, What is Pivot?, Recursive Quick Sort, How to put pivot at correct position?, How to pick the pivot?, Complexity comparison of pivot positions. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 37: Subsets and Subsequences
**Upload:** `kunal-java-notes-claude/java_32_video_recursion_subsets_strings.md`
```text
For a beginner on Day 37 of a 100-day Java + DSA plan. Teach: Subsets & subsequences: the take / don't-take choice. Key points: Basic String Questions using Recursion, Skip a character, Skip a string, Skip a string if it's not the required string, When to apply subset problem?, Subsequences, Return an ArrayList of string, Print ASCII value of a character, Subsequences with ASCII values, Complexity Analysis. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 38: Permutations, Dice and Phone Letters
**Upload:** `kunal-java-notes-claude/java_33_video_recursion_permutations.md`, `kunal-java-notes-claude/java_34_video_recursion_dice_phone_letters.md`
```text
For a beginner on Day 38 of a 100-day Java + DSA plan. Teach: Permutations; Dice & phone letters: LC 17, 1155. Key points: What is Permutation?, Permutation using Recursion, Code for Permutation, Returning output as an ArrayList, Counting Number of Permutations, Letter Combinations of a Phone Number, Code for Q1, Returning Q1 output as an ArrayList, Returning the count, Number of Dice Rolls with Target Sum. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 39: Backtracking — Maze, N-Queens, N-Knights and Sudoku
**Upload:** `kunal-java-notes-claude/java_35_video_backtracking_maze.md`, `kunal-java-notes-claude/java_36_video_nqueens_nknights_sudoku.md`
```text
For a beginner on Day 39 of a 100-day Java + DSA plan. Teach: Backtracking: maze; N-Queens, N-Knights, Sudoku. Key points: Teaser, Maze Problems, Counting Paths, Code for Q1, Printing Paths, Code for Q2, Including Diagonal Paths, Maze with Obstacles, Code for Q4, N-Queens Problem, How to determine if a problem is of recursion and backtracking?, Code for N-Queens Problem, How to eliminate for loops?. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 40: Combination-Style Backtracking
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_12_combination_backtracking.md`
```text
For a beginner on Day 40 of a 100-day Java + DSA plan. Teach: Combination Sum, Word Search, Palindrome Partitioning. Key points: The Backtracking Template, Subsets vs Combinations vs Permutations, Combinations, Combination Sum: Reuse Allowed, Combination Sum II and Subsets II: Skipping Duplicates, Combination Sum III: Two Constraints, Word Search, Partitioning Strings: Palindromes and IP Addresses, Generate Parentheses. Draw the recursion tree and the call stack, showing each call, its arguments and what it returns. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 41: Linked Lists · SOLID and Low-Level Design

### Video 41A: Linked Lists
**Upload:** `kunal-java-notes-claude/java_44_video_linked_list.md`
```text
For a beginner on Day 41 of a 100-day Java + DSA plan. Teach: Linked list. Key points: Limitations of Array/ArrayList, Working of LinkedList, Singly LinkedList, Insertion in Singly LinkedList, Display Singly LinkedList, Insertion in Singly LinkedList [Continuation], Deletion in Singly LinkedList, Some Common Doubts, Doubly LinkedList, Insertion in Doubly LinkedList. Draw the nodes and pointers and animate each pointer change step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 41B: SOLID and Low-Level Design
**Upload:** `Java Topics Not Covered Notes/java_gap_05_solid_low_level_design.md`
```text
For a beginner on Day 41 of a 100-day Java + DSA plan. Teach: SOLID & low-level design. Use ONLY sections 0–10 of java_gap_05_solid_low_level_design; skip the rest. Key points: Why Design Principles, Cohesion and Coupling, S: Single Responsibility Principle, O: Open/Closed Principle, L: Liskov Substitution Principle, I: Interface Segregation Principle, D: Dependency Inversion Principle, Other Principles: DRY, KISS, YAGNI, Demeter, Composition over Inheritance. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 42: Linked List Questions and Iterators

### Video 42A: Linked List Questions and Iterators
**Upload:** `kunal-java-notes-claude/java_45_video_linkedlist_interview_questions.md`
```text
For a beginner on Day 42 of a 100-day Java + DSA plan. Teach: Linked list questions: fast/slow pointers, reversal, merge. Key points: Q-01: Recursive Insertion in LinkedList, Q-02: Remove Duplicates from Sorted LinkedList, Q-03: Merge Two Sorted LinkedLists, Q-04: LinkedList Cycle, Q-05: Length of LinkedList Cycle, Q-06: LinkedList Cycle II, Q-07: Happy Number, Q-08: Middle of the LinkedList, Q-09: Sort LinkedList. Draw the nodes and pointers and animate each pointer change step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 42B: Iterator, Iterable, fail-fast vs fail-safe
**Upload:** `Java Topics Not Covered Notes/java_gap_10_iterator_fail_fast_fail_safe.md`
```text
For a beginner on Day 42 of a 100-day Java + DSA plan. Teach: Iterator, Iterable, fail-fast vs fail-safe. Key points: Iterable and Iterator, What for-each Really Does, The Iterator Methods, Making Your Own Class Iterable, ListIterator, ConcurrentModificationException and modCount, Removing Elements While Iterating, Fail-Fast vs Fail-Safe Iterators, Iterating Maps, Lazy and Infinite Iterators. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 43: Stacks, Queues and the Monotonic Stack · Design Patterns

### Video 43A: Stacks, Queues and the Monotonic Stack
**Upload:** `kunal-java-notes-claude/java_46_video_stacks_queues.md`, `DSA Topics Not Covered Notes/dsa_gap_08_monotonic_stack.md`
```text
For a beginner on Day 43 of a 100-day Java + DSA plan. Teach: Stacks & queues; Monotonic stack in depth. Key points: Stack Example, Push and Pop, Queue Example, Stack Data Structure, Queue Data Structure, When do we use Stacks & Queues?, Java Deque (Deck), ArrayDeque, The Idea, The Four Variants, Next Greater Element I and II, Daily Temperatures, Online Stock Span, Largest Rectangle in Histogram. Draw the nodes and pointers and animate each pointer change step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 43B: Design Patterns
**Upload:** `Java Topics Not Covered Notes/java_gap_04_design_patterns.md`
```text
For a beginner on Day 43 of a 100-day Java + DSA plan. Teach: Design patterns. Key points: What Design Patterns Are, Singleton Revisited, Factory Method and Simple Factory, Abstract Factory, Builder, Prototype, Adapter, Decorator, Proxy, Facade, Composite, Strategy, Observer, Command, Template Method, State, Chain of Responsibility, Choosing a Pattern and Interview Questions. Use class diagrams and stack/heap memory diagrams, with one running real-world example. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 44: Stack and Queue Questions, Monotonic Deque
**Upload:** `kunal-java-notes-claude/java_47_video_stack_queue_questions.md`, `DSA Topics Not Covered Notes/dsa_gap_09_monotonic_deque.md`
```text
For a beginner on Day 44 of a 100-day Java + DSA plan. Teach: Stack/queue questions: LC 232, 20, 84, 921, 1541; Monotonic deque: sliding window maximum. Key points: Thought process for questions, Q: Implement queue using stacks, Q: Game of two stacks, Q: Largest rectangle in histogram, Q: Valid parentheses, Why a Deque, ArrayDeque Quick Reference, Sliding Window Maximum, Max and Min Together: Longest Subarray Within a Limit, Pitfalls and Problem List. Draw the nodes and pointers and animate each pointer change step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 45: HashMap Internals and LRU / LFU Cache
**Upload:** `kunal-java-notes-claude/java_57_video_hashmap_hashtable.md`, `DSA Topics Not Covered Notes/dsa_gap_13_lru_lfu_cache.md`
```text
For a beginner on Day 45 of a 100-day Java + DSA plan. Teach: HashMap & HashTable internals: hashing, chaining, open addressing; LRU / LFU cache. Key points: How Hashmaps Work, Chaining, Open Addressing, Hashmaps in Java, Implementation, Closing Remarks, Caches and Eviction Policies, Why HashMap plus Doubly Linked List, LRU Cache from Scratch, The LinkedHashMap Shortcut, LFU Cache. Draw the nodes and pointers and animate each pointer change step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 46: Karp-Rabin · Multithreading and Concurrency

### Video 46A: Karp-Rabin
**Upload:** `kunal-java-notes-claude/java_58_video_karp_rabin.md`
```text
For a beginner on Day 46 of a 100-day Java + DSA plan. Teach: Karp-Rabin rolling hash. Key points: Naive String Search, The Hashing Idea, Polynomial Rolling Hash, Updating the Window, Collisions & Verification, Time & Space Complexity, Code: Karp-Rabin in Java. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 46B: Multithreading and Concurrency
**Upload:** `Java Topics Not Covered Notes/java_gap_01_multithreading_concurrency.md`
```text
For a beginner on Day 46 of a 100-day Java + DSA plan. Teach: Multithreading & concurrency. Key points: Why Concurrency, Creating Threads, Thread Lifecycle and States, Useful Thread Methods, Race Conditions, The synchronized Keyword, volatile and the Java Memory Model, wait, notify and Producer-Consumer, Deadlock, Livelock and Starvation, Explicit Locks, Atomic Variables and CAS, CompletableFuture. Show threads as parallel timelines and animate race conditions and how locks fix them. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 47: Binary Trees and BST
**Upload:** `kunal-java-notes-claude/java_49_video_binary_trees_bst.md`
```text
For a beginner on Day 47 of a 100-day Java + DSA plan. Teach: Binary trees & BST. Key points: Why Trees?, Where Is It Used?, Terminologies, Types of Binary Trees, Properties, Implementation - Binary Trees, Binary Search Trees, Traversals. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 48: Binary Tree Questions
**Upload:** `kunal-java-notes-claude/java_55_video_binary_tree_questions.md`
```text
For a beginner on Day 48 of a 100-day Java + DSA plan. Teach: Binary tree questions: BFS Q1–9, DFS Q10–24. Key points: Breadth First Search (BFS), Binary Tree Level Order Traversal, Average of Levels in Binary Tree, Level Order Successor of a Node, Binary Tree Zigzag Level Order Traversal, Binary Tree Level Order Traversal II, Populating Next Right Pointers in Each Node, Binary Tree Right Side View, Symmetric Tree. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 49: Tree from Preorder + Inorder, Vertical Order Traversal
**Upload:** `kunal-java-notes-claude/java_63_video_construct_tree_preorder_inorder.md`, `kunal-java-notes-claude/java_64_video_vertical_order_traversal.md`
```text
For a beginner on Day 49 of a 100-day Java + DSA plan. Teach: Tree from preorder + inorder: LC 105; Vertical order traversal: LC 987. Key points: The Problem: LeetCode 105, Key Insight: Root First, Then Split Inorder, Recursive Solution with Array Copies, HashMap Index Optimisation, Dry Run, The Problem: LeetCode 987 and 314, Column and Row Coordinates, Why BFS (Level Order), BFS with Queue, HashMap and Min-Max Column, TreeMap Alternative. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 50: Two Sum IV and Kth Smallest in a BST · JVM Internals

### Video 50A: Two Sum IV and Kth Smallest in a BST
**Upload:** `kunal-java-notes-claude/java_66_video_two_sum_bst.md`, `kunal-java-notes-claude/java_67_video_kth_smallest_bst.md`
```text
For a beginner on Day 50 of a 100-day Java + DSA plan. Teach: Two Sum IV in a BST: LC 653; Kth smallest in a BST: LC 230. Key points: Problem Statement: LeetCode 653, Approach 1: DFS with a HashSet, Dry Run: HashSet Approach, Approach 2: Inorder to Sorted List and Two Pointers, Problem Statement - LeetCode 230, Key Insight - Inorder of a BST Is Sorted, Brute Force - Collect the Inorder List, Recursive Inorder with a Counter. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 50B: JVM Internals
**Upload:** `Java Topics Not Covered Notes/java_gap_09_jvm_internals_gc.md`
```text
For a beginner on Day 50 of a 100-day Java + DSA plan. Teach: JVM internals & garbage collection. Key points: JVM Architecture Overview, Class Loading: Load, Link, Initialize, Class Loaders and Parent Delegation, Runtime Data Areas, Inside the Heap and Object Layout, The Execution Engine and the JIT Compiler, How Garbage Collection Finds Garbage, Generational Collection, The HotSpot Garbage Collectors. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 51: Tree to Doubly Linked List, Recover BST and AVL Trees
**Upload:** `kunal-java-notes-claude/java_68_video_binary_tree_to_dll.md`, `kunal-java-notes-claude/java_69_video_recover_bst.md`, `kunal-java-notes-claude/java_50_video_avl_trees.md`
```text
For a beginner on Day 51 of a 100-day Java + DSA plan. Teach: Binary tree to doubly linked list; Recover BST: LC 99; AVL trees. Key points: Problem Statement, Mapping Tree Pointers to List Pointers, Approach - Inorder with a prev Pointer, Problem Statement - LeetCode 99, Key Insight - Inorder Reveals the Swap, Dry Run, Problem with BST, Self Balancing Binary Trees, AVL Trees Theory + Algorithm, Example Walkthrough. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 52: Heaps, Top-K, K-way Merge and Two Heaps
**Upload:** `kunal-java-notes-claude/java_56_video_heaps_priority_queue.md`, `DSA Topics Not Covered Notes/dsa_gap_06_top_k_k_way_merge.md`, `DSA Topics Not Covered Notes/dsa_gap_07_two_heaps.md`
```text
For a beginner on Day 52 of a 100-day Java + DSA plan. Teach: Heaps & PriorityQueue; Top-K and K-way merge; Two heaps. Key points: Why heaps?, How heaps work, Inserting items in a heap, Removing items from a heap, Code, Heapsort, PriorityQueue in Java, The Top-K Idea: a Heap of Size k, Kth Largest Element in an Array, The Idea, The Two Invariants, Find Median from Data Stream, Sliding Window Median. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 53: Huffman Coding · LLD Practice

### Video 53A: Huffman Coding
**Upload:** `kunal-java-notes-claude/java_61_video_huffman_coding.md`
```text
For a beginner on Day 53 of a 100-day Java + DSA plan. Teach: Huffman coding. Key points: Theory, Code. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 53B: LLD Practice
**Upload:** `Java Topics Not Covered Notes/java_gap_05_solid_low_level_design.md`
```text
For a beginner on Day 53 of a 100-day Java + DSA plan. Teach: LLD practice: parking lot, library, elevator, LRU. Use ONLY sections 11–12 of java_gap_05_solid_low_level_design; skip the rest. Key points: Worked LLD: Parking Lot, Other Common LLD Questions. Draw the nodes and pointers and animate each pointer change step by step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 54: Tries and Segment Trees
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_04_trie.md`, `kunal-java-notes-claude/java_51_video_segment_trees.md`
```text
For a beginner on Day 54 of a 100-day Java + DSA plan. Teach: Trie; Segment trees. Key points: Why a Trie, The Trie Node, Insert, Search and StartsWith, Complexity and Memory, Wildcard Search, Prefix Counts and Deletion, Binary Trie: Maximum XOR, About the lecture, Why use segment trees?, Segment trees theory + example, Solving queries in segment trees, Updating elements in segment trees, Code. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 55: Greedy Algorithms
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_10_greedy.md`
```text
For a beginner on Day 55 of a 100-day Java + DSA plan. Teach: Greedy: exchange argument, activity selection, interval scheduling. Key points: What Greedy Means, Proving and Breaking a Greedy Choice, Activity Selection and Pair Chains, Jump Game I and II, Gas Station, Matching: Assign Cookies and Boats, Partition Labels, Fractional vs 0/1 Knapsack, Two-Pass Greedy: Candy, Counting Greedy: Task Scheduler and Lemonade Change. Show the array as boxes with index and pointer arrows, and trace every step in a table. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 56: Maths Extras · JUnit, Maven and JDBC

### Video 56A: Maths Extras
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_16_maths_extras.md`
```text
For a beginner on Day 56 of a 100-day Java + DSA plan. Teach: Maths extras: fast power, modular inverse, nCr / Pascal's triangle. Key points: Modular Arithmetic Recap, Fast Power (Binary Exponentiation), Pow(x, n) with Doubles and Negative Exponents, Modular Inverse, nCr Three Ways, Counting Formulas, Catalan Numbers, Inclusion–Exclusion, Matrix Exponentiation, Pitfalls and Problem List. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 56B: JUnit, Maven and JDBC
**Upload:** `Java Topics Not Covered Notes/java_gap_12_junit_maven_gradle_jdbc.md`
```text
For a beginner on Day 56 of a 100-day Java + DSA plan. Teach: JUnit, Maven/Gradle and JDBC. Key points: Why Automated Tests, JUnit 5 Basics, Assertions and Exceptions, Lifecycle, Parameterized Tests and Naming, Test Doubles and Mockito, Writing Testable Code and TDD, Maven, Gradle, Maven vs Gradle and Dependency Scopes, JDBC Architecture, PreparedStatement and SQL Injection. Draw the project layout, the dependency tree and the build lifecycle phases, and run real commands. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 57: Graphs — Representation, BFS, DFS and Components · Maven in Depth

### Video 57A: Graphs — Representation, BFS, DFS and Components
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_02_graphs.md`
```text
For a beginner on Day 57 of a 100-day Java + DSA plan. Teach: Graph vocabulary, representation, BFS, DFS, connected components. Use ONLY sections 0–4 of dsa_topic_02_graphs; skip the rest. Key points: Graph Vocabulary, Representing a Graph, Breadth-First Search, Depth-First Search, Connected Components. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 57B: Maven in Depth
**Upload:** `Spring Boot Notes/README.md`, `Spring Boot Notes/spring_01_maven_in_depth.md`
```text
For a beginner on Day 57 of a 100-day Java + DSA plan. Teach: Maven in depth. Key points: What Maven Is (and Isn't), Project Layout and the Maven Wrapper, The POM: Coordinates, Packaging, Properties, Dependencies, Repositories and Transitive Dependencies, Dependency Scopes, Version Conflicts, Exclusions, dependencyManagement and BOMs, The Build Lifecycle: Phases and Goals, Plugins. Draw the project layout, the dependency tree and the build lifecycle phases, and run real commands. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 58: Grid Graphs and Word Ladder
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_02_graphs.md`, `kunal-java-notes-claude/java_65_video_word_ladder.md`
```text
For a beginner on Day 58 of a 100-day Java + DSA plan. Teach: Grid graphs: flood fill, islands, rotting oranges; Word Ladder: LC 127. Use ONLY section 5 of dsa_topic_02_graphs; skip the rest. Key points: Grid Graphs: Islands, Flood Fill, Rotting Oranges, Problem Statement: LeetCode 127, Modelling Words as a Graph, Why BFS Gives the Shortest Path, Generating Neighbours: Change Each Letter a to z. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 59: Cycles, Topological Sort and Bipartite Graphs · HTTP & REST

### Video 59A: Cycles, Topological Sort and Bipartite Graphs
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_02_graphs.md`
```text
For a beginner on Day 59 of a 100-day Java + DSA plan. Teach: Cycle detection, topological sort, bipartite graphs. Use ONLY sections 6–8 of dsa_topic_02_graphs; skip the rest. Key points: Cycle Detection, Topological Sort, Bipartite Graphs. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 59B: HTTP & REST
**Upload:** `Spring Boot Notes/spring_02_http_rest_basics.md`
```text
For a beginner on Day 59 of a 100-day Java + DSA plan. Teach: HTTP & REST basics. Key points: Clients, Servers and URLs, Anatomy of a Request and a Response, HTTP Methods: Safe and Idempotent, Status Codes, Headers You Must Know, JSON, Statelessness, Cookies, Sessions and Tokens, REST Principles, Designing a REST API: URLs, Filtering, Pagination, Versioning, Error Responses: Problem Details. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 60: Union-Find (DSU)
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_03_union_find.md`
```text
For a beginner on Day 60 of a 100-day Java + DSA plan. Teach: Union-Find: union by rank, path compression. Key points: The Problem Union-Find Solves, Sets as Trees: find and union, Optimisation 1: Path Compression, Optimisation 2: Union by Rank or Size, The Complete DSU Class, Counting Components, Cycle Detection: Redundant Connection, Kruskal's MST, Mapping Non-Integer Items: Equations and Accounts, DSU on Grids. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 61: Shortest Paths · Spring Core

### Video 61A: Shortest Paths
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_02_graphs.md`
```text
For a beginner on Day 61 of a 100-day Java + DSA plan. Teach: Dijkstra, 0-1 BFS, Bellman-Ford, Floyd-Warshall. Use ONLY sections 9–10 of dsa_topic_02_graphs; skip the rest. Key points: Shortest Paths: Dijkstra and 0-1 BFS, Bellman-Ford and Floyd-Warshall. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 61B: Spring Core
**Upload:** `Spring Boot Notes/spring_03_spring_core_ioc_di.md`
```text
For a beginner on Day 61 of a 100-day Java + DSA plan. Teach: Spring Core: IoC, DI, beans, scopes, lifecycle. Key points: The Problem: Tight Coupling, Inversion of Control and Dependency Injection, The Container: ApplicationContext and Beans, Java Configuration: @Configuration and @Bean, Component Scanning and Stereotype Annotations, Constructor, Setter and Field Injection, Bean Scopes, The Bean Lifecycle. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 62: Minimum Spanning Trees, Implicit Graphs and SCC
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_02_graphs.md`
```text
For a beginner on Day 62 of a 100-day Java + DSA plan. Teach: MST, implicit graphs & cloning, SCC and bridges, choosing an algorithm. Use ONLY sections 11–14 of dsa_topic_02_graphs; skip the rest. Key points: Minimum Spanning Trees: Prim and Kruskal, Implicit Graphs and Cloning, Strongly Connected Components and Bridges, Choosing an Algorithm, Pitfalls and Problem List. Draw the graph and animate the traversal: the queue/stack, visited set and distances at each step. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 63: DP Foundations and 1D DP · Spring Boot Fundamentals

### Video 63A: DP Foundations and 1D DP
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md`
```text
For a beginner on Day 63 of a 100-day Java + DSA plan. Teach: What DP is, Fibonacci four ways, the five-step method, 1D DP. Use ONLY sections 0–3 of dsa_topic_01_dynamic_programming; skip the rest. Key points: What DP Is and When It Applies, From Recursion to DP: Fibonacci Four Ways, The Five-Step Method, 1D DP. Fill the DP table cell by cell on screen and show where each value comes from. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 63B: Spring Boot Fundamentals
**Upload:** `Spring Boot Notes/spring_04_spring_boot_fundamentals.md`
```text
For a beginner on Day 63 of a 100-day Java + DSA plan. Teach: Spring Boot fundamentals: starters, auto-configuration, config, profiles. Key points: Creating a Project with Spring Initializr, The Boot POM: Parent, Starters, Plugin, @SpringBootApplication and What Happens at Startup, Auto-Configuration: How the Magic Works, Overriding and Excluding Auto-Configuration, application.properties vs application.yml, Profiles in Spring Boot. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 64: Knapsack DP
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md`
```text
For a beginner on Day 64 of a 100-day Java + DSA plan. Teach: 0/1 knapsack, subset sum, unbounded knapsack, coin change. Use ONLY sections 4–5 of dsa_topic_01_dynamic_programming; skip the rest. Key points: 0/1 Knapsack and Subset Sum, Unbounded Knapsack and Coin Change. Fill the DP table cell by cell on screen and show where each value comes from. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 65: Grid DP and LIS · REST Controllers

### Video 65A: Grid DP and LIS
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md`
```text
For a beginner on Day 65 of a 100-day Java + DSA plan. Teach: Grid DP and longest increasing subsequence. Use ONLY sections 6–7 of dsa_topic_01_dynamic_programming; skip the rest. Key points: Grid DP, Longest Increasing Subsequence. Fill the DP table cell by cell on screen and show where each value comes from. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 65B: REST Controllers
**Upload:** `Spring Boot Notes/spring_05_rest_controllers.md`
```text
For a beginner on Day 65 of a 100-day Java + DSA plan. Teach: REST controllers: mappings, ResponseEntity, DTOs, Jackson, filters. Key points: The Journey of a Request: DispatcherServlet, @RestController and the Mapping Annotations, Reading the Request: Path, Query, Headers, Body, Writing the Response: ResponseEntity and Status Codes, DTOs, Records and Lombok, JSON with Jackson 3 and Content Negotiation, File Upload with Multipart. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 66: String DP
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md`
```text
For a beginner on Day 66 of a 100-day Java + DSA plan. Teach: String DP: LCS, edit distance, palindromes. Use ONLY section 8 of dsa_topic_01_dynamic_programming; skip the rest. Key points: String DP: LCS, Edit Distance, Palindromes. Fill the DP table cell by cell on screen and show where each value comes from. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 67: Stock Problems · Validation and Error Handling

### Video 67A: Stock Problems
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md`
```text
For a beginner on Day 67 of a 100-day Java + DSA plan. Teach: Stock problems: state-machine DP. Use ONLY section 12 of dsa_topic_01_dynamic_programming; skip the rest. Key points: State Machine DP: Stock Problems. Fill the DP table cell by cell on screen and show where each value comes from. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

### Video 67B: Validation and Error Handling
**Upload:** `Spring Boot Notes/spring_06_validation_error_handling.md`
```text
For a beginner on Day 67 of a 100-day Java + DSA plan. Teach: Validation & error handling. Key points: Where Validation Belongs, Bean Validation: The Starter and the Built-in Constraints, @Valid on Request Bodies, Validating Path Variables and Query Parameters, Custom Constraints, Error Messages and messages.properties, Parse Errors Happen Before Validation, How Spring MVC Handles Exceptions. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 68: Interval, Tree and Bitmask DP
**Upload:** `DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md`
```text
For a beginner on Day 68 of a 100-day Java + DSA plan. Teach: Interval DP, DP on trees, bitmask DP; Recognising DP, pitfalls and the problem list. Use ONLY sections 9–11 of dsa_topic_01_dynamic_programming and section 13 of dsa_topic_01_dynamic_programming; skip the rest. Key points: Interval DP, DP on Trees, Bitmask DP. Fill the DP table cell by cell on screen and show where each value comes from. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 69: SQL Essentials on PostgreSQL
**Upload:** `Spring Boot Notes/spring_07_sql_essentials.md`
```text
For a beginner on Day 69 of a 100-day Java + DSA plan. Teach: SQL essentials: DDL, joins, GROUP BY, window functions, indexes, transactions. Key points: The Relational Model and the Sample Schema, Connecting with psql, DDL: Tables, Types and Constraints, DML: INSERT, UPDATE, DELETE, Upsert, SELECT: Filtering, Sorting, NULL, CASE, Aggregates, GROUP BY and HAVING, JOINs, Subqueries, EXISTS and CTEs, Set Operations: UNION, INTERSECT, EXCEPT. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 70: Data Access I — JDBC, JPA and Flyway
**Upload:** `Spring Boot Notes/spring_08_data_access_jdbc_jpa.md`
```text
For a beginner on Day 70 of a 100-day Java + DSA plan. Teach: Data access I: JdbcClient, JPA, entity lifecycle, relationships, Flyway, HikariCP. Key points: Four Ways to Reach the Database, Setup: Starters, DataSource and HikariCP, Schema Migrations with Flyway, Spring JDBC: JdbcTemplate and JdbcClient, JPA Architecture, Mapping Entities, The Entity Lifecycle, Persistence Context: First-Level Cache, Dirty Checking, Flush, Relationships. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 71: Data Access II — Queries and Transactions
**Upload:** `Spring Boot Notes/spring_09_queries_transactions.md`
```text
For a beginner on Day 71 of a 100-day Java + DSA plan. Teach: Data access II: queries, projections, N+1, paging, @Transactional. Key points: The Data: Migration V3, Derived Queries, JPQL and Native Queries, Projections, The N+1 Problem and Its Fixes, Paging and Sorting, Specifications and the Criteria API, Bulk Updates with @Modifying, How @Transactional Works, Propagation, Rollback Rules, Proxy Pitfalls and readOnly, Isolation Levels. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 72: Testing Spring Boot Apps
**Upload:** `Spring Boot Notes/spring_10_testing.md`
```text
For a beginner on Day 72 of a 100-day Java + DSA plan. Teach: Testing: JUnit 5, Mockito, slices, @SpringBootTest, Testcontainers. Key points: The Test Pyramid, Dependencies and Layout, JUnit 5 and AssertJ Essentials, Mockito, Unit Testing the Service, Spring Test Slices, Web Slice: @WebMvcTest, JPA Slice: @DataJpaTest, Full Integration: @SpringBootTest, Testcontainers, Context Caching, Test Config and Speed, Running Tests with Maven. Draw the project layout, the dependency tree and the build lifecycle phases, and run real commands. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 73: Spring Security
**Upload:** `Spring Boot Notes/spring_11_security.md`
```text
For a beginner on Day 73 of a 100-day Java + DSA plan. Teach: Spring Security: filter chain, BCrypt, JWT, OAuth2, method security. Key points: Authentication, Authorization, 401 and 403, Common Attacks: CSRF, XSS, SQL Injection, and CORS, Architecture: The Filter Chain, Configuring Security: Two Filter Chains, Users: In Memory and in the Database, Passwords: Hashing with BCrypt, Form Login and Sessions (Stateful), HTTP Basic (Stateless). Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 74: Production Features
**Upload:** `Spring Boot Notes/spring_12_production_features.md`
```text
For a beginner on Day 74 of a 100-day Java + DSA plan. Teach: Production features: logging, Actuator, metrics, OpenAPI, virtual threads. Key points: Observability: Logs, Metrics, Traces, Logging with SLF4J and Logback, Configuring Logs: Levels, Patterns, Files, MDC: A Request Id on Every Line, Structured (JSON) Logs, Actuator: Endpoints, Exposure and Security, Health: Indicators, Groups and Kubernetes Probes, Info, Metrics with Micrometer. Show threads as parallel timelines and animate race conditions and how locks fix them. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 75: Advanced Spring
**Upload:** `Spring Boot Notes/spring_13_advanced_spring.md`
```text
For a beginner on Day 75 of a 100-day Java + DSA plan. Teach: Advanced Spring: AOP, @Async, @Scheduled, events, caching, RestClient. Key points: Proxies: The Mechanism Behind Everything Here, AOP Concepts, Writing Aspects, @Async and Thread Pools, Scheduling, Application Events, Caching, Calling Other Services: RestClient and HTTP Interfaces, Rate Limiting, Interview Questions. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 76: Deployment — Jars, Docker, Kubernetes and CI
**Upload:** `Spring Boot Notes/spring_14_deployment.md`
```text
For a beginner on Day 76 of a 100-day Java + DSA plan. Teach: Deployment: jars, Docker, compose, Kubernetes probes, GitHub Actions. Key points: From mvn package to a Running Service, The Fat Jar: What's Inside, Layers and jarmode=tools, Startup Time: Extracted Jars and CDS, Configuration in Production, Secrets: Environment Variables vs Config Trees, Fail Fast: Missing and Weak Configuration, Docker, Kubernetes: Probes, Shutdown, Resources. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 77: Capstone Project
**Upload:** `Spring Boot Notes/spring_15_capstone.md`
```text
For a beginner on Day 77 of a 100-day Java + DSA plan. Teach: Capstone: one request end to end, test pyramid, trade-offs, interview pitch. Key points: The Finished App at a Glance, How It Grew, File by File, One Request, End to End, A Day in the Life: The User Journey, Every Status Code the API Returned, What the End-to-End Run Caught, The Test Suite, Design Decisions and Trade-offs, Production Checklist, Presenting the Project in an Interview. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 78: Messaging with Kafka and RabbitMQ
**Upload:** `Spring Boot Notes/spring_16_messaging.md`
```text
For a beginner on Day 78 of a 100-day Java + DSA plan. Teach: Messaging: Kafka model, outbox, idempotent consumers, retries, RabbitMQ. Key points: Why Messaging?, Kafka's Model: Topics, Partitions, Offsets, Groups, Kafka vs RabbitMQ, Spring for Apache Kafka: Producing and Consuming, Serialization: Text, JSON and Poison Pills, The Dual-Write Problem and the Transactional Outbox, Delivery Guarantees and the Idempotent Consumer. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 79: Microservices
**Upload:** `Spring Boot Notes/spring_17_microservices.md`
```text
For a beginner on Day 79 of a 100-day Java + DSA plan. Teach: Microservices: config, discovery, gateway, tracing, circuit breakers, sagas. Key points: Monolith or Microservices?, The Example: Six Processes, Centralized Configuration: Spring Cloud Config, Service Discovery: Eureka, Load Balancing and Declarative HTTP Clients, The API Gateway, Distributed Tracing, Resilience: Timeouts, Circuit Breakers, Fallbacks, When an Instance Dies. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 80: MongoDB with Spring Data
**Upload:** `Spring Boot Notes/spring_18_mongodb.md`
```text
For a beginner on Day 80 of a 100-day Java + DSA plan. Teach: MongoDB with Spring Data: mapping, repositories, aggregation, indexes. Key points: Why a Document Database?, The Example: Task Tracker as Documents, Modelling: Embed or Reference, Mapping Entities to Documents, Repositories, MongoTemplate: Queries and Partial Updates, Aggregation Pipelines, Indexes, Atomicity, Optimistic Locking and Transactions, Schema Evolution, Testing. Draw the request/data flow between the parts (client, controller, service, repository, database) and walk through real code. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 81: String Algorithms — KMP, Z and Manacher
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_14_string_algorithms.md`
```text
For a beginner on Day 81 of a 100-day Java + DSA plan. Teach: KMP, Z-algorithm, Manacher. Key points: Why Naive Matching Is Slow, The Prefix Function (LPS Array), KMP Search, KMP Applications, The Z-Algorithm, Manacher's Algorithm, Rabin-Karp Recap and Choosing an Algorithm, Pitfalls and Problem List. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 82: Range Queries — Fenwick, Lazy Segment Tree, Sparse Table and Mo's
**Upload:** `DSA Topics Not Covered Notes/dsa_gap_15_range_query_structures.md`, `kunal-java-notes-claude/java_62_video_sqrt_decomposition_mos_algorithm.md`
```text
For a beginner on Day 82 of a 100-day Java + DSA plan. Teach: Fenwick tree, lazy segment tree, sparse table; Sqrt decomposition & Mo's algorithm. Key points: Choosing a Range-Query Structure, Fenwick Tree: The Idea, Fenwick Tree: Code and Range Sum Query Mutable, Segment Tree Recap, Theory, Code. Draw the tree and animate each operation node by node, with the call stack for recursive steps. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```

## Day 83: Serialization, Reflection, Regex and java.time
**Upload:** `Java Topics Not Covered Notes/java_gap_11_serialization_reflection_regex_time.md`
```text
For a beginner on Day 83 of a 100-day Java + DSA plan. Teach: Serialization, reflection, regex, java.time. Key points: Serialization Basics, transient, serialVersionUID and Custom Serialization, Serialization Pitfalls and Alternatives, Reflection: Inspecting Classes, Reflection: Calling Methods, Annotations, Proxies, Regex Syntax, Pattern and Matcher in Java, Regex Pitfalls, java.time: The Main Classes. Use clear diagrams and trace every code example line by line. Intuition and an analogy first, then exact code traced step by step. Show common mistakes, pause twice for predict-the-output, end with a recap, quiz and one practice problem.
```
