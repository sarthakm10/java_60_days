Strings. Use `charAt` and loops for the character work, `equals` for comparisons, and `StringBuilder` whenever you build a new string piece by piece.

<!-- exercise: b8_e1 | Easy | Character counter -->
**Concepts:** looping over a String · `Character` helper methods · `indexOf` to test membership

**Task.** For the sentence below, count the vowels, consonants, digits, spaces and everything else.

**Starter code** · `CharCounter.java`

```java
public class CharCounter {
    public static void main(String[] args) {
        String text = "Java 21 is Great!";
        int vowels = 0, consonants = 0, digits = 0, spaces = 0, others = 0;
        // TODO: look at each character with charAt
        System.out.println("Vowels: " + vowels);
        System.out.println("Consonants: " + consonants);
        System.out.println("Digits: " + digits);
        System.out.println("Spaces: " + spaces);
        System.out.println("Others: " + others);
    }
}
```

**Expected output**

```text
Vowels: 5
Consonants: 6
Digits: 2
Spaces: 3
Others: 1
```

<!-- hints -->
- Lower-case each character first (`Character.toLowerCase(ch)`) so you only check lower-case vowels.
- `"aeiou".indexOf(ch) >= 0` is a neat way to ask "is ch a vowel?"
- Order your checks: letter (vowel or consonant), then digit, then space, then everything else.

<!-- solution -->
```java
public class CharCounter {
    public static void main(String[] args) {
        String text = "Java 21 is Great!";
        int vowels = 0, consonants = 0, digits = 0, spaces = 0, others = 0;

        for (int i = 0; i < text.length(); i++) {
            char ch = Character.toLowerCase(text.charAt(i));
            if (Character.isLetter(ch)) {
                if ("aeiou".indexOf(ch) >= 0) {
                    vowels++;
                } else {
                    consonants++;
                }
            } else if (Character.isDigit(ch)) {
                digits++;
            } else if (ch == ' ') {
                spaces++;
            } else {
                others++;
            }
        }

        System.out.println("Vowels: " + vowels);
        System.out.println("Consonants: " + consonants);
        System.out.println("Digits: " + digits);
        System.out.println("Spaces: " + spaces);
        System.out.println("Others: " + others);
    }
}
```

Check by hand: the 11 letters split into vowels a, a, i, e, a (5) and consonants J, v, s, G, r, t (6). With 2 digits, 3 spaces and the `!`, that's all 17 characters. The categories should always add up to `text.length()`, which is a handy self-check.

<!-- exercise: b8_e2 | Medium | Palindromes and reversed words -->
**Concepts:** two indexes on a String · skipping characters · `split` and `StringBuilder`

**Task.** Write `isPalindrome(String s)` that ignores case and anything that isn't a letter or digit (so "A man, a plan, a canal: Panama" counts), and `reverseWords(String s)` that reverses the order of the words.

**Starter code** · `Words.java`

```java
public class Words {
    static boolean isPalindrome(String s) {
        return false; // TODO: two indexes moving towards each other
    }

    static String reverseWords(String s) {
        return ""; // TODO: split on spaces, build the result backwards
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("racecar"));
        System.out.println(isPalindrome("A man, a plan, a canal: Panama"));
        System.out.println(isPalindrome("hello"));
        System.out.println(reverseWords("Java is really fun"));
        System.out.println(reverseWords("one"));
    }
}
```

**Expected output**

```text
true
true
false
fun really is Java
one
```

<!-- hints -->
- `left` starts at 0 and `right` at `s.length() - 1`. Skip characters that aren't `Character.isLetterOrDigit` by moving the index, then compare the two lower-cased characters.
- As soon as two characters differ, `return false`. If the indexes meet, it's a palindrome.
- `s.split(" ")` gives the words. Append them to a `StringBuilder` from the last to the first, with a space between.

<!-- solution -->
```java
public class Words {
    static boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            char a = s.charAt(left), b = s.charAt(right);
            if (!Character.isLetterOrDigit(a)) {
                left++;
            } else if (!Character.isLetterOrDigit(b)) {
                right--;
            } else if (Character.toLowerCase(a) != Character.toLowerCase(b)) {
                return false;
            } else {
                left++;
                right--;
            }
        }
        return true;
    }

    static String reverseWords(String s) {
        String[] words = s.split(" ");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) {
                sb.append(" ");
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("racecar"));
        System.out.println(isPalindrome("A man, a plan, a canal: Panama"));
        System.out.println(isPalindrome("hello"));
        System.out.println(reverseWords("Java is really fun"));
        System.out.println(reverseWords("one"));
    }
}
```

The palindrome check never builds a cleaned-up copy of the string: it skips unwanted characters as it goes, so it uses O(1) extra space. This is the same two-pointer idea as reversing an array on Day 7, and it's the "Valid Palindrome" problem from today's DSA list.

<!-- exercise: b8_e3 | Medium | String compression -->
**Concepts:** comparing neighbouring characters · counting runs · `StringBuilder`

**Task.** Compress runs of repeated characters: `"aaabbbbc"` becomes `"a3b4c1"`. If the compressed version isn't **shorter** than the original, return the original unchanged.

**Starter code** · `Compress.java`

```java
public class Compress {
    static String compress(String s) {
        return s; // TODO
    }

    public static void main(String[] args) {
        System.out.println(compress("aaabbbbc"));
        System.out.println(compress("aaaaaaaaaab"));
        System.out.println(compress("abc"));
        System.out.println(compress("aabb"));
        System.out.println(compress(""));
    }
}
```

**Expected output**

```text
a3b4c1
a10b1
abc
aabb

```

<!-- hints -->
- Walk through the string keeping a `count` of the current run. When the next character is different (or you reach the end), append the character and its count, then reset the count to 1.
- Compare `s.charAt(i)` with `s.charAt(i + 1)` only while `i + 1 < s.length()`.
- At the end: `return result.length() < s.length() ? result.toString() : s;`
- An empty string should come back as an empty string, without crashing.

<!-- solution -->
```java
public class Compress {
    static String compress(String s) {
        StringBuilder result = new StringBuilder();
        int count = 1;
        for (int i = 0; i < s.length(); i++) {
            boolean runEnds = i + 1 == s.length() || s.charAt(i) != s.charAt(i + 1);
            if (runEnds) {
                result.append(s.charAt(i)).append(count);
                count = 1;
            } else {
                count++;
            }
        }
        return result.length() < s.length() ? result.toString() : s;
    }

    public static void main(String[] args) {
        System.out.println(compress("aaabbbbc"));
        System.out.println(compress("aaaaaaaaaab"));
        System.out.println(compress("abc"));
        System.out.println(compress("aabb"));
        System.out.println(compress(""));
    }
}
```

`"aabb"` compresses to `"a2b2"`, which is the same length, so the original is returned. Building the result with `StringBuilder` keeps it O(n) instead of creating a new String for every append.
