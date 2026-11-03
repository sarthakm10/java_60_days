// @title Invert Binary Tree (swap children, recursively)
// @leetcode invert-binary-tree
// @expect [4, 7, 2, 9, 6, 3, 1]
// @start invertTree
// @hide levelOrder
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class InvertTree {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    public static TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode left = invertTree(root.left);
        TreeNode right = invertTree(root.right);
        root.left = right;                 // swap the two children
        root.right = left;
        return root;
    }

    public static void main(String[] args) {
        TreeNode root = build(4, 2, 7, 1, 3, 6, 9);
        invertTree(root);
        System.out.println(levelOrder(root));
    }

    // LeetCode's level-order list ↔ a tree
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

    static List<Integer> levelOrder(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Queue<TreeNode> queue = new ArrayDeque<>(List.of(root));
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            out.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        return out;
    }
}
