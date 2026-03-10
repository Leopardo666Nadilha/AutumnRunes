'use server';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

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
            `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`,
            { next: { revalidate: 120 } }
        );
        if (!res.ok) return null;
        const data = await res.json();

        // Binance returns: [ [ Open time, Open, High, Low, Close, Volume, Close time, ... ], ... ]
        // Map to: [[timestamp, open, high, low, close], ...]
        return data.map((candle: any[]) => [
            candle[0],
            parseFloat(candle[1]),
            parseFloat(candle[2]),
            parseFloat(candle[3]),
            parseFloat(candle[4])
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

/**
 * Real API Pricing for Runes.
 * Uses CoinGecko to search for the token by ticker, gets its specific CoinGecko ID,
 * and then queries the actual USD price. Returns 0 for tokens not listed on CoinGecko.
 */
export async function getRunesPrices(tickers: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const uniqueTickers = Array.from(new Set(tickers));

    // Hardcode known top runes/NFTs that might fail the search or be indexed differently
    const KNOWN_RUNES: Record<string, string> = {
        'DOG•GO•TO•THE•MOON': 'dog-go-to-the-moon-rune',
        'DOG': 'dog-go-to-the-moon-rune',
        'RSIC•GENESIS•RUNE': 'rsic-genesis-rune',
        'PUPS•WORLD•PEACE': 'pups-world-peace',
        'BZRK•BITCOIN•MEME': 'bzrk-bitcoin-meme',
        'Z•Z•Z•Z•Z•FEHU•Z•Z•Z•Z•Z': 'fehu-2',
        'RUNESTONE': 'nft:runestone' // Prefix 'nft:' to signal it uses the NFT endpoint
    };

    for (const ticker of uniqueTickers) {
        if (prices[ticker]) continue;

        try {
            let coinId = KNOWN_RUNES[ticker] || KNOWN_RUNES[ticker.toUpperCase()];

            // If not a known rune, try to search for it
            if (!coinId) {
                const searchRes = await fetch(`${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(ticker)}`);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    const coin = searchData.coins?.find((c: any) =>
                        c.symbol.toLowerCase() === ticker.toLowerCase() ||
                        c.name.toLowerCase() === ticker.toLowerCase() ||
                        c.id.toLowerCase().includes(ticker.toLowerCase().replace(/•/g, '-'))
                    );
                    if (coin && coin.id) {
                        coinId = coin.id;
                    }
                }
            }

            if (coinId) {
                if (coinId.startsWith('nft:')) {
                    // Fetch NFT floor price
                    const nftId = coinId.replace('nft:', '');
                    const priceRes = await fetch(`${COINGECKO_BASE_URL}/nfts/${nftId}`);
                    if (priceRes.ok) {
                        const priceData = await priceRes.json();
                        prices[ticker] = priceData.floor_price?.usd || 0;
                    } else {
                        prices[ticker] = 0;
                    }
                } else {
                    // Fetch Coin USD price
                    const priceRes = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd`);
                    if (priceRes.ok) {
                        const priceData = await priceRes.json();
                        prices[ticker] = priceData[coinId]?.usd || 0;
                    } else {
                        prices[ticker] = 0;
                    }
                }
            } else {
                prices[ticker] = 0; // Not found
            }
        } catch (error) {
            console.error(`Error fetching real API price for ${ticker}:`, error);
            prices[ticker] = 0;
        }

        // Add a delay to respect CoinGecko's public API rate limits (~10-30 req/min)
        if (uniqueTickers.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    return prices;
}