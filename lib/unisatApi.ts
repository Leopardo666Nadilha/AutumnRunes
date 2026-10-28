'use server';

import { clampInt, isValidBitcoinAddress } from './validation';

const UNISAT_BASE_URL = 'https://open-api.unisat.io';

const getHeaders = () => ({
    'Authorization': `Bearer ${process.env.UNISAT_API_KEY ?? ''}`,
    'Content-Type': 'application/json',
});

/**
 * Fetches the user's BTC/Satoshi balance and UTXO count.
 */
export async function getAddressBalance(address: string) {
    if (!isValidBitcoinAddress(address)) return null;
    try {
        const res = await fetch(`${UNISAT_BASE_URL}/v1/indexer/address/${encodeURIComponent(address)}/balance`, {
            headers: getHeaders(),
            next: { revalidate: 30 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data ?? null;
    } catch (error) {
        console.error("getAddressBalance error:", error);
        return null;
    }
}

/**
 * Fetches the list of Runes held by the address.
 */
export async function getRunesBalanceList(address: string) {
    if (!isValidBitcoinAddress(address)) return null;
    try {
        const res = await fetch(`${UNISAT_BASE_URL}/v1/indexer/address/${encodeURIComponent(address)}/runes/balance-list?start=0&limit=500`, { // default page size is only 10
            headers: getHeaders(),
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data ?? null;
    } catch (error) {
        console.error("getRunesBalanceList error:", error);
        return null;
    }
}

/**
 * Fetches top Runes with their stats (holders, transactions, supply, etc.)
 * Real endpoint: GET /v1/indexer/runes/info-list?start=0&limit=N
 * Response shape: { data: { detail: [...], total: number, height: number } }
 */
export async function getRunesInfoList(start = 0, limit = 10) {
    const safeStart = clampInt(start, 0, 100_000, 0);
    const safeLimit = clampInt(limit, 1, 100, 10);
    try {
        const res = await fetch(`${UNISAT_BASE_URL}/v1/indexer/runes/info-list?start=${safeStart}&limit=${safeLimit}`, {
            headers: getHeaders(),
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data ?? null;
    } catch (error) {
        console.error("getRunesInfoList error:", error);
        return null;
    }
}
