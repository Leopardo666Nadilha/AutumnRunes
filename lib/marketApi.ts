'use server';

import { clampInt } from './validation';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Limits for getRunesPrices: each ticker costs ~1-2 upstream requests plus an 800ms delay
const MAX_TICKERS = 25;
const MAX_TICKER_LENGTH = 64;

export async function getBitcoinMarketData() {
    try {
        const res = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.bitcoin ?? null;
    } catch (error) {
        console.error("getBitcoinMarketData error:", error);
        return null;
    }
}

// Candle size used for each chart range button (days -> Binance interval)
const OHLC_INTERVALS: Record<number, string> = {
    1: '15m',
    7: '1h',
    30: '4h',
    90: '1d',
    180: '1d',
    365: '1d',
};

// Binance's maximum page size; one page covers the selected range with room to zoom out
const OHLC_PAGE_SIZE = 1000;
// Bitcoin's first exchange prices are from 2010, so nothing older can exist
const MIN_OHLC_END_TIME = Date.UTC(2010, 0, 1);

/**
 * Returns up to 1000 candles as [timestampMs, open, high, low, close], oldest first.
 * Without endTime it returns the latest candles; with endTime (ms) it returns the
 * page ending right before it, so the chart can keep loading older history.
 */
export async function getBitcoinOHLC(days: number = 7, endTime?: number): Promise<number[][] | null> {
    const interval = OHLC_INTERVALS[days] ?? '1d';
    const params = new URLSearchParams({ symbol: 'BTCUSDT', interval, limit: String(OHLC_PAGE_SIZE) });

    if (endTime !== undefined) {
        if (!Number.isFinite(endTime)) return null;
        params.set('endTime', String(clampInt(endTime, MIN_OHLC_END_TIME, Date.now(), Date.now())));
    }

    try {
        const res = await fetch(`https://api.binance.us/api/v3/klines?${params}`, {
            // Older pages never change; only the latest one needs to refresh
            next: { revalidate: endTime === undefined ? 120 : 86400 },
        });
        if (!res.ok) return null;
        const data = await res.json();

        // Binance returns: [ [ Open time, Open, High, Low, Close, Volume, Close time, ... ], ... ]
        if (!Array.isArray(data)) return null;
        return data.map((candle: (string | number)[]) => [
            Number(candle[0]),
            Number(candle[1]),
            Number(candle[2]),
            Number(candle[3]),
            Number(candle[4])
        ]);
    } catch (error) {
        console.error("getBitcoinOHLC error:", error);
        return null;
    }
}

export async function getDogTokenMarketData() {
    try {
        const res = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=dog-go-to-the-moon-rune&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data['dog-go-to-the-moon-rune'] ?? null;
    } catch (error) {
        console.error("getDogTokenMarketData error:", error);
        return null;
    }
}

// Hardcode known top runes/NFTs that might fail the search or be indexed differently
const KNOWN_RUNES: Record<string, string> = {
    'DOG•GO•TO•THE•MOON': 'dog-go-to-the-moon-rune',
    'RSIC•GENESIS•RUNE': 'rsic-genesis-rune',
    'PUPS•WORLD•PEACE': 'pups-world-peace',
    'BZRK•BITCOIN•MEME': 'bzrk-bitcoin-meme',
    'Z•Z•Z•Z•Z•FEHU•Z•Z•Z•Z•Z': 'fehu-2',
    'RUNESTONE': 'nft:runestone' // Prefix 'nft:' to signal it uses the NFT endpoint
};

interface CoinGeckoSearchCoin {
    id?: string;
    name?: string;
}

const normalizeRuneName = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Picks the CoinGecko coin that is really this rune. Matching is exact on the
 * spacer-less name: loose symbol/substring matches used to return unrelated
 * coins (e.g. a rune named "PEPE" priced as the ERC-20 PEPE).
 */
function findRuneCoinId(ticker: string, coins: CoinGeckoSearchCoin[]): string | undefined {
    const target = normalizeRuneName(ticker);
    const hasSpacers = ticker.includes('•');

    const match = coins.find((c) => {
        if (typeof c.id !== 'string' || typeof c.name !== 'string') return false;
        const candidates = [c.name, c.id, c.id.replace(/-runes?$/, '')].map(normalizeRuneName);
        if (!candidates.includes(target)) return false;
        // Single-word names collide easily with regular tokens; require a rune marker
        return hasSpacers || /rune/i.test(c.id) || /rune/i.test(c.name);
    });
    return match?.id;
}

/**
 * Real API Pricing for Runes.
 * Resolves each rune to its CoinGecko id (search results cached for a day),
 * then fetches all USD prices in a single request. Returns 0 for runes not listed on CoinGecko.
 */
export async function getRunesPrices(tickers: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    if (!Array.isArray(tickers)) return prices;
    const uniqueTickers = Array.from(new Set(
        tickers.filter((t): t is string => typeof t === 'string' && t.length > 0 && t.length <= MAX_TICKER_LENGTH)
    )).slice(0, MAX_TICKERS);

    const coinIds: Record<string, string> = {};
    for (const ticker of uniqueTickers) {
        prices[ticker] = 0;

        const known = Object.hasOwn(KNOWN_RUNES, ticker) ? KNOWN_RUNES[ticker] : undefined;
        if (known) {
            coinIds[ticker] = known;
            continue;
        }

        try {
            const searchRes = await fetch(`${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(ticker)}`, {
                next: { revalidate: 86_400 },
            });
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                const coinId = findRuneCoinId(ticker, Array.isArray(searchData.coins) ? searchData.coins : []);
                if (coinId) coinIds[ticker] = coinId;
            }
        } catch (error) {
            console.error(`Error searching CoinGecko for ${ticker}:`, error);
        }

        // Respect CoinGecko's public API rate limits (~10-30 req/min)
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // NFT-priced runes (floor price)
    for (const [ticker, coinId] of Object.entries(coinIds)) {
        if (!coinId.startsWith('nft:')) continue;
        try {
            const res = await fetch(`${COINGECKO_BASE_URL}/nfts/${encodeURIComponent(coinId.slice(4))}`, {
                next: { revalidate: 60 },
            });
            if (res.ok) {
                const data = await res.json();
                prices[ticker] = Number(data.floor_price?.usd) || 0;
            }
        } catch (error) {
            console.error(`Error fetching NFT floor price for ${ticker}:`, error);
        }
    }

    // Regular coins: one batched request
    const coinTickers = Object.entries(coinIds).filter(([, id]) => !id.startsWith('nft:'));
    if (coinTickers.length > 0) {
        const ids = Array.from(new Set(coinTickers.map(([, id]) => id)));
        try {
            const res = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=${ids.map(encodeURIComponent).join(',')}&vs_currencies=usd`, {
                next: { revalidate: 60 },
            });
            if (res.ok) {
                const data = await res.json();
                for (const [ticker, id] of coinTickers) {
                    prices[ticker] = Number(data[id]?.usd) || 0;
                }
            }
        } catch (error) {
            console.error("Error fetching runes prices:", error);
        }
    }

    return prices;
}
