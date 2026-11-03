// @title Reverse a linked list (prev / curr / next)
// @leetcode reverse-linked-list
// @expect 3 2 1
// @start reverseList
public class ReverseLinkedList {
    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode reverseList(ListNode head) {
        ListNode prev = null, curr = head;
        while (curr != null) {
            ListNode next = curr.next;   // 1. save the rest of the list
            curr.next = prev;            // 2. reverse this pointer
            prev = curr;                 // 3. move prev forward
            curr = next;                 // 4. move curr forward
        }
        return prev;                     // prev is the new head
    }

    public static void main(String[] args) {
        ListNode head = new ListNode(1);
        head.next = new ListNode(2);
        head.next.next = new ListNode(3);
        ListNode reversed = reverseList(head);
        for (ListNode n = reversed; n != null; n = n.next) System.out.print(n.val + " ");
        System.out.println();
    }
}
