// @title Fibonacci Number (recursion: two calls per call)
// @leetcode fibonacci-number
// @expect 3
// @start fib
public class Fibonacci {
    static int fib(int n) {
        if (n <= 1) return n;                 // base cases: fib(0) = 0, fib(1) = 1
        return fib(n - 1) + fib(n - 2);       // two smaller problems
    }

    public static void main(String[] args) {
        System.out.println(fib(4));
    }
}
