Arrays. Print arrays with `Arrays.toString(...)` while you work, so you can see what's inside at every step.

<!-- exercise: b7_e1 | Easy | Class statistics -->
**Concepts:** looping over an array · running max and min · average with `double` · two passes

**Task.** Given the marks array, print the count, the highest and lowest marks, the average with 2 decimals, and how many students scored **above** the average.

**Starter code** · `ClassStats.java`

```java
public class ClassStats {
    public static void main(String[] args) {
        int[] marks = {72, 95, 58, 81, 64, 90, 47};
        // TODO: max, min and total in one loop
        // TODO: average (2 decimals)
        // TODO: count above average in a second loop
    }
}
```

**Expected output**

```text
Students: 7
Highest: 95
Lowest: 47
Average: 72.43
Above average: 3
```

<!-- hints -->
- Start `max` and `min` at `marks[0]`, not at 0: what if all marks were negative, or all above 0 for `min`?
- `double average = (double) total / marks.length;` avoids integer division.
- You can't count "above average" until you know the average, so it needs a second loop.

<!-- solution -->
```java
public class ClassStats {
    public static void main(String[] args) {
        int[] marks = {72, 95, 58, 81, 64, 90, 47};

        int max = marks[0], min = marks[0], total = 0;
        for (int m : marks) {
            if (m > max) max = m;
            if (m < min) min = m;
            total += m;
        }
        double average = (double) total / marks.length;

        int above = 0;
        for (int m : marks) {
            if (m > average) above++;
        }

        System.out.println("Students: " + marks.length);
        System.out.println("Highest: " + max);
        System.out.println("Lowest: " + min);
        System.out.printf("Average: %.2f%n", average);
        System.out.println("Above average: " + above);
    }
}
```

Starting max and min from the first element is the standard pattern. The for-each loop is ideal here because the index is never needed.

<!-- exercise: b7_e2 | Medium | Reverse and rotate in place -->
**Concepts:** two indexes moving towards each other · swapping slots · arrays are passed by reference

**Task.** Write `reverse(int[] arr)` that reverses the array **in place** (no second array), and `rotateRight(int[] arr)` that moves every element one step right, with the last element wrapping round to the front. Both methods are `void`: they change the caller's array.

**Starter code** · `ArrayMoves.java`

```java
import java.util.Arrays;

public class ArrayMoves {
    static void reverse(int[] arr) {
        // TODO: swap arr[left] and arr[right], move them towards the middle
    }

    static void rotateRight(int[] arr) {
        // TODO: save the last element, shift the others right, put it at the front
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5};
        reverse(a);
        System.out.println(Arrays.toString(a));
        int[] b = {10, 20, 30, 40};
        reverse(b);
        System.out.println(Arrays.toString(b));
        int[] c = {1, 2, 3, 4, 5};
        rotateRight(c);
        System.out.println(Arrays.toString(c));
        rotateRight(c);
        System.out.println(Arrays.toString(c));
    }
}
```

**Expected output**

```text
[5, 4, 3, 2, 1]
[40, 30, 20, 10]
[5, 1, 2, 3, 4]
[4, 5, 1, 2, 3]
```

<!-- hints -->
- Reverse: `int left = 0, right = arr.length - 1; while (left < right) { swap; left++; right--; }`
- A swap needs a temporary variable, exactly like Day 2.
- Rotate: shift from the **end** backwards (`for (int i = arr.length - 1; i > 0; i--) arr[i] = arr[i - 1];`), otherwise you overwrite values before moving them.
- The methods work on the caller's array because the parameter holds a reference to the same array (Day 7, last section).

<!-- solution -->
```java
import java.util.Arrays;

public class ArrayMoves {
    static void reverse(int[] arr) {
        int left = 0, right = arr.length - 1;
        while (left < right) {
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }

    static void rotateRight(int[] arr) {
        if (arr.length == 0) return;
        int last = arr[arr.length - 1];
        for (int i = arr.length - 1; i > 0; i--) {
            arr[i] = arr[i - 1];
        }
        arr[0] = last;
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5};
        reverse(a);
        System.out.println(Arrays.toString(a));
        int[] b = {10, 20, 30, 40};
        reverse(b);
        System.out.println(Arrays.toString(b));
        int[] c = {1, 2, 3, 4, 5};
        rotateRight(c);
        System.out.println(Arrays.toString(c));
        rotateRight(c);
        System.out.println(Arrays.toString(c));
    }
}
```

Reversing touches each element once (O(n)) and needs only one extra variable (O(1) space). With an odd length the middle element simply stays put, because the loop stops when `left == right`.

<!-- exercise: b7_e3 | Medium | Grid sums -->
**Concepts:** 2D arrays · nested loops · row vs column indexes

**Task.** For the 3 × 4 grid below, print the sum of each row, the sum of each column, and the largest value with its position.

**Starter code** · `GridSums.java`

```java
public class GridSums {
    public static void main(String[] args) {
        int[][] grid = {
            {3, 8, 1, 9},
            {7, 2, 6, 4},
            {5, 11, 0, 2}
        };
        // TODO: row sums
        // TODO: column sums
        // TODO: largest value and its row/column
    }
}
```

**Expected output**

```text
Row 0 sum: 21
Row 1 sum: 19
Row 2 sum: 18
Col 0 sum: 15
Col 1 sum: 21
Col 2 sum: 7
Col 3 sum: 15
Largest: 11 at row 2, col 1
```

<!-- hints -->
- Row sums: outer loop over rows `r`, inner loop over `grid[r].length` columns.
- Column sums: swap the loops: outer over columns `c` (use `grid[0].length`), inner over rows.
- For the largest value, remember its position in two variables whenever you find a bigger value.

<!-- solution -->
```java
public class GridSums {
    public static void main(String[] args) {
        int[][] grid = {
            {3, 8, 1, 9},
            {7, 2, 6, 4},
            {5, 11, 0, 2}
        };

        for (int r = 0; r < grid.length; r++) {
            int sum = 0;
            for (int c = 0; c < grid[r].length; c++) {
                sum += grid[r][c];
            }
            System.out.println("Row " + r + " sum: " + sum);
        }

        for (int c = 0; c < grid[0].length; c++) {
            int sum = 0;
            for (int r = 0; r < grid.length; r++) {
                sum += grid[r][c];
            }
            System.out.println("Col " + c + " sum: " + sum);
        }

        int bestRow = 0, bestCol = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[r].length; c++) {
                if (grid[r][c] > grid[bestRow][bestCol]) {
                    bestRow = r;
                    bestCol = c;
                }
            }
        }
        System.out.println("Largest: " + grid[bestRow][bestCol] + " at row " + bestRow + ", col " + bestCol);
    }
}
```

For column sums the outer loop runs over columns. Keeping the position (row and column) instead of only the value is a pattern you'll reuse in grid problems later.
