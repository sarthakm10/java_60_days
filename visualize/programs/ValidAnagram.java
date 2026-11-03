// @title Valid Anagram (count letters with a HashMap)
// @leetcode valid-anagram
// @expect true
// @start isAnagram
import java.util.HashMap;
import java.util.Map;

public class ValidAnagram {
    public static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Integer> count = new HashMap<>();
        for (char c : s.toCharArray()) {
            count.merge(c, 1, Integer::sum);                 // count each letter of s
        }
        for (char c : t.toCharArray()) {
            int remaining = count.getOrDefault(c, 0) - 1;    // use one up for t
            if (remaining < 0) return false;                 // t has more of c than s
            count.put(c, remaining);
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram"));
    }
}
