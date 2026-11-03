// @title Middle of the Linked List (slow and fast pointers)
// @leetcode middle-of-the-linked-list
// @expect 3 4 5
// @start middleNode
public class MiddleOfList {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;          // one step
            fast = fast.next.next;     // two steps: when fast reaches the end, slow is halfway
        }
        return slow;
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(1), tail = head;
        for (int v = 2; v <= 5; v++) tail = tail.next = new ListNode(v);
        ListNode middle = middleNode(head);
        for (ListNode n = middle; n != null; n = n.next) System.out.print(n.val + " ");
        System.out.println();
    }
}
