// @title Factorial with recursion (the call stack)
// @start factorial
public class Factorial {
    static int factorial(int n) {
        if (n <= 1) return 1;            // base case
        return n * factorial(n - 1);     // recursive case: a smaller problem
    }

    public static void main(String[] args) {
        System.out.println(factorial(4));
    }
}
