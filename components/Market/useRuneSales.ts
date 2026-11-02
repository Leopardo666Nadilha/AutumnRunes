"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { getRuneSales, type RuneSale } from '../../lib/unisatApi';

// After a failed page, wait before letting scroll events retry it
const RETRY_COOLDOWN_MS = 5000;

export interface RuneSalesState {
    /** Newest first */
    sales: RuneSale[];
    status: 'loading' | 'ready' | 'error';
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMore: () => void;
}

/**
 * Marketplace sales of one rune, loaded newest first and extended back in time on demand.
 * Mount it with a `key` per rune: it does not reset when `spacedRune` changes.
 */
export function useRuneSales(spacedRune: string): RuneSalesState {
    const [sales, setSales] = useState<RuneSale[]>([]);
    const [status, setStatus] = useState<RuneSalesState['status']>('loading');
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Offset into the full history, so it only moves by the raw page size UniSat returned
    const nextStartRef = useRef(0);
    const hasMoreRef = useRef(false);
    const isLoadingRef = useRef(true);
    const failedAtRef = useRef(0);
    const seenRef = useRef(new Set<string>());

    const applyPage = useCallback((page: { sales: RuneSale[]; count: number; total: number }) => {
        // New sales shift the offsets between requests, so a page can repeat a few entries
        const fresh = page.sales.filter((sale) => !seenRef.current.has(sale.id));
        fresh.forEach((sale) => seenRef.current.add(sale.id));
        nextStartRef.current += page.count;
        hasMoreRef.current = page.count > 0 && nextStartRef.current < page.total;
        setHasMore(hasMoreRef.current);
        return fresh;
    }, []);

    useEffect(() => {
        let cancelled = false;
        getRuneSales(spacedRune, 0)
            .catch(() => null)
            .then((page) => {
                if (cancelled) return;
                isLoadingRef.current = false;
                if (!page) {
                    setStatus('error');
                    return;
                }
                setSales(applyPage(page));
                setStatus('ready');
            });
        return () => { cancelled = true; };
    }, [spacedRune, applyPage]);

    const loadMore = useCallback(async () => {
        if (isLoadingRef.current || !hasMoreRef.current) return;
        if (Date.now() - failedAtRef.current < RETRY_COOLDOWN_MS) return;

        isLoadingRef.current = true;
        setIsLoadingMore(true);
        const page = await getRuneSales(spacedRune, nextStartRef.current).catch(() => null);
        isLoadingRef.current = false;
        setIsLoadingMore(false);

        if (!page) {
            failedAtRef.current = Date.now();
            return;
        }
        const fresh = applyPage(page);
        if (fresh.length > 0) setSales((prev) => [...prev, ...fresh]);
    }, [spacedRune, applyPage]);

    return { sales, status, hasMore, isLoadingMore, loadMore };
}
