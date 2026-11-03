"use client";

import { useEffect, useMemo, useState } from 'react';
import { getBitcoinOHLC } from '../../lib/marketApi';

// The BTC chart's "1Y" range uses daily candles; its first page holds 1000 days,
// which reaches back past the first runes (April 2024)
const DAILY_RANGE_DAYS = 365;

export interface BtcDailyPrices {
    status: 'loading' | 'ready' | 'error';
    /** BTC/USD close of the day containing `timeMs`, or null if that day is not covered */
    usdAt: ((timeMs: number) => number | null) | null;
}

/** Daily BTC/USD history, used to convert sat prices at the time each sale happened. */
export function useBtcDailyPrices(): BtcDailyPrices {
    const [candles, setCandles] = useState<number[][] | null>(null);
    const [status, setStatus] = useState<BtcDailyPrices['status']>('loading');

    useEffect(() => {
        let cancelled = false;
        getBitcoinOHLC(DAILY_RANGE_DAYS)
            .catch(() => null)
            .then((raw) => {
                if (cancelled) return;
                if (raw && raw.length > 0) {
                    setCandles(raw);
                    setStatus('ready');
                } else {
                    setStatus('error');
                }
            });
        return () => { cancelled = true; };
    }, []);

    const usdAt = useMemo(() => {
        if (!candles) return null;
        // [openTimeMs, open, high, low, close], oldest first
        const times = candles.map((c) => c[0]);
        const closes = candles.map((c) => c[4]);
        return (timeMs: number) => {
            if (timeMs < times[0]) return null;
            // Last candle that opened at or before timeMs
            let lo = 0;
            let hi = times.length - 1;
            while (lo < hi) {
                const mid = (lo + hi + 1) >> 1;
                if (times[mid] <= timeMs) lo = mid;
                else hi = mid - 1;
            }
            return closes[lo];
        };
    }, [candles]);

    return { status, usdAt };
}
