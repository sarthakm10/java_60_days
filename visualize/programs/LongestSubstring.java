// @title Longest Substring Without Repeating Characters (sliding window + set)
// @leetcode longest-substring-without-repeating-characters
// @expect 3
// @start lengthOfLongestSubstring
// @pointers s: left right
// @window s: left right
import java.util.HashSet;
import java.util.Set;

public class LongestSubstring {
    public static int lengthOfLongestSubstring(String s) {
        Set<Character> window = new HashSet<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            while (window.contains(c)) {          // c is already inside: shrink from the left
                window.remove(s.charAt(left));
                left++;
            }
            window.add(c);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb"));
    }
}
