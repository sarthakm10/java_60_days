Your first programs. Make a new class for each exercise (the class name is given above the code), type the starter in yourself, and press ▶. Getting the output to match **exactly**, spaces included, is part of the exercise.

<!-- exercise: b1_e1 | Easy | About me -->
**Concepts:** `System.out.println` · text in double quotes · `\n` for a new line

**Task.** Print three lines about yourself, then the same three lines again using a **single** `println` with `\n` inside the text. Use the details below so your output matches exactly (afterwards, change them to your own).

**Starter code** · `AboutMe.java`

```java
public class AboutMe {
    public static void main(String[] args) {
        // TODO: three println statements: Name, Age, City
        System.out.println("---");
        // TODO: the same three lines with ONE println and \n
    }
}
```

**Expected output**

```text
Name: Asha
Age: 21
City: Pune
---
Name: Asha
Age: 21
City: Pune
```

<!-- hints -->
- Each `println` prints its text and then moves to a new line.
- Inside one string, `\n` starts a new line: `"Name: Asha\nAge: 21"` prints two lines.
- Text must be inside double quotes, and every statement ends with `;`.

<!-- solution -->
```java
public class AboutMe {
    public static void main(String[] args) {
        System.out.println("Name: Asha");
        System.out.println("Age: 21");
        System.out.println("City: Pune");
        System.out.println("---");
        System.out.println("Name: Asha\nAge: 21\nCity: Pune");
    }
}
```

`\n` is an *escape sequence*: a backslash followed by a letter that means something special. Both versions print exactly the same thing.

<!-- exercise: b1_e2 | Easy | A box of stars -->
**Concepts:** `println` · careful counting

**Task.** Print a solid 5 × 5 box of stars, a blank line, then a **hollow** 5 × 5 box (stars only on the border). Stars are separated by single spaces.

**Starter code** · `StarBox.java`

```java
public class StarBox {
    public static void main(String[] args) {
        // TODO: solid box, 5 lines
        System.out.println();
        // TODO: hollow box, 5 lines
    }
}
```

**Expected output**

```text
* * * * *
* * * * *
* * * * *
* * * * *
* * * * *

* * * * *
*       *
*       *
*       *
* * * * *
```

<!-- hints -->
- `System.out.println();` with nothing inside prints an empty line.
- A hollow middle row is a star, 7 spaces, and a star: the spaces replace `" * * * "`.
- On Day 5 you'll print this with loops instead of typing each line.

<!-- solution -->
```java
public class StarBox {
    public static void main(String[] args) {
        System.out.println("* * * * *");
        System.out.println("* * * * *");
        System.out.println("* * * * *");
        System.out.println("* * * * *");
        System.out.println("* * * * *");
        System.out.println();
        System.out.println("* * * * *");
        System.out.println("*       *");
        System.out.println("*       *");
        System.out.println("*       *");
        System.out.println("* * * * *");
    }
}
```

Lining up text by hand is fiddly, which is exactly the motivation for loops on Day 5.

<!-- exercise: b1_e3 | Easy | Predict the output: print, println and escapes -->
**Concepts:** `print` vs `println` · escape sequences `\n`, `\t`, `\"`, `\\`

**Task.** **Before running it**, write down on paper exactly what this program prints. Then run it and compare. For every line you got wrong, work out why.

**Starter code** · `Predict.java`

```java
public class Predict {
    public static void main(String[] args) {
        System.out.print("Java");
        System.out.print(" is");
        System.out.println(" fun");
        System.out.println("Tab\there");
        System.out.println("She said \"hi\"");
        System.out.println("Path: C:\\code");
        System.out.print("A\nB");
        System.out.println();
        System.out.println("Done");
    }
}
```

<!-- hints -->
- `print` doesn't move to a new line; the next output continues on the same line.
- `\t` is a tab (a wide space), `\"` prints a double quote, `\\` prints one backslash.
- `print("A\nB")` prints A, a new line, then B, and stays on B's line until the next `println()`.

<!-- solution -->
```java
public class Predict {
    public static void main(String[] args) {
        System.out.print("Java");
        System.out.print(" is");
        System.out.println(" fun");
        System.out.println("Tab\there");
        System.out.println("She said \"hi\"");
        System.out.println("Path: C:\\code");
        System.out.print("A\nB");
        System.out.println();
        System.out.println("Done");
    }
}
```

**Expected output**

```text
Java is fun
Tab	here
She said "hi"
Path: C:\code
A
B
Done
```

The first three statements build one line, because only the last one is a `println`. The empty `println()` near the end finishes the `B` line, so `Done` gets its own line.
