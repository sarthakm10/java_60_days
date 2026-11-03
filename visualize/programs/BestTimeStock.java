// @title Best Time to Buy and Sell Stock (track the cheapest day so far)
// @leetcode best-time-to-buy-and-sell-stock
// @expect 5
// @start maxProfit
// @pointers prices: day
public class BestTimeStock {
    public static int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, best = 0;
        for (int day = 0; day < prices.length; day++) {
            if (prices[day] < minPrice) minPrice = prices[day];          // a cheaper day to buy
            else best = Math.max(best, prices[day] - minPrice);         // or: what if we sell today?
        }
        return best;
    }

    public static void main(String[] args) {
        int[] prices = {7, 1, 5, 3, 6, 4};
        System.out.println(maxProfit(prices));
    }
}
