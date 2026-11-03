// @title Valid Parentheses (a stack of expected closers)
// @leetcode valid-parentheses
// @expect true
// @start isValid
import java.util.ArrayDeque;
import java.util.Deque;

public class ValidParentheses {
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');            // remember which closer we now expect
            else if (c == '[') stack.push(']');
            else if (c == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != c) return false;   // wrong closer, or nothing open
        }
        return stack.isEmpty();                       // anything left open is an error
    }

    public static void main(String[] args) {
        System.out.println(isValid("{[()]}"));
    }
}
