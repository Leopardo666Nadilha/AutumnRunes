'use server';

import { clampInt, isValidBitcoinAddress } from './validation';

const MEMPOOL_BASE_URL = 'https://mempool.space/api';

export interface AddressTransaction {
    txid: string;
    /** Net change for the address in satoshis (positive = received, negative = sent, fee included) */
    netSats: number;
    /** True when the tx carries a Runestone (OP_RETURN OP_13), i.e. it moves or etches Runes */
    hasRunestone: boolean;
    confirmed: boolean;
    /** Unix timestamp in seconds, null while unconfirmed */
    blockTime: number | null;
}

interface MempoolTxOutput {
    scriptpubkey_asm?: string;
    scriptpubkey_address?: string;
    value: number;
}

interface MempoolTx {
    txid: string;
    vin: { prevout: MempoolTxOutput | null }[];
    vout: MempoolTxOutput[];
    status: { confirmed: boolean; block_time?: number };
}

/**
 * Fetches the latest transactions of an address (mempool + up to 25 confirmed)
 * with the net BTC amount for that address.
 */
export async function getAddressTransactions(address: string, limit = 5): Promise<AddressTransaction[] | null> {
    if (!isValidBitcoinAddress(address)) return null;
    const safeLimit = clampInt(limit, 1, 50, 5);

    try {
        const res = await fetch(`${MEMPOOL_BASE_URL}/address/${encodeURIComponent(address)}/txs`, {
            next: { revalidate: 30 },
        });
        if (!res.ok) return null;
        const txs: MempoolTx[] = await res.json();

        return txs.slice(0, safeLimit).map((tx) => {
            const received = tx.vout
                .filter((out) => out.scriptpubkey_address === address)
                .reduce((sum, out) => sum + out.value, 0);
            const spent = tx.vin
                .filter((input) => input.prevout?.scriptpubkey_address === address)
                .reduce((sum, input) => sum + (input.prevout?.value ?? 0), 0);

            return {
                txid: tx.txid,
                netSats: received - spent,
                hasRunestone: tx.vout.some((out) => out.scriptpubkey_asm?.startsWith('OP_RETURN OP_PUSHNUM_13') ?? false),
                confirmed: tx.status.confirmed,
                blockTime: tx.status.block_time ?? null,
            };
        });
    } catch (error) {
        console.error("getAddressTransactions error:", error);
        return null;
    }
}
