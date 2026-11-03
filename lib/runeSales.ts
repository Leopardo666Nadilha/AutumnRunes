// Rules for reading UniSat rune sales, shared by the price chart (client) and the
// price change computed on the server.

// Sales priced far from the sales around them (tiny lots worth only the UTXO's dust value,
// typos) would dwarf the real price, so they are left out
const OUTLIER_NEIGHBOURS = 10;
const OUTLIER_FACTOR = 5;
// Fewer sales than this in either period make a price change meaningless
const MIN_SALES_PER_PERIOD = 3;

interface PricedSale {
    /** Unix time in milliseconds */
    time: number;
    /** Sats per whole rune unit */
    unitPrice: number;
    /** Whole rune units */
    amount: number;
    /** Total sats paid */
    price: number;
}

/**
 * Drops sales more than OUTLIER_FACTOR times above or below the median of their neighbours.
 * Expects sales sorted by time, oldest first.
 */
export function withoutOutliers<T extends PricedSale>(sorted: T[]): T[] {
    if (sorted.length < 5) return sorted;
    return sorted.filter((sale, i) => {
        const prices = sorted
            .slice(Math.max(0, i - OUTLIER_NEIGHBOURS), i + OUTLIER_NEIGHBOURS + 1)
            .map((s) => s.unitPrice)
            .sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        return sale.unitPrice <= median * OUTLIER_FACTOR && sale.unitPrice >= median / OUTLIER_FACTOR;
    });
}

/**
 * Volume-weighted average price over the last `periodMs` vs the period before it, ignoring
 * off-market sales. Null when either period has too few sales to compare.
 */
export function salesPriceChange(sales: PricedSale[], periodMs: number, now = Date.now()): number | null {
    const sorted = withoutOutliers([...sales].sort((a, b) => a.time - b.time));
    let curSats = 0, curAmount = 0, curCount = 0;
    let prevSats = 0, prevAmount = 0, prevCount = 0;
    for (const sale of sorted) {
        const age = now - sale.time;
        if (age < 0) continue;
        if (age < periodMs) {
            curSats += sale.price;
            curAmount += sale.amount;
            curCount++;
        } else if (age < 2 * periodMs) {
            prevSats += sale.price;
            prevAmount += sale.amount;
            prevCount++;
        }
    }
    if (curCount < MIN_SALES_PER_PERIOD || prevCount < MIN_SALES_PER_PERIOD) return null;
    return (curSats / curAmount) / (prevSats / prevAmount) - 1;
}
