// A tour of what the Java Step Visualizer draws. Open this file, click ▶ in the title bar, then press → (or F10).
// Each part calls one small method: watch the panel draw the data and the call stack while the editor
// highlights the line that runs next. Then change something (a number, a word), save, and watch it re-record.
//
// The two settings below tell the visualizer that left and right are indexes into the array nums.
// @pointers nums: left right
// @window nums: left right
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

public class Tour {

    // 1. Two pointers: swap from both ends towards the middle
    static void reverse(int[] nums) {
        int left = 0, right = nums.length - 1;
        while (left < right) {
            int tmp = nums[left];
            nums[left] = nums[right];
            nums[right] = tmp;
            left++;
            right--;
        }
    }

    // 2. A HashMap counting words
    static Map<String, Integer> countWords(String[] words) {
        Map<String, Integer> counts = new HashMap<>();
        for (String word : words) {
            counts.put(word, counts.getOrDefault(word, 0) + 1);
        }
        return counts;
    }

    // 3. A stack checking brackets: push the closer you expect, pop it when it arrives
    static boolean balanced(String text) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : text.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }

    // 4. A linked list, reversed by re-pointing each node
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }

    static Node reverseList(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }

    // 5. Recursion on a tree: the call stack grows on the way down and shrinks on the way back
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int depth(TreeNode node) {
        if (node == null) return 0;
        int leftDepth = depth(node.left);
        int rightDepth = depth(node.right);
        return 1 + Math.max(leftDepth, rightDepth);
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5};
        reverse(nums);
        System.out.println("reversed: " + java.util.Arrays.toString(nums));

        Map<String, Integer> counts = countWords(new String[]{"to", "be", "or", "not", "to", "be"});
        System.out.println("counts: " + counts);

        System.out.println("balanced: " + balanced("([()])"));

        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);
        Node reversed = reverseList(head);
        System.out.println("list starts with: " + reversed.val);

        TreeNode root = new TreeNode(3);
        root.left = new TreeNode(9);
        root.right = new TreeNode(20);
        root.right.left = new TreeNode(15);
        System.out.println("tree depth: " + depth(root));
    }
}
