// @title Min Stack (a second stack remembers the minimum)
// @leetcode min-stack
// @expect -3 0 -2
import java.util.ArrayDeque;
import java.util.Deque;

public class MinStack {
    private final Deque<Integer> stack = new ArrayDeque<>();
    private final Deque<Integer> minStack = new ArrayDeque<>();   // its top is the smallest value in stack

    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) minStack.push(val);
    }

    public void pop() {
        if (stack.pop().equals(minStack.peek())) minStack.pop();  // the minimum is leaving
    }

    public int top() {
        return stack.peek();
    }

    public int getMin() {
        return minStack.peek();
    }

    public static void main(String[] args) {
        MinStack s = new MinStack();
        s.push(-2);
        s.push(0);
        s.push(-3);
        int a = s.getMin();
        s.pop();
        int b = s.top();
        int c = s.getMin();
        System.out.println(a + " " + b + " " + c);
    }
}
