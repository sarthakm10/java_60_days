// ============================================================
// Java Fullstack — Beginner Track (100 days, from zero to job-ready)
//
// Days 1–83 follow notes/kunal/java_dsa_study_roadmap.md: Java, DSA and Spring Boot in the roadmap's order, each
// subtopic showing one of the Kunal notes (notes/kunal/, copied unchanged by scripts/sync-kunal-notes.js).
// Days 84–100 are the extra lane the roadmap doesn't cover: cloud, system design and interview prep.
//
// Each day lists its subtopics as one of:
//   k("v24", "label", [0, 5])  a Kunal note (key → file in KUNAL_FILES), optionally only its "## 0." to "## 5." sections
//   ["b3_t1_s2", "label"]   a new beginner subtopic, with its notes in notes/beginner/day-NN.md
//   "d1_t1_s1"              a subtopic borrowed from the Interview track (data.js), with its label and notes
//   ["d1_t1_s1", "label"]   a borrowed subtopic shown with a simpler label
// Frontend topics are added from data-frontend.js: each module's subtopics are spread over its `days`.
// `practice` lists exercise ids from practice/beginner/day-NN.md (an id bN_eM lives in day N's file).
// The DSA question sets for each day are in question-sets-beginner.js (BEGINNER_SETS, generated from the practice sheet).
//
// Ids are permanent progress keys: keep them when a subtopic moves to another day.
// Progress is stored per track, so a borrowed id ticked here does not tick it in the Interview track.
// ============================================================

const BEGINNER_PHASES = [
  "Phase 1: Java Foundations",
  "Phase 2: Arrays, Strings, Searching, Bits and Maths",
  "Phase 3: Sorting and Complexity Basics",
  "Phase 4: Array and String Patterns",
  "Phase 5: OOP and Core Java",
  "Phase 6: Java 8+ Features",
  "Phase 7: Recursion and Backtracking",
  "Phase 8: Linked Lists, Stacks, Queues and Hashing",
  "Phase 9: Trees, Heaps and Tries",
  "Phase 10: Greedy and Maths Extras",
  "Phase 11: Graphs and Union-Find",
  "Phase 12: Dynamic Programming",
  "Spring Boot Track",
  "Phase 13: Advanced and Optional Topics",
  "Extra: Cloud and Infrastructure",
  "Extra: System Design and Interview Prep"
];

const BEGINNER_DATA = (() => {
  const interviewSubs = new Map();
  CURRICULUM_DATA.forEach(d => d.topics.forEach(t => t.subtopics.forEach(s => interviewSubs.set(s.id, s))));

  const frontendSubs = new Map();   // frontend subtopic id → { label, module }
  FRONTEND_DATA.forEach(m => m.subtopics.forEach(([id, label]) => frontendSubs.set(id, { label, module: m.module })));

  // Kunal notes by their roadmap key (notes/kunal/<file>)
  const KUNAL_FILES = {
    v04: "kunal-java-notes-claude/java_04_video_git_github.md",
    v05: "kunal-java-notes-claude/java_05_video_intro_programming.md",
    v06: "kunal-java-notes-claude/java_06_video_flowcharts_pseudocode.md",
    v07: "kunal-java-notes-claude/java_07_video_java_architecture.md",
    v08: "kunal-java-notes-claude/java_08_video_first_java_program.md",
    v09: "kunal-java-notes-claude/java_09_video_conditionals_loops.md",
    v10: "kunal-java-notes-claude/java_10_video_switch_statements.md",
    v11: "kunal-java-notes-claude/java_11_video_functions_methods.md",
    v12: "kunal-java-notes-claude/java_12_video_arrays_arraylist.md",
    v13: "kunal-java-notes-claude/java_13_video_linear_search.md",
    v14: "kunal-java-notes-claude/java_14_video_binary_search.md",
    v15: "kunal-java-notes-claude/java_15_video_binary_search_questions.md",
    v16: "kunal-java-notes-claude/java_16_video_binary_search_2d_arrays.md",
    v17: "kunal-java-notes-claude/java_17_video_bubble_sort.md",
    v18: "kunal-java-notes-claude/java_18_video_selection_sort.md",
    v19: "kunal-java-notes-claude/java_19_video_insertion_sort.md",
    v20: "kunal-java-notes-claude/java_20_video_cyclic_sort.md",
    v21: "kunal-java-notes-claude/java_21_video_strings_stringbuilder.md",
    v22: "kunal-java-notes-claude/java_22_video_patterns.md",
    v23: "kunal-java-notes-claude/java_23_video_recursion_intro.md",
    v24: "kunal-java-notes-claude/java_24_video_time_space_complexity.md",
    v25: "kunal-java-notes-claude/java_25_video_bitwise_number_systems.md",
    v26: "kunal-java-notes-claude/java_26_video_maths_for_dsa.md",
    v27: "kunal-java-notes-claude/java_27_video_recursion_level1.md",
    v28: "kunal-java-notes-claude/java_28_video_recursion_arrays.md",
    v29: "kunal-java-notes-claude/java_29_video_recursion_patterns_sorting.md",
    v30: "kunal-java-notes-claude/java_30_video_merge_sort.md",
    v31: "kunal-java-notes-claude/java_31_video_quick_sort.md",
    v32: "kunal-java-notes-claude/java_32_video_recursion_subsets_strings.md",
    v33: "kunal-java-notes-claude/java_33_video_recursion_permutations.md",
    v34: "kunal-java-notes-claude/java_34_video_recursion_dice_phone_letters.md",
    v35: "kunal-java-notes-claude/java_35_video_backtracking_maze.md",
    v36: "kunal-java-notes-claude/java_36_video_nqueens_nknights_sudoku.md",
    v37: "kunal-java-notes-claude/java_37_video_oops.md",
    v38: "kunal-java-notes-claude/java_38_video_oop_static_packages_singleton.md",
    v39: "kunal-java-notes-claude/java_39_video_oop_principles.md",
    v40: "kunal-java-notes-claude/java_40_video_access_control_object_class.md",
    v41: "kunal-java-notes-claude/java_41_video_abstract_classes_interfaces.md",
    v42: "kunal-java-notes-claude/java_42_video_generics_lambdas_exceptions_cloning.md",
    v43: "kunal-java-notes-claude/java_43_video_collections_vector_enums.md",
    v44: "kunal-java-notes-claude/java_44_video_linked_list.md",
    v45: "kunal-java-notes-claude/java_45_video_linkedlist_interview_questions.md",
    v46: "kunal-java-notes-claude/java_46_video_stacks_queues.md",
    v47: "kunal-java-notes-claude/java_47_video_stack_queue_questions.md",
    v48: "kunal-java-notes-claude/java_48_video_tic_tac_toe_game.md",
    v49: "kunal-java-notes-claude/java_49_video_binary_trees_bst.md",
    v50: "kunal-java-notes-claude/java_50_video_avl_trees.md",
    v51: "kunal-java-notes-claude/java_51_video_segment_trees.md",
    v52: "kunal-java-notes-claude/java_52_video_stringbuffer_data_formatting.md",
    v53: "kunal-java-notes-claude/java_53_video_biginteger_bigdecimal.md",
    v54: "kunal-java-notes-claude/java_54_video_file_handling.md",
    v55: "kunal-java-notes-claude/java_55_video_binary_tree_questions.md",
    v56: "kunal-java-notes-claude/java_56_video_heaps_priority_queue.md",
    v57: "kunal-java-notes-claude/java_57_video_hashmap_hashtable.md",
    v58: "kunal-java-notes-claude/java_58_video_karp_rabin.md",
    v59: "kunal-java-notes-claude/java_59_video_count_sort.md",
    v60: "kunal-java-notes-claude/java_60_video_radix_sort.md",
    v61: "kunal-java-notes-claude/java_61_video_huffman_coding.md",
    v62: "kunal-java-notes-claude/java_62_video_sqrt_decomposition_mos_algorithm.md",
    v63: "kunal-java-notes-claude/java_63_video_construct_tree_preorder_inorder.md",
    v64: "kunal-java-notes-claude/java_64_video_vertical_order_traversal.md",
    v65: "kunal-java-notes-claude/java_65_video_word_ladder.md",
    v66: "kunal-java-notes-claude/java_66_video_two_sum_bst.md",
    v67: "kunal-java-notes-claude/java_67_video_kth_smallest_bst.md",
    v68: "kunal-java-notes-claude/java_68_video_binary_tree_to_dll.md",
    v69: "kunal-java-notes-claude/java_69_video_recover_bst.md",
    g01: "Java Topics Not Covered Notes/java_gap_01_multithreading_concurrency.md",
    g02: "Java Topics Not Covered Notes/java_gap_02_streams_api.md",
    g03: "Java Topics Not Covered Notes/java_gap_03_comparator_comparable.md",
    g04: "Java Topics Not Covered Notes/java_gap_04_design_patterns.md",
    g05: "Java Topics Not Covered Notes/java_gap_05_solid_low_level_design.md",
    g06: "Java Topics Not Covered Notes/java_gap_06_functional_interfaces_optional.md",
    g07: "Java Topics Not Covered Notes/java_gap_07_modern_java_features.md",
    g08: "Java Topics Not Covered Notes/java_gap_08_generics_in_depth.md",
    g09: "Java Topics Not Covered Notes/java_gap_09_jvm_internals_gc.md",
    g10: "Java Topics Not Covered Notes/java_gap_10_iterator_fail_fast_fail_safe.md",
    d01: "DSA Topics Not Covered Notes/dsa_gap_01_sliding_window.md",
    d02: "DSA Topics Not Covered Notes/dsa_gap_02_two_pointers.md",
    d03: "DSA Topics Not Covered Notes/dsa_gap_03_prefix_sum_difference_array.md",
    d04: "DSA Topics Not Covered Notes/dsa_gap_04_kadanes_algorithm.md",
    d05: "DSA Topics Not Covered Notes/dsa_gap_05_merge_intervals.md",
    d06: "DSA Topics Not Covered Notes/dsa_gap_06_top_k_k_way_merge.md",
    t01: "DSA Topics Not Covered Notes/dsa_topic_01_dynamic_programming.md",
    t02: "DSA Topics Not Covered Notes/dsa_topic_02_graphs.md",
    t03: "DSA Topics Not Covered Notes/dsa_topic_03_union_find.md",
    t04: "DSA Topics Not Covered Notes/dsa_topic_04_trie.md",
    d07: "DSA Topics Not Covered Notes/dsa_gap_07_two_heaps.md",
    d08: "DSA Topics Not Covered Notes/dsa_gap_08_monotonic_stack.md",
    d09: "DSA Topics Not Covered Notes/dsa_gap_09_monotonic_deque.md",
    d10: "DSA Topics Not Covered Notes/dsa_gap_10_greedy.md",
    d11: "DSA Topics Not Covered Notes/dsa_gap_11_matrix_traversal.md",
    d12: "DSA Topics Not Covered Notes/dsa_gap_12_combination_backtracking.md",
    d13: "DSA Topics Not Covered Notes/dsa_gap_13_lru_lfu_cache.md",
    d14: "DSA Topics Not Covered Notes/dsa_gap_14_string_algorithms.md",
    d15: "DSA Topics Not Covered Notes/dsa_gap_15_range_query_structures.md",
    d16: "DSA Topics Not Covered Notes/dsa_gap_16_maths_extras.md",
    g11: "Java Topics Not Covered Notes/java_gap_11_serialization_reflection_regex_time.md",
    g12: "Java Topics Not Covered Notes/java_gap_12_junit_maven_gradle_jdbc.md",
    sbr: "Spring Boot Notes/README.md",
    s01: "Spring Boot Notes/spring_01_maven_in_depth.md",
    s02: "Spring Boot Notes/spring_02_http_rest_basics.md",
    s03: "Spring Boot Notes/spring_03_spring_core_ioc_di.md",
    s04: "Spring Boot Notes/spring_04_spring_boot_fundamentals.md",
    s05: "Spring Boot Notes/spring_05_rest_controllers.md",
    s06: "Spring Boot Notes/spring_06_validation_error_handling.md",
    s07: "Spring Boot Notes/spring_07_sql_essentials.md",
    s08: "Spring Boot Notes/spring_08_data_access_jdbc_jpa.md",
    s09: "Spring Boot Notes/spring_09_queries_transactions.md",
    s10: "Spring Boot Notes/spring_10_testing.md",
    s11: "Spring Boot Notes/spring_11_security.md",
    s12: "Spring Boot Notes/spring_12_production_features.md",
    s13: "Spring Boot Notes/spring_13_advanced_spring.md",
    s14: "Spring Boot Notes/spring_14_deployment.md",
    s15: "Spring Boot Notes/spring_15_capstone.md",
    s16: "Spring Boot Notes/spring_16_messaging.md",
    s17: "Spring Boot Notes/spring_17_microservices.md",
    s18: "Spring Boot Notes/spring_18_mongodb.md",
    roadmap: "java_dsa_study_roadmap.md",
    tnc: "topics_not_covered.md",
  };
  // A subtopic showing a Kunal note: the whole file, or only its "## from." to "## to." sections
  const k = (key, label, part) => {
    if (!KUNAL_FILES[key]) console.error(`Beginner track: unknown Kunal note ${key}`);
    return [`k_${key}${part ? `_${part[0]}` : ""}`, label, { note: KUNAL_FILES[key], ...(part ? { part } : {}) }];
  };

  const sub = (entry) => {
    const [id, label, extra] = Array.isArray(entry) ? entry : [entry];
    if (extra?.note) return { id, label, ...extra };
    const frontend = frontendSubs.get(id);
    if (frontend) return { id, label: label || frontend.label, frontend: true, module: frontend.module };
    const borrowed = interviewSubs.get(id);
    if (!borrowed && !label) {
      console.error(`Beginner track: unknown subtopic id ${id}`);
      return null;
    }
    return borrowed ? { id, label: label || borrowed.label, borrowed: true } : { id, label };
  };
  // sourceDay: the Interview day a topic comes from, so that day's question sets show up here
  const topic = (category, name, subtopics, sourceDay) => ({ category, name, subtopics, ...(sourceDay ? { sourceDay } : {}) });
  // Topic `index` of Interview day `day` (or its first DSA topic), minus ids already placed on another day
  const fromDay = (day, index, except = []) => {
    const source = CURRICULUM_DATA.find(d => d.day === day);
    const t = index === undefined ? source.topics.find(x => x.category === "DSA") : source.topics[index];
    return { category: t.category, name: t.name, subtopics: t.subtopics.map(s => s.id).filter(id => !except.includes(id)), sourceDay: day };
  };
  const dsa = (day, except) => fromDay(day, undefined, except);

  const DAYS = [
    // ===================== PHASE 1: JAVA FOUNDATIONS (Days 1–4) =====================
    { p: 0, title: "Start Here — Git, How Programs Run and the JVM", topics: [
      topic("Java", "Start Here — The Roadmap", [
        k("roadmap", "How this track is ordered — the Java + DSA study roadmap (skim it now, come back to it often)")
      ]),
      topic("Java", "Java Foundations", [
        k("v04", "1.1 Git & GitHub — save your practice code from the start (video 4)"),
        k("v05", "1.2 Intro to programming — paradigms, stack vs heap, garbage collection (video 5)"),
        k("v06", "1.3 Flowcharts & pseudocode — think before you code (video 6)"),
        k("v07", "1.4 JDK, JRE and JVM — what javac and java do (video 7)")
      ])
    ] },
    { p: 0, title: "Your First Java Program — Input, Data Types and Casting", practice: ["b1_e1", "b1_e2", "b1_e3", "b2_e1", "b2_e2", "b2_e3", "b3_e1", "b3_e2", "b3_e3"], topics: [
      topic("Java", "Java Foundations", [
        k("v08", "1.5 First program — input/output, data types and type casting (video 8)")
      ])
    ] },
    { p: 0, title: "Conditionals, Loops and Switch", practice: ["b4_e1", "b4_e2", "b4_e3", "b5_e1", "b5_e2", "b5_e3"], topics: [
      topic("Java", "Java Foundations", [
        k("v09", "1.6 Conditionals & loops (video 9)"),
        k("v10", "1.7 Switch, with the newer arrow syntax (video 10)")
      ]),
      topic("DSA", "Extra Loop Practice", [
        k("v22", "Pattern printing — nested-loop practice (video 22; not on the roadmap, optional)")
      ])
    ] },
    { p: 0, title: "Functions and Methods", practice: ["b6_e1", "b6_e2", "b6_e3", "b9_e1", "b9_e2", "b12_e1"], topics: [
      topic("Java", "Java Foundations", [
        k("v11", "1.8 Functions / methods, scope and pass-by-value (video 11)")
      ])
    ] },

    // ===================== PHASE 2: ARRAYS, STRINGS, SEARCHING, BITS AND MATHS (Days 5–11) =====================
    { p: 1, title: "Big-O Basics, Then Arrays and ArrayList", practice: ["b7_e1", "b7_e2", "b7_e3", "b11_e1"], topics: [
      topic("DSA", "Before This Phase — Complexity Basics", [
        k("v24", "Time complexity, sections 0–5 — analysing a loop and Big-O (video 24, part 1)", [0, 5])
      ]),
      topic("DSA", "Arrays", [
        k("v12", "2.1 Arrays & ArrayList (video 12)")
      ])
    ] },
    { p: 1, title: "Strings and StringBuilder", practice: ["b8_e1", "b8_e2", "b8_e3"], topics: [
      topic("DSA", "Strings", [k("v21", "2.2 Strings & StringBuilder (video 21)")])
    ] },
    { p: 1, title: "Linear Search and Binary Search", topics: [
      topic("DSA", "Searching", [
        k("v13", "2.3 Linear search (video 13)"),
        k("v14", "2.4 Binary search (video 14)")
      ])
    ] },
    { p: 1, title: "Binary Search Questions", topics: [
      topic("DSA", "Searching", [k("v15", "2.5 Binary search questions — LC 35, 744, 34, 33, 153, 410… (video 15)")])
    ] },
    { p: 1, title: "Binary Search in 2D Arrays", topics: [
      topic("DSA", "Searching", [k("v16", "2.6 Binary search in 2D — LC 240, 74 (video 16)")])
    ] },
    { p: 1, title: "Bitwise Operators and Number Systems", topics: [
      topic("DSA", "Bits", [k("v25", "2.7 Bitwise operators & number systems (video 25)")])
    ] },
    { p: 1, title: "Maths for DSA", practice: ["b10_e1", "b10_e2", "b10_e3", "b11_e2"], topics: [
      topic("DSA", "Maths", [k("v26", "2.8 Maths — primes, sieve, square root, GCD/LCM, modulo (video 26)")])
    ] },

    // ===================== PHASE 3: SORTING AND COMPLEXITY BASICS (Days 12–14) =====================
    { p: 2, title: "Bubble, Selection and Insertion Sort", topics: [
      topic("DSA", "Sorting", [
        k("v17", "3.1 Bubble sort (video 17)"),
        k("v18", "3.2 Selection sort (video 18)"),
        k("v19", "3.3 Insertion sort (video 19)")
      ])
    ] },
    { p: 2, title: "Cyclic Sort", topics: [
      topic("DSA", "Sorting", [k("v20", "3.4 Cyclic sort — LC 268, 448, 287, 442, 645, 41 (video 20)")])
    ] },
    { p: 2, title: "Complexity Part 2, Count Sort and Radix Sort", topics: [
      topic("DSA", "Complexity", [
        k("v24", "3.5 Time & space complexity, sections 6–12 — Ω, Θ, little-o/ω, space, sorting (video 24, part 2)", [6, 12])
      ]),
      topic("DSA", "Sorting", [
        k("v59", "3.6 Count sort (video 59)"),
        k("v60", "3.7 Radix sort (video 60)")
      ])
    ] },

    // ===================== PHASE 4: ARRAY AND STRING PATTERNS (Days 15–19) =====================
    { p: 3, title: "HashMap Usage and Two Pointers", practice: ["b27_e1", "d14_e3", "d16_e2"], topics: [
      topic("DSA", "Topics the Playlist Doesn't Cover", [
        k("tnc", "Overview — the topics missing from the playlist and why they matter")
      ]),
      topic("DSA", "Array & String Patterns", [
        k("v57", "4.1 HashMap / HashSet usage — put, get, getOrDefault, containsKey, merge (video 57, section 4)", [4, 4]),
        k("d02", "4.2 Two pointers (DSA gap #2)")
      ])
    ] },
    { p: 3, title: "Prefix Sum and Difference Array", topics: [
      topic("DSA", "Array & String Patterns", [k("d03", "4.3 Prefix sum / difference array (DSA gap #3)")])
    ] },
    { p: 3, title: "Kadane's Algorithm", topics: [
      topic("DSA", "Array & String Patterns", [k("d04", "4.4 Kadane's algorithm (DSA gap #4)")])
    ] },
    { p: 3, title: "Sliding Window", topics: [
      topic("DSA", "Array & String Patterns", [k("d01", "4.5 Sliding window — fixed size first, then variable size (DSA gap #1)")])
    ] },
    { p: 3, title: "Matrix Traversal", topics: [
      topic("DSA", "Array & String Patterns", [k("d11", "4.6 Matrix traversal — spiral, rotate, set zeroes (DSA gap #11)")])
    ] },

    // ===================== PHASE 5: OOP AND CORE JAVA (Days 20–26) =====================
    { p: 4, title: "OOP 1–2 — Classes, Objects, static and Packages", practice: ["b13_e1", "b13_e2", "d1_e3"], topics: [
      topic("Java", "OOP", [
        k("v37", "5.1 OOP 1 — classes, objects, constructors (video 37)"),
        k("v38", "5.2 OOP 2 — packages, static, Singleton (video 38)")
      ])
    ] },
    { p: 4, title: "OOP 3 — Inheritance, Polymorphism, Encapsulation and Abstraction", practice: ["b16_e1", "b16_e2", "b17_e1", "b17_e2", "d1_e1"], topics: [
      topic("Java", "OOP", [k("v39", "5.3 OOP 3 — inheritance, polymorphism, encapsulation, abstraction (video 39)")])
    ] },
    { p: 4, title: "OOP 4–5 — Access Control, the Object Class, Abstract Classes and Interfaces", practice: ["d2_e1", "d2_e3", "d1_e2", "d2_e2"], topics: [
      topic("Java", "OOP", [
        k("v40", "5.4 OOP 4 — access control, the Object class (video 40)"),
        k("v41", "5.5 OOP 5 — abstract classes & interfaces (video 41)")
      ])
    ] },
    { p: 4, title: "OOP 6 — Generics, Lambdas, Exceptions and Cloning", practice: ["b22_e1", "b24_e1", "d4_e1", "d4_e2"], topics: [
      topic("Java", "OOP", [k("v42", "5.6 OOP 6 — generics, Comparable/Comparator basics, lambdas, exceptions, cloning (video 42)")])
    ] },
    { p: 4, title: "OOP 7 — Collections Framework, Vector and Enums", practice: ["b25_e1", "d11_e1", "d3_e2", "d14_e1", "d14_e2"], topics: [
      topic("Java", "OOP", [k("v43", "5.7 OOP 7 — Collections framework, Vector, enums (video 43)")])
    ] },
    { p: 4, title: "StringBuffer, BigInteger, BigDecimal and File Handling", practice: ["d16_e1", "d16_e3"], topics: [
      topic("Java", "Core Java", [
        k("v52", "5.8 StringBuffer & formatting (video 52)"),
        k("v53", "5.9 BigInteger & BigDecimal (video 53)"),
        k("v54", "5.10 File handling (video 54)")
      ])
    ] },
    { p: 4, title: "Project — Tic-Tac-Toe", practice: ["b23_e1"], topics: [
      topic("Java", "Core Java", [k("v48", "5.11 Tic-Tac-Toe project — OOP in practice, also a common LLD question (video 48)")])
    ] },

    // ===================== PHASE 6: JAVA 8+ FEATURES (Days 27–32) =====================
    { p: 5, title: "Generics in Depth", practice: ["d4_e3"], topics: [
      topic("Java", "Java 8+ Features", [k("g08", "6.1 Generics in depth — bounds, wildcards, PECS, type erasure (Java gap #8)")])
    ] },
    { p: 5, title: "Comparator and Comparable in Depth", practice: ["d3_e3"], topics: [
      topic("Java", "Java 8+ Features", [k("g03", "6.2 Comparator & Comparable in depth (Java gap #3)")])
    ] },
    { p: 5, title: "Functional Interfaces and Optional", practice: ["d5_e1", "d5_e2", "d7_e1"], topics: [
      topic("Java", "Java 8+ Features", [k("g06", "6.3 Functional interfaces & Optional (Java gap #6)")])
    ] },
    { p: 5, title: "Streams API", practice: ["b33_e1", "d5_e3", "d6_e1", "d6_e2", "d6_e3"], topics: [
      topic("Java", "Java 8+ Features", [k("g02", "6.4 Streams API (Java gap #2)")])
    ] },
    { p: 5, title: "Modern Java (Java 9–21)", practice: ["d3_e1", "d7_e2"], topics: [
      topic("Java", "Java 8+ Features", [k("g07", "6.5 Modern Java — var, List.of, records, text blocks, switch expressions, sealed types, pattern matching (Java gap #7)")])
    ] },
    { p: 5, title: "Merge Intervals", topics: [
      topic("DSA", "Patterns", [k("d05", "6.6 Merge intervals (DSA gap #5)")])
    ] },

    // ===================== PHASE 7: RECURSION AND BACKTRACKING (Days 33–40) =====================
    { p: 6, title: "Recursion and the Complexity of Recursive Programs", topics: [
      topic("DSA", "Recursion", [
        k("v23", "7.1 Recursion intro (video 23)"),
        k("v24", "7.2 Complexity of recursive programs, sections 13–26 — recurrences, Akra-Bazzi (video 24, part 3)", [13, 26])
      ])
    ] },
    { p: 6, title: "Recursion Level 1 and Recursion on Arrays", topics: [
      topic("DSA", "Recursion", [
        k("v27", "7.3 Recursion level 1 (video 27)"),
        k("v28", "7.4 Recursion on arrays (video 28)")
      ])
    ] },
    { p: 6, title: "Recursion Patterns and Recursive Sorting", topics: [
      topic("DSA", "Recursion", [k("v29", "7.5 Recursion patterns + recursive bubble/selection sort (video 29)")])
    ] },
    { p: 6, title: "Merge Sort and Quick Sort", topics: [
      topic("DSA", "Recursion", [
        k("v30", "7.6 Merge sort (video 30)"),
        k("v31", "7.7 Quick sort (video 31)")
      ])
    ] },
    { p: 6, title: "Subsets and Subsequences", topics: [
      topic("DSA", "Recursion", [k("v32", "7.8 Subsets & subsequences — the take / don't-take choice (video 32)")])
    ] },
    { p: 6, title: "Permutations, Dice and Phone Letters", topics: [
      topic("DSA", "Recursion", [
        k("v33", "7.9 Permutations (video 33)"),
        k("v34", "7.10 Dice & phone letters — LC 17, 1155 (video 34)")
      ])
    ] },
    { p: 6, title: "Backtracking — Maze, N-Queens, N-Knights and Sudoku", topics: [
      topic("DSA", "Backtracking", [
        k("v35", "7.11 Backtracking: maze (video 35)"),
        k("v36", "7.12 N-Queens, N-Knights, Sudoku (video 36)")
      ])
    ] },
    { p: 6, title: "Combination-Style Backtracking", topics: [
      topic("DSA", "Backtracking", [k("d12", "7.13 Combination Sum, Word Search, Palindrome Partitioning (DSA gap #12)")])
    ] },

    // ===================== PHASE 8: LINKED LISTS, STACKS, QUEUES, HASHING (Days 41–46) =====================
    { p: 7, title: "Linked Lists · SOLID and Low-Level Design", practice: ["d11_e2", "d10_e1"], topics: [
      topic("DSA", "Linked Lists", [k("v44", "8.1 Linked list (video 44)")]),
      topic("Java", "Advanced Java (parallel track)", [
        k("g05", "J.1 SOLID & low-level design, sections 0–10 (Java gap #5)", [0, 10])
      ])
    ] },
    { p: 7, title: "Linked List Questions and Iterators", practice: ["d11_e3"], topics: [
      topic("DSA", "Linked Lists", [
        k("v45", "8.2 Linked list questions — fast/slow pointers, reversal, merge (video 45)"),
        k("g10", "8.3 Iterator, Iterable, fail-fast vs fail-safe (Java gap #10)")
      ])
    ] },
    { p: 7, title: "Stacks, Queues and the Monotonic Stack · Design Patterns", practice: ["b69_e1", "b70_e1", "b70_e2", "d15_e1"], topics: [
      topic("DSA", "Stacks & Queues", [
        k("v46", "8.4 Stacks & queues (video 46)"),
        k("d08", "8.5 Monotonic stack in depth (DSA gap #8)")
      ]),
      topic("Java", "Advanced Java (parallel track)", [k("g04", "J.2 Design patterns (Java gap #4)")])
    ] },
    { p: 7, title: "Stack and Queue Questions, Monotonic Deque", practice: ["b22_e2"], topics: [
      topic("DSA", "Stacks & Queues", [
        k("v47", "8.6 Stack/queue questions — LC 232, 20, 84, 921, 1541 (video 47)"),
        k("d09", "8.7 Monotonic deque — sliding window maximum (DSA gap #9)")
      ])
    ] },
    { p: 7, title: "HashMap Internals and LRU / LFU Cache", practice: ["d12_e1", "d12_e2", "d12_e3", "d13_e2"], topics: [
      topic("DSA", "Hashing", [
        k("v57", "8.8 HashMap & HashTable internals — hashing, chaining, open addressing (video 57)"),
        k("d13", "8.9 LRU / LFU cache (DSA gap #13)")
      ])
    ] },
    { p: 7, title: "Karp-Rabin · Multithreading and Concurrency", practice: ["d8_e1", "d8_e2", "d8_e3", "d9_e1"], time: "3–4 hrs", topics: [
      topic("DSA", "Hashing", [k("v58", "8.10 Karp-Rabin rolling hash (video 58)")]),
      topic("Java", "Advanced Java (parallel track)", [k("g01", "J.3 Multithreading & concurrency (Java gap #1)")])
    ] },

    // ===================== PHASE 9: TREES, HEAPS AND TRIES (Days 47–54) =====================
    { p: 8, title: "Binary Trees and BST", practice: ["d18_e1", "d9_e2", "d9_e3"], topics: [
      topic("DSA", "Trees", [k("v49", "9.1 Binary trees & BST (video 49)")])
    ] },
    { p: 8, title: "Binary Tree Questions", practice: ["d18_e2", "d13_e1", "d15_e3"], topics: [
      topic("DSA", "Trees", [k("v55", "9.2 Binary tree questions — BFS Q1–9, DFS Q10–24 (video 55)")])
    ] },
    { p: 8, title: "Tree from Preorder + Inorder, Vertical Order Traversal", practice: ["d13_e3"], topics: [
      topic("DSA", "Trees", [
        k("v63", "9.3 Tree from preorder + inorder — LC 105 (video 63)"),
        k("v64", "9.4 Vertical order traversal — LC 987 (video 64)")
      ])
    ] },
    { p: 8, title: "Two Sum IV and Kth Smallest in a BST · JVM Internals", practice: ["d17_e1", "d17_e2", "d17_e3", "d18_e3"], topics: [
      topic("DSA", "Trees", [
        k("v66", "9.5 Two Sum IV in a BST — LC 653 (video 66)"),
        k("v67", "9.6 Kth smallest in a BST — LC 230 (video 67)")
      ]),
      topic("Java", "Advanced Java (parallel track)", [k("g09", "J.4 JVM internals & garbage collection (Java gap #9)")])
    ] },
    { p: 8, title: "Tree to Doubly Linked List, Recover BST and AVL Trees", topics: [
      topic("DSA", "Trees", [
        k("v68", "9.7 Binary tree to doubly linked list (video 68)"),
        k("v69", "9.8 Recover BST — LC 99 (video 69)"),
        k("v50", "9.9 AVL trees (video 50)")
      ])
    ] },
    { p: 8, title: "Heaps, Top-K, K-way Merge and Two Heaps", practice: ["d15_e2"], topics: [
      topic("DSA", "Heaps", [
        k("v56", "9.10 Heaps & PriorityQueue (video 56)"),
        k("d06", "9.11 Top-K and K-way merge (DSA gap #6)"),
        k("d07", "9.11 Two heaps (DSA gap #7)")
      ])
    ] },
    { p: 8, title: "Huffman Coding · LLD Practice", practice: ["b71_e1"], topics: [
      topic("DSA", "Heaps", [k("v61", "9.12 Huffman coding (video 61)")]),
      topic("Java", "Advanced Java (parallel track)", [
        k("g05", "J.5 LLD practice — parking lot, library, elevator, LRU (Java gap #5, sections 11–12)", [11, 12])
      ])
    ] },
    { p: 8, title: "Tries and Segment Trees", topics: [
      topic("DSA", "Trees", [
        k("t04", "9.13 Trie (DSA topic #4)"),
        k("v51", "9.14 Segment trees (video 51)")
      ])
    ] },

    // ===================== PHASE 10: GREEDY AND MATHS EXTRAS (Days 55–56) =====================
    { p: 9, title: "Greedy Algorithms", topics: [
      topic("DSA", "Greedy", [k("d10", "10.1 Greedy — exchange argument, activity selection, interval scheduling (DSA gap #10)")])
    ] },
    { p: 9, title: "Maths Extras · JUnit, Maven and JDBC", practice: ["b46_e1"], topics: [
      topic("DSA", "Maths", [k("d16", "10.2 Maths extras — fast power, modular inverse, nCr / Pascal's triangle (DSA gap #16)")]),
      topic("Java", "Before Spring Boot", [k("g12", "JUnit, Maven/Gradle and JDBC (Java gap #12)")])
    ] },

    // ===================== PHASE 11: GRAPHS AND UNION-FIND (Days 57–62) =====================
    { p: 10, title: "Graphs — Representation, BFS, DFS and Components · Maven in Depth", topics: [
      topic("DSA", "Graphs", [
        k("t02", "11.1–11.2 Graph vocabulary, representation, BFS, DFS, connected components (DSA topic #2, sections 0–4)", [0, 4])
      ]),
      topic("Spring Boot", "Spring Boot Track", [
        k("sbr", "The Spring Boot notes — plan and how the 18 parts fit together"),
        k("s01", "S.1 Maven in depth (Spring #1)")
      ])
    ] },
    { p: 10, title: "Grid Graphs and Word Ladder", topics: [
      topic("DSA", "Graphs", [
        k("t02", "11.3 Grid graphs — flood fill, islands, rotting oranges (DSA topic #2, section 5)", [5, 5]),
        k("v65", "11.4 Word Ladder — LC 127 (video 65)")
      ])
    ] },
    { p: 10, title: "Cycles, Topological Sort and Bipartite Graphs · HTTP & REST", practice: ["b45_e1"], topics: [
      topic("DSA", "Graphs", [
        k("t02", "11.5–11.7 Cycle detection, topological sort, bipartite graphs (DSA topic #2, sections 6–8)", [6, 8])
      ]),
      topic("Spring Boot", "Spring Boot Track", [k("s02", "S.2 HTTP & REST basics (Spring #2)")])
    ] },
    { p: 10, title: "Union-Find (DSU)", topics: [
      topic("DSA", "Graphs", [k("t03", "11.8 Union-Find — union by rank, path compression (DSA topic #3)")])
    ] },
    { p: 10, title: "Shortest Paths · Spring Core", practice: ["d19_e1", "d19_e2"], topics: [
      topic("DSA", "Graphs", [
        k("t02", "11.9 Dijkstra, 0-1 BFS, Bellman-Ford, Floyd-Warshall (DSA topic #2, sections 9–10)", [9, 10])
      ]),
      topic("Spring Boot", "Spring Boot Track", [k("s03", "S.3 Spring Core — IoC, DI, beans, scopes, lifecycle (Spring #3)")])
    ] },
    { p: 10, title: "Minimum Spanning Trees, Implicit Graphs and SCC", topics: [
      topic("DSA", "Graphs", [
        k("t02", "11.10–11.11 MST, implicit graphs & cloning, SCC and bridges, choosing an algorithm (DSA topic #2, sections 11–14)", [11, 14])
      ])
    ] },

    // ===================== PHASE 12: DYNAMIC PROGRAMMING (Days 63–68) =====================
    { p: 11, title: "DP Foundations and 1D DP · Spring Boot Fundamentals", practice: ["b54_e1", "d20_e3"], topics: [
      topic("DSA", "Dynamic Programming", [
        k("t01", "12.1–12.2 What DP is, Fibonacci four ways, the five-step method, 1D DP (DSA topic #1, sections 0–3)", [0, 3])
      ]),
      topic("Spring Boot", "Spring Boot Track", [k("s04", "S.4 Spring Boot fundamentals — starters, auto-configuration, config, profiles (Spring #4)")])
    ] },
    { p: 11, title: "Knapsack DP", topics: [
      topic("DSA", "Dynamic Programming", [
        k("t01", "12.3–12.4 0/1 knapsack, subset sum, unbounded knapsack, coin change (DSA topic #1, sections 4–5)", [4, 5])
      ])
    ] },
    { p: 11, title: "Grid DP and LIS · REST Controllers", practice: ["d20_e1"], topics: [
      topic("DSA", "Dynamic Programming", [
        k("t01", "12.5–12.6 Grid DP and longest increasing subsequence (DSA topic #1, sections 6–7)", [6, 7])
      ]),
      topic("Spring Boot", "Spring Boot Track", [k("s05", "S.5 REST controllers — mappings, ResponseEntity, DTOs, Jackson, filters (Spring #5)")])
    ] },
    { p: 11, title: "String DP", topics: [
      topic("DSA", "Dynamic Programming", [
        k("t01", "12.7 String DP — LCS, edit distance, palindromes (DSA topic #1, section 8)", [8, 8])
      ])
    ] },
    { p: 11, title: "Stock Problems · Validation and Error Handling", practice: ["d20_e2"], topics: [
      topic("DSA", "Dynamic Programming", [
        k("t01", "12.8 Stock problems — state-machine DP (DSA topic #1, section 12)", [12, 12])
      ]),
      topic("Spring Boot", "Spring Boot Track", [k("s06", "S.6 Validation & error handling (Spring #6)")])
    ] },
    { p: 11, title: "Interval, Tree and Bitmask DP", topics: [
      topic("DSA", "Dynamic Programming", [
        k("t01", "12.9–12.11 Interval DP, DP on trees, bitmask DP (DSA topic #1, sections 9–11)", [9, 11]),
        k("t01", "Recognising DP, pitfalls and the problem list (DSA topic #1, section 13)", [13, 13])
      ])
    ] },

    // ===================== SPRING BOOT TRACK (Days 69–80) =====================
    { p: 12, title: "SQL Essentials on PostgreSQL", practice: ["b47_e1", "b48_e1", "b48_e2", "b49_e1"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s07", "S.7 SQL essentials — DDL, joins, GROUP BY, window functions, indexes, transactions (Spring #7)")])
    ] },
    { p: 12, title: "Data Access I — JDBC, JPA and Flyway", practice: ["d21_e1"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s08", "S.8 Data access I — JdbcClient, JPA, entity lifecycle, relationships, Flyway, HikariCP (Spring #8)")])
    ] },
    { p: 12, title: "Data Access II — Queries and Transactions", practice: ["b50_e1", "d21_e2", "d21_e3", "d22_e1", "d22_e2", "d22_e3"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s09", "S.9 Data access II — queries, projections, N+1, paging, @Transactional (Spring #9)")])
    ] },
    { p: 12, title: "Testing Spring Boot Apps", practice: ["d24_e1", "d24_e2", "d24_e3"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s10", "S.10 Testing — JUnit 5, Mockito, slices, @SpringBootTest, Testcontainers (Spring #10)")])
    ] },
    { p: 12, title: "Spring Security", practice: ["d23_e1", "d23_e2", "d23_e3"], time: "3–4 hrs", topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s11", "S.11 Spring Security — filter chain, BCrypt, JWT, OAuth2, method security (Spring #11)")])
    ] },
    { p: 12, title: "Production Features", practice: ["d25_e1", "d25_e2", "d25_e3"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s12", "S.12 Production features — logging, Actuator, metrics, OpenAPI, virtual threads (Spring #12)")])
    ] },
    { p: 12, title: "Advanced Spring", practice: ["d19_e3", "d26_e1", "d26_e3"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s13", "S.13 Advanced Spring — AOP, @Async, @Scheduled, events, caching, RestClient (Spring #13)")])
    ] },
    { p: 12, title: "Deployment — Jars, Docker, Kubernetes and CI", topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s14", "S.14 Deployment — jars, Docker, compose, Kubernetes probes, GitHub Actions (Spring #14)")])
    ] },
    { p: 12, title: "Capstone Project", practice: ["d26_e2"], time: "3–4 hrs", topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s15", "S.15 Capstone — one request end to end, test pyramid, trade-offs, interview pitch (Spring #15)")])
    ] },
    { p: 12, title: "Messaging with Kafka and RabbitMQ", practice: ["b79_e1"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s16", "S.16 Messaging — Kafka model, outbox, idempotent consumers, retries, RabbitMQ (Spring #16)")])
    ] },
    { p: 12, title: "Microservices", practice: ["b76_e1"], topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s17", "S.17 Microservices — config, discovery, gateway, tracing, circuit breakers, sagas (Spring #17)")])
    ] },
    { p: 12, title: "MongoDB with Spring Data", topics: [
      topic("Spring Boot", "Spring Boot Track", [k("s18", "S.18 MongoDB with Spring Data — mapping, repositories, aggregation, indexes (Spring #18)")])
    ] },

    // ===================== PHASE 13: ADVANCED AND OPTIONAL TOPICS (Days 81–83) =====================
    { p: 13, title: "String Algorithms — KMP, Z and Manacher", topics: [
      topic("DSA", "Advanced", [k("d14", "KMP, Z-algorithm, Manacher (DSA gap #14)")])
    ] },
    { p: 13, title: "Range Queries — Fenwick, Lazy Segment Tree, Sparse Table and Mo's", topics: [
      topic("DSA", "Advanced", [
        k("d15", "Fenwick tree, lazy segment tree, sparse table (DSA gap #15)"),
        k("v62", "Sqrt decomposition & Mo's algorithm (video 62)")
      ])
    ] },
    { p: 13, title: "Serialization, Reflection, Regex and java.time", practice: ["d7_e3", "d10_e2", "d10_e3"], topics: [
      topic("Java", "Advanced", [k("g11", "Serialization, reflection, regex, java.time (Java gap #11)")])
    ] },

    // ===================== EXTRA: CLOUD AND INFRASTRUCTURE (Days 84–90) =====================
    { p: 14, title: "AWS — Accounts, IAM and Networking", topics: [
      topic("DB/DevOps", "AWS — Getting Started", [
        ["b85_t1_s1", "Cloud in simple words — renting computers; regions and availability zones"],
        ["b85_t1_s2", "Create an AWS account safely — free tier, a billing alarm, MFA on the root user"],
        "d45_t1_s5", "d45_t1_s6", "d45_t1_s8"
      ])
    ] },
    { p: 14, title: "AWS — Compute: EC2, ECS and Lambda", topics: [fromDay(44, 0)] },
    { p: 14, title: "AWS — Storage with S3", topics: [fromDay(43, 0)] },
    { p: 14, title: "AWS — Databases, Caching and Messaging", topics: [fromDay(48, 0)] },
    { p: 14, title: "AWS — Monitoring and Security", topics: [
      topic("DB/DevOps", "AWS — Monitoring & Keys", ["d45_t1_s1", "d45_t1_s2", "d45_t1_s3", "d45_t1_s4", "d45_t1_s7"])
    ] },
    { p: 14, title: "Terraform — Infrastructure as Code", topics: [fromDay(46, 0)] },
    { p: 14, title: "Terraform Practice and Cloud Review", topics: [
      topic("DB/DevOps", "DevOps — Terraform Practice & AWS Review", ["d47_t1_s1", "d47_t1_s2", "d47_t1_s3", "d47_t1_s4", "d47_t1_s5", "d49_t1_s5", "d49_t1_s1", "d49_t1_s3", "d49_t1_s4"])
    ] },

    // ===================== EXTRA: SYSTEM DESIGN & INTERVIEW PREP (Days 91–100) =====================
    { p: 15, title: "System Design Fundamentals — Part 1", topics: [
      topic("System Design", "HLD — Core Concepts", ["d55_t1_s1", "d55_t1_s2", "d55_t1_s4", "d55_t1_s6", "d55_t1_s7"])
    ] },
    { p: 15, title: "System Design Fundamentals — Part 2", practice: ["b93_e1"], topics: [
      topic("System Design", "HLD — Scaling Techniques", ["d55_t1_s3", "d55_t1_s5", "d55_t1_s8", "d55_t1_s9", "d57_t1_s6"])
    ] },
    { p: 15, title: "System Design Practice", topics: [
      topic("System Design", "HLD — Practice Problems", ["d57_t1_s1", "d57_t1_s2", "d57_t1_s3", "d57_t1_s4", "d57_t1_s5", "d57_t1_s7"])
    ] },
    { p: 15, title: "Revision — Java and Collections", topics: [
      topic("Java", "Revision — Core Java", [
        ["d41_t1_s1", "Go through every \"What I Missed\" note on your roadmap and clear what you can"],
        "d41_t1_s2", "d41_t1_s3", "d50_t1_s1",
        ["d50_t1_s5", "Pick your 5 weakest areas and plan the remaining days around them"]
      ])
    ] },
    { p: 15, title: "Revision — Spring, Kafka and Cloud", topics: [
      topic("Spring Boot", "Revision — Backend Stack", ["d41_t1_s4", "d50_t1_s2", "d41_t1_s5", "d50_t1_s3", "d50_t1_s4", "d49_t1_s2", "d40_t1_s5"])
    ] },
    { p: 15, title: "Revision — SQL and System Design", topics: [fromDay(56, 0)] },
    { p: 15, title: "Behavioral Interviews and Final Weak Areas", topics: [
      fromDay(58, 0),
      topic("DB/DevOps", "Review — Final Weak Area Consolidation", [
        ["d59_t2_s1", "Read your \"What I Missed\" notes one last time and close the gaps"],
        "d59_t2_s2", "d59_t2_s3", "d59_t2_s4"
      ])
    ] },
    { p: 15, title: "Resume, LinkedIn and Your Project Story", topics: [fromDay(58, 1), fromDay(59, 0)] },
    { p: 15, title: "DSA Mock — A Timed Coding Round", topics: [fromDay(60, 0)] },
    { p: 15, title: "🎯 Final Mock Interview Day — You Are Ready!", time: "5–6 hrs", topics: [
      fromDay(60, 1), fromDay(60, 2),
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

  // Each frontend module's subtopics, split evenly over its days (earlier days take the extra one);
  // its exercises go on its last day
  const frontendByDay = {};
  const frontendPracticeByDay = {};
  // Module 29 (the Task Manager UI project) followed the old Spring days, so it isn't part of this track
  FRONTEND_DATA.filter(m => m.module !== 29).forEach(m => {
    if (m.practice) frontendPracticeByDay[m.days[m.days.length - 1]] = m.practice;
    const per = m.subtopics.length / m.days.length;
    m.days.forEach((day, k) => {
      const ids = m.subtopics.slice(Math.round(k * per), Math.round((k + 1) * per)).map(([id]) => id);
      (frontendByDay[day] = frontendByDay[day] || []).push({ ...topic("Frontend", `Frontend — ${m.title}`, ids), module: m.module });
    });
  });

  return DAYS.map((d, i) => {
    const topics = [...d.topics, ...(frontendByDay[i + 1] || [])].map(t => ({ ...t, subtopics: t.subtopics.map(sub).filter(Boolean) }));
    const count = topics.reduce((n, t) => n + t.subtopics.length, 0);
    return {
      day: i + 1,
      phase: BEGINNER_PHASES[d.p],
      phaseRange: `Days ${ranges[d.p].from}–${ranges[d.p].to}`,
      categories: [...new Set(topics.map(t => t.category))],
      title: d.title,
      estimatedTime: d.time || (count > 10 ? "3–4 hrs" : "2–3 hrs"),
      practice: [...(d.practice || []), ...(frontendPracticeByDay[i + 1] || [])],
      topics
    };
  });
})();
