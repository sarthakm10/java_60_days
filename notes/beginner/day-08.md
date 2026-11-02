# Day 8 — Strings and Characters

> Text is everywhere: names, messages, passwords, JSON from a server. Today you learn to take strings apart and build them up.

**Today's goal:** work with single characters, use the everyday `String` methods, compare strings correctly, and build text efficiently with `StringBuilder`.

<!-- topic: b8_t1 -->
## ☕ Java — Strings

<!-- subtopic: b8_t1_s1 -->
### char: one character, secretly a number

A `char` holds exactly one character, in **single** quotes:

```java
char grade = 'A';
char digit = '7';      // the character 7, not the number 7
char space = ' ';
```

Every character is stored as a number, its **Unicode** code (for English letters, the same as the older **ASCII** table):

| Character | Code |
|---|---|
| `'0'` … `'9'` | 48 … 57 |
| `'A'` … `'Z'` | 65 … 90 |
| `'a'` … `'z'` | 97 … 122 |

So you can do arithmetic with characters:

```java
char c = 'a';
System.out.println(c + 1);          // 98   (char + int gives an int)
System.out.println((char) (c + 1)); // b    (cast back to char)
System.out.println('C' - 'A');      // 2    (C is 2 letters after A: handy for "which letter")
System.out.println('7' - '0');      // 7    (turn a digit character into its number value)

for (char ch = 'a'; ch <= 'e'; ch++) {
    System.out.print(ch);           // abcde
}
```

`'7' - '0'` is a classic trick: it converts the character `'7'` into the number `7`. You'll use it in DSA problems.

The `Character` class has helpers so you don't have to remember codes:

```java
Character.isDigit('5')          // true
Character.isLetter('x')         // true
Character.isLetterOrDigit('#')  // false
Character.isUpperCase('Q')      // true
Character.toLowerCase('Q')      // 'q'
Character.isWhitespace(' ')     // true
```

<details>
<summary>How do you turn the character '7' into the number 7?</summary>

`'7' - '0'` (the codes are 55 and 48, so the difference is 7). `Character.getNumericValue('7')` also works.
</details>

<!-- subtopic: b8_t1_s2 -->
### Everyday String methods

A `String` is a sequence of characters, indexed from 0 like an array.

```java
String s = "Hello, Java";
//          01234567890   ← indexes
```

| Method | Returns | `s = "Hello, Java"` |
|---|---|---|
| `s.length()` | number of characters | `11` |
| `s.charAt(i)` | the char at index `i` | `s.charAt(0)` is `'H'` |
| `s.substring(a, b)` | characters from `a` up to (not including) `b` | `s.substring(0, 5)` is `"Hello"` |
| `s.substring(a)` | from `a` to the end | `s.substring(7)` is `"Java"` |
| `s.indexOf(x)` | first position of `x`, or `-1` if absent | `s.indexOf("Java")` is `7` |
| `s.contains(x)` | is `x` inside? | `s.contains("lo")` is `true` |
| `s.startsWith(x)` / `endsWith(x)` | | `s.endsWith("va")` is `true` |
| `s.toUpperCase()` / `toLowerCase()` | | `"HELLO, JAVA"` |
| `s.trim()` | without spaces at both ends | `"  hi  ".trim()` is `"hi"` |
| `s.replace(a, b)` | every `a` replaced by `b` | `s.replace('l', 'L')` is `"HeLLo, Java"` |
| `s.split(sep)` | an array of pieces | `"a,b,c".split(",")` is `["a", "b", "c"]` |
| `s.isEmpty()` / `isBlank()` | length 0? / only spaces? | |
| `String.join(sep, …)` | pieces joined | `String.join("-", "a", "b")` is `"a-b"` |

Note `length()` **has brackets** for Strings, while arrays use `length` without them. Everyone mixes them up at first; the compiler will remind you.

**Looping over characters:**

```java
String word = "banana";
int countA = 0;
for (int i = 0; i < word.length(); i++) {
    if (word.charAt(i) == 'a') {
        countA++;
    }
}
System.out.println(countA);   // 3

for (char ch : word.toCharArray()) { ... }   // for-each version
```

**Splitting a sentence into words:**

```java
String sentence = "Java is fun";
String[] words = sentence.split(" ");
System.out.println(words.length);   // 3
System.out.println(words[2]);       // fun
```

Going past the end (`s.charAt(s.length())`) throws `StringIndexOutOfBoundsException`, the String version of the array error from Day 7.

<details>
<summary>What does "programming".substring(3, 7) return?</summary>

`"gram"`: characters at indexes 3, 4, 5 and 6 (the end index is not included).
</details>

<details>
<summary>What does indexOf return when the text isn't found?</summary>

`-1`.
</details>

<!-- subtopic: b8_t1_s3 -->
### Compare strings with equals(), not ==

This is one of the most important rules in Java:

```java
String a = "java";
String b = new Scanner(System.in).next();   // user types: java

System.out.println(a == b);          // false (!)
System.out.println(a.equals(b));     // true
```

Why? A `String` is an object, and a String variable holds a **reference** to it, just like the arrays on Day 7.

- `==` asks: "are these the **same object** in memory?"
- `equals()` asks: "do they contain the **same characters**?"

The text typed by the user is a different object from your `"java"`, even though the letters match. `==` sometimes *seems* to work with strings typed directly in the code (Java reuses identical literals; Day 19 explains the "String pool"), which makes the bug sneaky. **Always use `equals` for strings.**

```java
if (answer.equals("yes")) { ... }              // ✓
if (answer.equalsIgnoreCase("YES")) { ... }    // ✓ ignores upper/lower case
if ("yes".equals(answer)) { ... }              // ✓ also safe if answer is null
```

For sorting order there's `compareTo`: `"apple".compareTo("banana")` is negative (apple comes first), `0` means equal, and positive means after.

<details>
<summary>Why can == give false for two strings with the same letters?</summary>

`==` compares references (whether they're the same object), not contents. Two separate String objects with the same text are different objects. Use `equals()`.
</details>

<!-- subtopic: b8_t1_s4 -->
### Strings never change

Strings are **immutable**: once created, a String's characters can never be changed. Methods like `toUpperCase()` or `replace()` don't modify the string; they **return a new one**.

```java
String name = "asha";
name.toUpperCase();              // creates "ASHA"… and throws it away
System.out.println(name);        // asha

name = name.toUpperCase();       // store the new string back in the variable
System.out.println(name);        // ASHA
```

The variable `name` now points to a new String object; the old `"asha"` object is untouched (and will be cleaned up automatically once nothing uses it).

Why did Java's designers do this? Immutable strings are safe to share: nobody can change your text behind your back, which matters when strings are used as passwords, file names or map keys (Day 27).

The downside: "changing" a string in a loop creates a new string every time:

```java
String result = "";
for (int i = 0; i < 10000; i++) {
    result = result + i;    // builds a brand-new, longer string 10,000 times: slow
}
```

That's what `StringBuilder` is for.

<details>
<summary>s.toUpperCase(); is called on its own line. Does s change?</summary>

No. Strings are immutable; `toUpperCase()` returns a new String. Write `s = s.toUpperCase();` to keep it.
</details>

<!-- subtopic: b8_t1_s5 -->
### StringBuilder: building text in a loop

`StringBuilder` is a **changeable** sequence of characters. Use it whenever you build a string piece by piece, especially in loops.

```java
StringBuilder sb = new StringBuilder();
for (int i = 1; i <= 5; i++) {
    sb.append(i).append(" ");     // adds to the same builder: no new strings each time
}
String result = sb.toString().trim();
System.out.println(result);       // 1 2 3 4 5
```

| Method | Does |
|---|---|
| `append(x)` | adds `x` (any type) to the end |
| `insert(i, x)` | inserts `x` at index `i` |
| `reverse()` | reverses it in place |
| `deleteCharAt(i)` | removes one character |
| `setCharAt(i, c)` | replaces one character |
| `length()`, `charAt(i)` | like String |
| `toString()` | gives you a normal String |

Reversing a string is a one-liner:

```java
String reversed = new StringBuilder("hello").reverse().toString();   // "olleh"
```

Rule of thumb: joining a few strings once with `+` is fine. **Building inside a loop: use `StringBuilder`.**

<details>
<summary>When should you use StringBuilder instead of +?</summary>

When building a string in a loop (or from many pieces). `+` creates a new String each time; `StringBuilder` changes one buffer.
</details>

<!-- topic: b8_t2 -->
## 🧮 DSA — Strings: Easy Problems

Five classic string problems, written up in interview style. Everything you need is in today's notes: `charAt`, loops, two indexes moving towards each other, and counting with an array.

**Counting letters with an array.** Several of these problems count how often each letter appears. For lowercase English letters, an `int[26]` works as a counter, with `ch - 'a'` as the index:

```java
int[] count = new int[26];
for (char ch : "banana".toCharArray()) {
    count[ch - 'a']++;          // 'a' → 0, 'b' → 1, … 'z' → 25
}
System.out.println(count[0]);   // 3 a's
System.out.println(count['n' - 'a']);   // 2 n's
```

Some solutions mention `HashMap`; you'll learn it on Day 27, and the `int[26]` approach works for all of these.

## 📝 Day 8 Recap

1. Quotes for char vs String? → **'single' for char, "double" for String**
2. 'c' - 'a'? → **2**
3. Convert the char '9' to the number 9? → **'9' - '0'**
4. Length of a String vs an array? → **s.length() with brackets; arr.length without**
5. "hello".substring(1, 3)? → **"el"**
6. indexOf when not found? → **-1**
7. How to compare two strings' text? → **a.equals(b), never ==**
8. What does == compare for objects? → **references (same object?), not contents**
9. Are Strings mutable? → **no, methods return a new String**
10. Reverse a string quickly? → **new StringBuilder(s).reverse().toString()**
