// Number formatting shared by the rune explorer. Rune prices span from fractions of a sat
// to thousands of sats, so small values keep significant digits instead of fixed decimals.

const DASH = '—';

/** Price in sats, e.g. 17,197 / 1.129 / 0.0004321 */
export function formatSats(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
    const abs = Math.abs(value);
    if (abs >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (abs >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 3 });
    return value.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

/** Amount in sats shown as BTC, e.g. 4525005 -> "0.04525 BTC" */
export function formatBtcFromSats(sats: number | null | undefined): string {
    if (sats === null || sats === undefined || !Number.isFinite(sats)) return DASH;
    const btc = sats / 1e8;
    const digits = btc >= 1 ? { maximumFractionDigits: 3 } : { maximumSignificantDigits: 4 };
    return `${btc.toLocaleString('en-US', digits)} BTC`;
}

/** USD with cents, or significant digits below $1 so small prices keep their precision, e.g. $0.0008842 */
export function formatUsd(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
    if (value !== 0 && Math.abs(value) < 1) {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 4 });
    }
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Large USD amounts, e.g. $87.81M */
export function formatCompactUsd(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
}

/** Large counts, e.g. 10,000,000,000 -> 10B */
export function formatCompactNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
    return value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 });
}

/** Fractional change as a signed percentage, e.g. 0.0523 -> "+5.23%" */
export function formatChange(fraction: number | null | undefined): string {
    if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return DASH;
    const pct = fraction * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
}
