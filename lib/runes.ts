// UniSat returns rune balances as raw integer strings; the human-readable
// amount is amount / 10^divisibility (e.g. "12345" with divisibility 2 = 123.45).
export function toRuneAmount(rawAmount: unknown, divisibility: unknown): number {
    const raw = String(rawAmount ?? '0').trim();
    if (!/^\d+$/.test(raw)) return 0;

    const decimals = Number.isInteger(divisibility) ? Math.min(Math.max(divisibility as number, 0), 38) : 0;
    if (decimals === 0) return Number(raw);

    // Insert the decimal point on the string to avoid float errors on large raw values
    const padded = raw.padStart(decimals + 1, '0');
    return Number(`${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`);
}

export function formatRuneAmount(amount: number, divisibility: unknown): string {
    const decimals = Number.isInteger(divisibility) ? Math.min(Math.max(divisibility as number, 0), 20) : 0;
    return amount.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
