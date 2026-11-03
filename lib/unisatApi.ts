'use server';

import { clampInt, isValidBitcoinAddress, isValidRuneId, isValidSpacedRune, normalizeRuneQuery } from './validation';

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

// ---------------------------------------------------------------------------
// Rune explorer (read-only indexer and marketplace data)
// ---------------------------------------------------------------------------

export interface RuneInfo {
    runeid: string;
    rune: string;
    spacedRune: string;
    number: number;
    height: number;
    timestamp: number;
    divisibility: number;
    symbol: string;
    etching: string;
    premine: string;
    terms: { amount: string | null; cap: string | null } | null;
    mints: string;
    burned: string;
    holders: number;
    transactions: number;
    supply: string;
    mintable: boolean;
}

/** Window UniSat aggregates price change and volume over */
export type MarketPeriod = '24h' | '7d' | '30d';

export interface RuneMarketStats {
    /** Price of one whole rune unit, in sats */
    curPrice: number;
    /** Price change over the period as a fraction (0.05 = +5%); 0 when nothing traded */
    changePercent: number;
    /** Traded volume over the period, in sats */
    btcVolume: number;
    capUSD: number | null;
    warning: boolean;
    verified: boolean;
}

export interface RuneListItem {
    runeId: string;
    spacedRune: string;
    symbol: string;
    holders: number | null;
    market: RuneMarketStats | null;
}

export interface RuneListPage {
    items: RuneListItem[];
    hasMore: boolean;
    /** BTC price in USD reported by UniSat, used to convert sat prices */
    btcPrice: number | null;
}

export interface RuneSale {
    id: string;
    /** Unix time in milliseconds */
    time: number;
    /** Sats paid per whole rune unit */
    unitPrice: number;
    amount: number;
    /** Total sats paid */
    price: number;
    txid: string | null;
}

// Market lists are ordered by traded volume; one big page doubles as the price lookup for search results
const MARKET_LOOKUP_SIZE = 499;
const MARKET_TIME_TYPES: Record<MarketPeriod, string> = { '24h': 'day1', '7d': 'day7', '30d': 'day30' };
// The activity endpoint rejects limits of 500 or more
const RUNE_SALES_PAGE_SIZE = 499;

interface RawMarketItem {
    tick?: string;
    runeId?: string;
    symbol?: string;
    holders?: number;
    curPrice?: number;
    changePercent?: number;
    btcVolume?: number;
    capUSD?: string;
    warning?: boolean;
    verification?: boolean;
}

function toMarketStats(raw: RawMarketItem): RuneMarketStats | null {
    if (typeof raw.curPrice !== 'number' || !Number.isFinite(raw.curPrice)) return null;
    const capUSD = Number(raw.capUSD);
    return {
        curPrice: raw.curPrice,
        changePercent: typeof raw.changePercent === 'number' ? raw.changePercent : 0,
        btcVolume: typeof raw.btcVolume === 'number' ? raw.btcVolume : 0,
        capUSD: Number.isFinite(capUSD) && capUSD > 0 ? capUSD : null,
        warning: raw.warning === true,
        verified: raw.verification === true,
    };
}

async function postMarket<T>(path: string, body: unknown, revalidate: number): Promise<T | null> {
    const res = await fetch(`${UNISAT_BASE_URL}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
        // POST and authorized requests are only cached when opted in explicitly
        cache: 'force-cache',
        next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.code === 0 ? (json.data ?? null) : null;
}

async function fetchMarketPage(start: number, limit: number, period: unknown) {
    // Unknown periods (the argument comes from the client) fall back to 24h
    const timeType = MARKET_TIME_TYPES[period as MarketPeriod] ?? MARKET_TIME_TYPES['24h'];
    return postMarket<{ BTCPrice?: number; list?: RawMarketItem[] }>(
        '/v3/market/runes/auction/runes_types',
        { timeType, start, limit },
        60,
    );
}

/**
 * Runes on the UniSat marketplace ordered by traded volume over `period`;
 * runes with no trades in the period follow, with zero change and volume.
 */
export async function getRunesMarketList(start = 0, limit = 50, period: MarketPeriod = '24h'): Promise<RuneListPage | null> {
    const safeStart = clampInt(start, 0, 10_000, 0);
    const safeLimit = clampInt(limit, 1, 100, 50);
    try {
        const data = await fetchMarketPage(safeStart, safeLimit, period);
        if (!data || !Array.isArray(data.list)) return null;
        const items = data.list
            .filter((raw) => isValidRuneId(raw.runeId) && typeof raw.tick === 'string')
            .map((raw) => ({
                runeId: raw.runeId as string,
                spacedRune: raw.tick as string,
                symbol: raw.symbol ?? '',
                holders: typeof raw.holders === 'number' ? raw.holders : null,
                market: toMarketStats(raw),
            }));
        return {
            items,
            // The endpoint does not report a total; a full page means there may be more
            hasMore: data.list.length === safeLimit,
            btcPrice: typeof data.BTCPrice === 'number' ? data.BTCPrice : null,
        };
    } catch (error) {
        console.error("getRunesMarketList error:", error);
        return null;
    }
}

/**
 * Searches runes by any part of the name (spacers optional) or by exact rune ID, ordered by holders.
 * Prices come from the most traded runes list, so runes without recent trades have no market data.
 */
export async function searchRunes(query: string, start = 0, limit = 20, period: MarketPeriod = '24h'): Promise<RuneListPage | null> {
    const normalized = normalizeRuneQuery(query);
    if (!normalized) return null;
    const safeStart = clampInt(start, 0, 10_000, 0);
    const safeLimit = clampInt(limit, 1, 50, 20);
    try {
        const [searchRes, market] = await Promise.all([
            fetch(`${UNISAT_BASE_URL}/v1/indexer/runes/info-list?rune=${encodeURIComponent(normalized)}&start=${safeStart}&limit=${safeLimit}`, {
                headers: getHeaders(),
                cache: 'force-cache',
                next: { revalidate: 300 },
            }),
            fetchMarketPage(0, MARKET_LOOKUP_SIZE, period).catch(() => null),
        ]);
        if (!searchRes.ok) return null;
        const json = await searchRes.json();
        const detail: RuneInfo[] = Array.isArray(json?.data?.detail) ? json.data.detail : [];
        const total = typeof json?.data?.total === 'number' ? json.data.total : 0;

        const marketById = new Map<string, RawMarketItem>();
        for (const raw of market?.list ?? []) {
            if (raw.runeId) marketById.set(raw.runeId, raw);
        }

        return {
            items: detail
                .filter((rune) => isValidRuneId(rune.runeid))
                .map((rune) => {
                    const raw = marketById.get(rune.runeid);
                    return {
                        runeId: rune.runeid,
                        spacedRune: rune.spacedRune,
                        symbol: rune.symbol ?? '',
                        holders: typeof rune.holders === 'number' ? rune.holders : null,
                        market: raw ? toMarketStats(raw) : null,
                    };
                }),
            hasMore: safeStart + detail.length < total,
            btcPrice: typeof market?.BTCPrice === 'number' ? market.BTCPrice : null,
        };
    } catch (error) {
        console.error("searchRunes error:", error);
        return null;
    }
}

/**
 * Indexer data for one rune: supply, holders, mint terms, etching, etc.
 */
export async function getRuneInfo(runeId: string): Promise<RuneInfo | null> {
    if (!isValidRuneId(runeId)) return null;
    try {
        const res = await fetch(`${UNISAT_BASE_URL}/v1/indexer/runes/${encodeURIComponent(runeId)}/info`, {
            headers: getHeaders(),
            cache: 'force-cache',
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data?.runeid === runeId ? data.data : null;
    } catch (error) {
        console.error("getRuneInfo error:", error);
        return null;
    }
}

/**
 * 24h marketplace stats for one rune, or null when it has no market on UniSat.
 */
export async function getRuneMarketStats(spacedRune: string): Promise<RuneMarketStats | null> {
    if (!isValidSpacedRune(spacedRune)) return null;
    try {
        const data = await postMarket<RawMarketItem>(
            '/v3/market/runes/auction/runes_types_specified',
            { tick: spacedRune, timeType: 'day1' },
            60,
        );
        return data ? toMarketStats(data) : null;
    } catch (error) {
        console.error("getRuneMarketStats error:", error);
        return null;
    }
}

/**
 * Completed sales of a rune on the UniSat marketplace, newest first, 499 per page.
 * `start` is an offset into the whole sales history, used to page back in time.
 */
export async function getRuneSales(spacedRune: string, start = 0): Promise<{ sales: RuneSale[]; count: number; total: number } | null> {
    if (!isValidSpacedRune(spacedRune)) return null;
    const safeStart = clampInt(start, 0, 1_000_000, 0);
    try {
        const data = await postMarket<{ list?: Record<string, unknown>[]; total?: number }>(
            '/v3/market/runes/auction/actions',
            { filter: { nftType: 'runes', tick: spacedRune, event: 'Sold' }, start: safeStart, limit: RUNE_SALES_PAGE_SIZE },
            60,
        );
        if (!data || !Array.isArray(data.list)) return null;

        const sales: RuneSale[] = [];
        for (const raw of data.list) {
            const amount = Number(raw.amount);
            const price = Number(raw.price);
            const time = Number(raw.timestamp);
            const unitPrice = typeof raw.unitPrice === 'number' ? raw.unitPrice : price / amount;
            if (!(amount > 0) || !(price > 0) || !(time > 0) || !Number.isFinite(unitPrice) || unitPrice <= 0) continue;
            sales.push({
                id: String(raw.auctionId ?? `${raw.txid}-${time}`),
                time,
                unitPrice,
                amount,
                price,
                txid: typeof raw.txid === 'string' && /^[0-9a-f]{64}$/.test(raw.txid) ? raw.txid : null,
            });
        }
        return {
            sales,
            // Raw page size (before dropping malformed entries) so the caller's offset stays aligned
            count: data.list.length,
            total: typeof data.total === 'number' ? data.total : safeStart + data.list.length,
        };
    } catch (error) {
        console.error("getRuneSales error:", error);
        return null;
    }
}
