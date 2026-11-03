// @title Validate Binary Search Tree (each node gets an allowed range)
// @leetcode validate-binary-search-tree
// @expect false
// @start isValidBST
import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;

public class ValidateBST {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    public static boolean isValidBST(TreeNode root) {
        return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    static boolean valid(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;     // outside what its ancestors allow
        return valid(node.left, low, node.val) && valid(node.right, node.val, high);
    }

    public static void main(String[] args) {
        TreeNode root = build(5, 1, 4, null, null, 3, 6);
        System.out.println(isValidBST(root));
    }

    // LeetCode's level-order list → a tree
    static TreeNode build(Integer... values) {
        TreeNode root = new TreeNode(values[0]);
        Queue<TreeNode> queue = new ArrayDeque<>(List.of(root));
        for (int i = 1; i < values.length; i += 2) {
            TreeNode node = queue.poll();
            if (values[i] != null) queue.offer(node.left = new TreeNode(values[i]));
            if (i + 1 < values.length && values[i + 1] != null) queue.offer(node.right = new TreeNode(values[i + 1]));
        }
        return root;
    }
}
