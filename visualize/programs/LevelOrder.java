// @title Binary Tree Level Order Traversal (BFS with a queue)
// @leetcode binary-tree-level-order-traversal
// @expect [[3], [9, 20], [15, 7]]
// @start levelOrder
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

public class LevelOrder {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    public static List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        if (root == null) return levels;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size();                 // everything in the queue now is one level
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);     // children wait for the next level
                if (node.right != null) queue.offer(node.right);
            }
            levels.add(level);
        }
        return levels;
    }

    public static void main(String[] args) {
        TreeNode root = build(3, 9, 20, null, null, 15, 7);
        System.out.println(levelOrder(root));
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
