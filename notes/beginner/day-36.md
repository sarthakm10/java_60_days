# Day 36 — Streams, Part 2: Grouping and Reducing

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** group and summarise data with collectors (the stream version of SQL's GROUP BY), flatten nested lists, and combine values with `reduce`.

<!-- topic: b36_t1 -->
## ☕ Java — Advanced Streams

<!-- intro: d5_t1_s5 -->
`Collectors.groupingBy` sorts items into groups by a key and gives you a `Map`: "employees by department" is one line, `employees.stream().collect(groupingBy(Employee::getDept))`, giving `Map<String, List<Employee>>`. Add a second collector to summarise each group instead of listing it: `groupingBy(Employee::getDept, counting())` counts per department, `averagingDouble(...)` averages. It's the most asked stream question in interviews.

<!-- intro: d5_t1_s6 -->
`partitioningBy` is grouping with only two groups, `true` and `false`: `partitioningBy(s -> s.getMarks() >= 40)` gives a map with the passed students under `true` and the rest under `false`.

<!-- intro: d5_t1_s7 -->
When each item contains a **list** (each order has several products, each sentence several words), `flatMap` pours all those inner lists into one flat stream: `orders.stream().flatMap(o -> o.getItems().stream())` streams every item of every order. With `map` you'd get a stream of lists instead.

<!-- intro: d5_t1_s8 -->
`reduce` boils a whole stream down to **one** value by repeatedly combining two at a time: `numbers.stream().reduce(0, Integer::sum)` adds them all, starting from 0 (the *identity*, the value that changes nothing, 1 for multiplication). For common cases there are shortcuts like `mapToInt(...).sum()`, `average()` and `max()`.

<!-- topic: b36_t2 -->
## 🧮 DSA — Dynamic Programming: Easy

**Dynamic programming (DP) in simple words:** remember answers you've already worked out, so you never solve the same small problem twice. Recursive Fibonacci (Day 14) recomputes `fib(3)` again and again and takes exponential time; storing each answer in an array the first time (**memoisation**), or filling the array from the bottom up (**tabulation**), makes it O(n). The DP questions to ask: *what does `dp[i]` mean?*, *how does `dp[i]` follow from smaller answers?*, and *what are the starting values?* Climbing Stairs is Fibonacci in disguise; House Robber is "take this house plus `dp[i−2]`, or skip it and keep `dp[i−1]`".

## 📝 Day 36 Recap

1. What does groupingBy return? → **a Map from each key to the items (or summary) in that group**
2. Count employees per department? → **collect(groupingBy(Employee::getDept, counting()))**
3. partitioningBy groups into? → **two groups, true and false**
4. When do you use flatMap? → **to flatten a stream of lists into one stream of their items**
5. What does reduce do? → **combines all elements into one value**
6. Identity value for summing? → **0**
7. Shortcut to sum ints from a stream? → **mapToInt(...).sum()**
8. Core idea of dynamic programming? → **store answers to subproblems instead of recomputing them**
9. Memoisation vs tabulation? → **top-down recursion with a cache vs filling a table bottom-up**
10. House Robber recurrence? → **dp[i] = max(dp[i-1], dp[i-2] + house[i])**
