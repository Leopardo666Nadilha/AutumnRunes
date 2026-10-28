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
