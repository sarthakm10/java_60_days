// @title Redundant Connection (union-find with a parent array)
// @leetcode redundant-connection
// @expect [2, 3]
// @start findRedundantConnection
import java.util.Arrays;

public class RedundantConnection {
    public static int[] findRedundantConnection(int[][] edges) {
        int[] parent = new int[edges.length + 1];
        for (int i = 0; i < parent.length; i++) parent[i] = i;      // every node starts as its own group
        for (int[] edge : edges) {
            int a = find(parent, edge[0]);
            int b = find(parent, edge[1]);
            if (a == b) return edge;                                  // already connected: this edge closes a cycle
            parent[a] = b;                                            // join the two groups
        }
        return new int[0];
    }

    static int find(int[] parent, int x) {
        while (parent[x] != x) {                                      // walk up to the group's root
            x = parent[x];
        }
        return x;
    }

    public static void main(String[] args) {
        int[][] edges = {{1, 2}, {1, 3}, {2, 3}};
        System.out.println(Arrays.toString(findRedundantConnection(edges)));
    }
}
