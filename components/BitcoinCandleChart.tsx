"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickData, IChartApi, ISeriesApi, LogicalRange, Time, CrosshairMode, CandlestickSeries } from 'lightweight-charts';
import { Activity, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './BitcoinCandleChart.module.css';
import { getBitcoinOHLC, getBitcoinMarketData } from '../lib/marketApi';

interface TimeInterval {
    label: string;
    days: number;
}

const TIME_INTERVALS: TimeInterval[] = [
    { label: '1D', days: 1 },
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '180D', days: 180 },
    { label: '1Y', days: 365 },
];

interface OHLCValues {
    open: number;
    high: number;
    low: number;
    close: number;
}

// Start fetching older candles once fewer than this many bars are left before the first one
const LOAD_MORE_THRESHOLD = 50;

const toCandles = (raw: number[][]): CandlestickData<Time>[] =>
    raw.map((item) => ({
        time: (Math.floor(item[0] / 1000)) as Time,
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
    }));

export const BitcoinCandleChart: React.FC = () => {
    const t = useTranslations('Chart');
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<IChartApi | null>(null);
    const seriesInstanceRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    const [selectedInterval, setSelectedInterval] = useState<number>(7);
    const [isLoading, setIsLoading] = useState(true);
    const [btcPrice, setBtcPrice] = useState<number | null>(null);
    const [btcChange, setBtcChange] = useState<number | null>(null);
    const [hoveredOHLC, setHoveredOHLC] = useState<OHLCValues | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const requestIdRef = useRef(0);
    const selectedIntervalRef = useRef(selectedInterval);
    const candlesRef = useRef<CandlestickData<Time>[]>([]);
    const hasMoreRef = useRef(true);
    const isLoadingMoreRef = useRef(false);

    // Prepend pages of candles that end right before the oldest one loaded
    const loadOlder = useCallback(async () => {
        const series = seriesInstanceRef.current;
        const chart = chartInstanceRef.current;
        if (!series || !chart || !hasMoreRef.current || isLoadingMoreRef.current) return;

        const requestId = requestIdRef.current;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        try {
            // Zoomed out further than one page covers: keep loading until the view is filled
            while (hasMoreRef.current) {
                const first = candlesRef.current[0];
                if (!first) break;

                const raw = await getBitcoinOHLC(selectedIntervalRef.current, (first.time as number) * 1000 - 1);
                // The interval changed while this page was loading, so it belongs to another series
                if (requestId !== requestIdRef.current || !raw) break;

                const older = toCandles(raw).filter((c) => (c.time as number) < (first.time as number));
                if (older.length === 0) {
                    // Reached the start of the exchange's history: stop scrolling past the first candle
                    hasMoreRef.current = false;
                    chart.timeScale().applyOptions({ fixLeftEdge: true });
                    break;
                }

                candlesRef.current = [...older, ...candlesRef.current];
                series.setData(candlesRef.current);

                const range = chart.timeScale().getVisibleLogicalRange();
                if (!range || range.from >= LOAD_MORE_THRESHOLD) break;
            }
        } catch (err) {
            console.error('[BitcoinCandleChart] loadOlder error:', err);
        } finally {
            if (requestId === requestIdRef.current) {
                isLoadingMoreRef.current = false;
                setIsLoadingMore(false);
            }
        }
    }, []);

    // Initialize chart once the container is available (effects only run on the client)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const container = chartContainerRef.current;

        // Ensure container has real dimensions
        const rect = container.getBoundingClientRect();
        const w = Math.max(rect.width, 300);
        const h = Math.max(rect.height, 300);

        const chart = createChart(container, {
            width: w,
            height: h,
            layout: {
                background: { color: 'transparent' },
                textColor: '#94a3b8',
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: 'rgba(247, 147, 26, 0.4)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#f7931a',
                },
                horzLine: {
                    color: 'rgba(247, 147, 26, 0.4)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#f7931a',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 5,
                barSpacing: 6,
                fixLeftEdge: false,
                fixRightEdge: false,
            },
            handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
            handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#f7931a',
            downColor: '#ef4444',
            borderUpColor: '#f7931a',
            borderDownColor: '#ef4444',
            wickUpColor: '#f7931a',
            wickDownColor: '#ef4444',
        });

        chartInstanceRef.current = chart;
        seriesInstanceRef.current = series;

        // Crosshair move handler
        chart.subscribeCrosshairMove((param) => {
            if (!param.time || !param.seriesData) {
                setHoveredOHLC(null);
                return;
            }
            const data = param.seriesData.get(series) as CandlestickData<Time> | undefined;
            if (data) {
                setHoveredOHLC({
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                });
            }
        });

        // Handle resize
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    // Resizing keeps bar spacing, which would widen the visible period;
                    // keep the same time window instead (also covers the first layout)
                    const visible = chart.timeScale().getVisibleRange();
                    chart.resize(width, height);
                    if (visible) chart.timeScale().setVisibleRange(visible);
                }
            }
        });
        ro.observe(container);

        // Load older history when the user scrolls back or zooms out near the first candle
        const onVisibleRangeChange = (range: LogicalRange | null) => {
            if (range && range.from < LOAD_MORE_THRESHOLD) loadOlder();
        };
        chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);

        return () => {
            chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange);
            ro.disconnect();
            chart.remove();
            chartInstanceRef.current = null;
            seriesInstanceRef.current = null;
        };
    }, [loadOlder]);

    // Fetch market data (price/change)
    useEffect(() => {
        let cancelled = false;
        getBitcoinMarketData().then((market) => {
            if (cancelled || !market) return;
            setBtcPrice(typeof market.usd === 'number' ? market.usd : null);
            setBtcChange(typeof market.usd_24h_change === 'number' ? market.usd_24h_change : null);
        });
        return () => { cancelled = true; };
    }, []);

    // Fetch OHLC data when interval changes
    const fetchOHLC = useCallback(async (days: number) => {
        // Ignore responses from intervals the user already switched away from
        const requestId = ++requestIdRef.current;
        selectedIntervalRef.current = days;
        candlesRef.current = [];
        hasMoreRef.current = true;
        isLoadingMoreRef.current = false;
        chartInstanceRef.current?.timeScale().applyOptions({ fixLeftEdge: false });
        try {
            const raw = await getBitcoinOHLC(days);
            if (requestId !== requestIdRef.current) return;
            const chart = chartInstanceRef.current;
            if (raw && raw.length > 0 && seriesInstanceRef.current && chart) {
                const candles = toCandles(raw);
                candlesRef.current = candles;
                seriesInstanceRef.current.setData(candles);
                // The page holds more history than the selected range; show only that range
                // and leave the rest for zooming out or scrolling back
                const last = candles[candles.length - 1].time as number;
                chart.timeScale().setVisibleRange({
                    from: (last - days * 86400) as Time,
                    to: last as Time,
                });
            }
        } catch (err) {
            console.error('[BitcoinCandleChart] fetchOHLC error:', err);
        }
        if (requestId === requestIdRef.current) setIsLoading(false);
    }, []);

    // Effects run in order, so the chart above is already created here
    useEffect(() => {
        fetchOHLC(selectedInterval);
    }, [selectedInterval, fetchOHLC]);

    const handleIntervalChange = (days: number) => {
        if (days === selectedInterval) return;
        setIsLoading(true);
        setIsLoadingMore(false);
        setHoveredOHLC(null);
        setSelectedInterval(days);
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

    return (
        <div className={styles.chartCard}>
            {/* Header */}
            <div className={styles.chartHeader}>
                <div className={styles.chartTitle}>
                    <Activity size={20} />
                    <span>{t('title')}</span>
                </div>
                <div className={styles.priceInfo}>
                    {btcPrice !== null ? (
                        <>
                            <span className={styles.priceValue}>{formatPrice(btcPrice)}</span>
                            {btcChange !== null && (
                                <span className={`${styles.priceChange} ${btcChange >= 0 ? styles.changePositive : styles.changeNegative}`}>
                                    {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                                </span>
                            )}
                        </>
                    ) : (
                        <Loader2 size={20} className={styles.spinner} />
                    )}
                </div>
            </div>

            {/* OHLC Legend */}
            <div className={styles.ohlcLegend}>
                {hoveredOHLC ? (
                    <>
                        <span><span className={styles.ohlcLabel}>O </span><span className={styles.ohlcValue}>{formatPrice(hoveredOHLC.open)}</span></span>
                        <span><span className={styles.ohlcLabel}>H </span><span className={styles.ohlcValue}>{formatPrice(hoveredOHLC.high)}</span></span>
                        <span><span className={styles.ohlcLabel}>L </span><span className={styles.ohlcValue}>{formatPrice(hoveredOHLC.low)}</span></span>
                        <span><span className={styles.ohlcLabel}>C </span><span className={styles.ohlcValue}>{formatPrice(hoveredOHLC.close)}</span></span>
                    </>
                ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t('hover_hint')}</span>
                )}
            </div>

            {/* Interval Toolbar */}
            <div className={styles.toolbar}>
                {TIME_INTERVALS.map((interval) => (
                    <button
                        key={interval.days}
                        className={`${styles.intervalBtn} ${selectedInterval === interval.days ? styles.intervalBtnActive : ''}`}
                        onClick={() => handleIntervalChange(interval.days)}
                    >
                        {interval.label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className={styles.chartContainer}>
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <Loader2 size={32} className={styles.spinner} />
                    </div>
                )}
                {isLoadingMore && (
                    <div className={styles.loadingMore}>
                        <Loader2 size={14} className={styles.spinner} />
                        <span>{t('loading_history')}</span>
                    </div>
                )}
                <div ref={chartContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            </div>
        </div>
    );
};
