// Shared input validation. Server Actions are public endpoints, so every
// argument coming from the client must be checked again on the server.

// Legacy (P2PKH/P2SH, base58) or SegWit/Taproot (bech32/bech32m, mainnet)
const BTC_ADDRESS_REGEX = /^(?:[13][1-9A-HJ-NP-Za-km-z]{25,34}|bc1[02-9ac-hj-np-z]{11,87}|BC1[02-9AC-HJ-NP-Z]{11,87})$/;

export function isValidBitcoinAddress(address: unknown): address is string {
    return typeof address === 'string' && BTC_ADDRESS_REGEX.test(address);
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(n)));
}

// Rune IDs are "<etching block>:<tx index>", e.g. 840000:3
const RUNE_ID_REGEX = /^\d{1,9}:\d{1,6}$/;
// Spaced rune names: letters A-Z with optional single • spacers between them
const SPACED_RUNE_REGEX = /^[A-Z](?:•?[A-Z]){0,27}$/;

export function isValidRuneId(value: unknown): value is string {
    return typeof value === 'string' && RUNE_ID_REGEX.test(value);
}

export function isValidSpacedRune(value: unknown): value is string {
    return typeof value === 'string' && SPACED_RUNE_REGEX.test(value);
}

/**
 * Turns user input into something the UniSat rune search understands: rune IDs pass
 * through, names lose spacers, dots and spaces ("dog.go to" -> "DOGGOTO"), since the
 * search matches against the unspaced rune name.
 */
export function normalizeRuneQuery(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (RUNE_ID_REGEX.test(trimmed)) return trimmed;
    return trimmed.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 28);
}
