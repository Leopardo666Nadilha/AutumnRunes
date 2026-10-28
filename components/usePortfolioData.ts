"use client";

import { useEffect, useState } from 'react';
import { getAddressBalance, getRunesBalanceList } from '../lib/unisatApi';
import { getBitcoinMarketData, getRunesPrices } from '../lib/marketApi';
import { toRuneAmount } from '../lib/runes';

export interface PortfolioRune {
    id: string;
    name: string;
    symbol: string;
    balance: number;
    divisibility: number;
    /** null while prices are loading */
    priceUsd: number | null;
    valueUsd: number | null;
}

export interface PortfolioData {
    btcBalance: number | null;
    btcPrice: number | null;
    runes: PortfolioRune[];
    isLoadingBalance: boolean;
    isLoadingPrices: boolean;
}

const EMPTY: PortfolioData = {
    btcBalance: null,
    btcPrice: null,
    runes: [],
    isLoadingBalance: false,
    isLoadingPrices: false,
};

/**
 * Loads BTC balance, Runes balances and Runes prices for an address once,
 * so the wallet card and the runes table share the same requests.
 * Balances are shown as soon as they arrive; prices (slow, rate-limited) fill in later.
 */
export function usePortfolioData(address: string): PortfolioData {
    const [data, setData] = useState<PortfolioData>(EMPTY);

    useEffect(() => {
        if (!address) return;

        let cancelled = false;
        async function load() {
            setData({ ...EMPTY, isLoadingBalance: true, isLoadingPrices: true });

            const [balanceData, marketData, runesData] = await Promise.all([
                getAddressBalance(address),
                getBitcoinMarketData(),
                getRunesBalanceList(address),
            ]);
            if (cancelled) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const runes: PortfolioRune[] = (runesData?.detail ?? []).map((item: any, index: number) => ({
                id: item.runeid || String(index),
                name: item.spacedRune || item.rune,
                symbol: item.symbol || item.rune.substring(0, 4),
                balance: toRuneAmount(item.amount, item.divisibility),
                divisibility: item.divisibility ?? 0,
                priceUsd: null,
                valueUsd: null,
            }));

            setData({
                btcBalance: typeof balanceData?.satoshi === 'number' ? balanceData.satoshi / 100_000_000 : 0,
                btcPrice: typeof marketData?.usd === 'number' ? marketData.usd : null,
                runes,
                isLoadingBalance: false,
                isLoadingPrices: runes.length > 0,
            });
            if (runes.length === 0) return;

            const prices = await getRunesPrices(runes.map((r) => r.name));
            if (cancelled) return;

            setData((prev) => ({
                ...prev,
                runes: prev.runes.map((rune) => {
                    const price = prices[rune.name] ?? 0;
                    return { ...rune, priceUsd: price, valueUsd: rune.balance * price };
                }),
                isLoadingPrices: false,
            }));
        }

        load();
        return () => { cancelled = true; };
    }, [address]);

    return address ? data : EMPTY;
}
