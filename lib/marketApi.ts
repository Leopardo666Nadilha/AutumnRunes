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

export async function getBitcoinOHLC(days: number = 7): Promise<number[][] | null> {
    days = clampInt(days, 1, 365, 7);
    try {
        let interval = '1d';
        let limit = 100;

        if (days === 1) {
            interval = '15m';
            limit = 96;
        } else if (days === 7) {
            interval = '1h';
            limit = 168;
        } else if (days === 30) {
            interval = '4h';
            limit = 180;
        } else if (days === 90) {
            interval = '1d';
            limit = 90;
        } else if (days === 180) {
            interval = '1d';
            limit = 180;
        } else if (days === 365) {
            interval = '1d';
            limit = 365;
        }

        const res = await fetch(
            `https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`,
            { next: { revalidate: 120 } }
        );
        if (!res.ok) return null;
        const data = await res.json();

        // Binance returns: [ [ Open time, Open, High, Low, Close, Volume, Close time, ... ], ... ]
        // Map to: [[timestamp, open, high, low, close], ...]
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
