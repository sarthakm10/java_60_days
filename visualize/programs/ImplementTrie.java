// @title Implement Trie (prefix tree): insert, search and startsWith
// @leetcode implement-trie-prefix-tree
// @expect car: true, ca: false, startsWith ca: true, cow: false
// @start insert
public class ImplementTrie {
    static class Node {
        Node[] next = new Node[26];     // one slot per letter a–z
        boolean isWord;                 // a word ends here
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (char ch : word.toCharArray()) {
            int i = ch - 'a';
            if (cur.next[i] == null) cur.next[i] = new Node();   // a new branch
            cur = cur.next[i];
        }
        cur.isWord = true;
    }

    public boolean search(String word) {
        Node node = walk(word);
        return node != null && node.isWord;     // the path exists AND a word ends there
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;            // the path existing is enough
    }

    private Node walk(String s) {
        Node cur = root;
        for (char ch : s.toCharArray()) {
            cur = cur.next[ch - 'a'];
            if (cur == null) return null;       // fell off the trie
        }
        return cur;
    }

    public static void main(String[] args) {
        ImplementTrie trie = new ImplementTrie();
        trie.insert("cat");
        trie.insert("car");
        trie.insert("cart");
        trie.insert("dog");
        System.out.println("car: " + trie.search("car")
                + ", ca: " + trie.search("ca")
                + ", startsWith ca: " + trie.startsWith("ca")
                + ", cow: " + trie.search("cow"));
    }
}
