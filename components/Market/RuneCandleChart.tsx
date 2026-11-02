"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    createChart, CandlestickData, CandlestickSeries, CrosshairMode, HistogramData, HistogramSeries,
    IChartApi, ISeriesApi, LogicalRange, PriceScaleMode, Time,
} from 'lightweight-charts';
import { CandlestickChart, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { RuneSale } from '../../lib/unisatApi';
import { formatBtcFromSats, formatSats } from '../../lib/format';
import chartStyles from '../BitcoinCandleChart.module.css';
import styles from './RuneMarket.module.css';

const TIMEFRAMES = [
    { label: '1H', seconds: 3600 },
    { label: '4H', seconds: 4 * 3600 },
    { label: '1D', seconds: 86400 },
    { label: '1W', seconds: 7 * 86400 },
];
const WEEK_SECONDS = 7 * 86400;
// The Unix epoch was a Thursday; shift weekly buckets so they start on Monday
const WEEK_OFFSET_SECONDS = 4 * 86400;
// Start fetching older sales once fewer than this many candles are left before the first one
const LOAD_MORE_THRESHOLD = 10;
const INITIAL_VISIBLE_CANDLES = 90;
// Sales priced far from the sales around them (tiny lots worth only the UTXO's dust value,
// typos) would dwarf the real price, so candles ignore them
const OUTLIER_NEIGHBOURS = 10;
const OUTLIER_FACTOR = 5;

interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    /** Traded sats in the bucket */
    volume: number;
}

/** Drops sales more than OUTLIER_FACTOR times above or below the median of their neighbours. */
function withoutOutliers(sorted: RuneSale[]): RuneSale[] {
    if (sorted.length < 5) return sorted;
    return sorted.filter((sale, i) => {
        const prices = sorted
            .slice(Math.max(0, i - OUTLIER_NEIGHBOURS), i + OUTLIER_NEIGHBOURS + 1)
            .map((s) => s.unitPrice)
            .sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        return sale.unitPrice <= median * OUTLIER_FACTOR && sale.unitPrice >= median / OUTLIER_FACTOR;
    });
}

/** Groups sales into OHLC candles of `seconds`, using each sale's price per unit. */
function toCandles(sales: RuneSale[], seconds: number): Candle[] {
    const offset = seconds === WEEK_SECONDS ? WEEK_OFFSET_SECONDS : 0;
    const sorted = withoutOutliers([...sales].sort((a, b) => a.time - b.time));
    const candles: Candle[] = [];
    for (const sale of sorted) {
        const bucket = Math.floor((Math.floor(sale.time / 1000) - offset) / seconds) * seconds + offset;
        const last = candles[candles.length - 1];
        if (last && last.time === bucket) {
            last.high = Math.max(last.high, sale.unitPrice);
            last.low = Math.min(last.low, sale.unitPrice);
            last.close = sale.unitPrice;
            last.volume += sale.price;
        } else {
            candles.push({
                time: bucket,
                open: sale.unitPrice,
                high: sale.unitPrice,
                low: sale.unitPrice,
                close: sale.unitPrice,
                volume: sale.price,
            });
        }
    }
    return candles;
}

interface RuneCandleChartProps {
    sales: RuneSale[];
    status: 'loading' | 'ready' | 'error';
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
}

export const RuneCandleChart: React.FC<RuneCandleChartProps> = ({ sales, status, hasMore, isLoadingMore, onLoadMore }) => {
    const t = useTranslations('Marketplace');
    const tChart = useTranslations('Chart');
    const locale = useLocale();
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    // Timeframe the current view was framed for; reframe only when it changes
    const framedTimeframeRef = useRef<number | null>(null);
    const firstCandleTimeRef = useRef<number | null>(null);
    const loadMoreRef = useRef({ hasMore, isLoadingMore, onLoadMore });

    const [timeframe, setTimeframe] = useState(86400);
    const [hovered, setHovered] = useState<Candle | null>(null);

    const candles = useMemo(() => toCandles(sales, timeframe), [sales, timeframe]);

    // The chart's range listener is registered once, so it reads the latest props from a ref
    useEffect(() => {
        loadMoreRef.current = { hasMore, isLoadingMore, onLoadMore };
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const chart = createChart(container, {
            width: Math.max(rect.width, 300),
            height: Math.max(rect.height, 300),
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
                vertLine: { color: 'rgba(247, 147, 26, 0.4)', width: 1, style: 3, labelBackgroundColor: '#f7931a' },
                horzLine: { color: 'rgba(247, 147, 26, 0.4)', width: 1, style: 3, labelBackgroundColor: '#f7931a' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                scaleMargins: { top: 0.1, bottom: 0.25 },
                // Rune prices swing by orders of magnitude and single sales can be far off;
                // a log scale keeps them readable and never shows negative prices
                mode: PriceScaleMode.Logarithmic,
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 3,
                barSpacing: 8,
            },
            handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
            handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#f7931a',
            downColor: '#ef4444',
            borderUpColor: '#f7931a',
            borderDownColor: '#ef4444',
            wickUpColor: '#f7931a',
            wickDownColor: '#ef4444',
            // Prices range from fractions of a sat to thousands of sats
            priceFormat: { type: 'custom', formatter: (price: number) => formatSats(price), minMove: 1e-8 },
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceScaleId: 'volume',
            priceFormat: { type: 'volume' },
            lastValueVisible: false,
            priceLineVisible: false,
        });
        chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        chart.subscribeCrosshairMove((param) => {
            const candle = param.time ? param.seriesData.get(candleSeries) as CandlestickData<Time> | undefined : undefined;
            if (!candle) {
                setHovered(null);
                return;
            }
            const volume = param.seriesData.get(volumeSeries) as HistogramData<Time> | undefined;
            setHovered({
                time: candle.time as number,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: (volume?.value ?? 0) * 1e8,
            });
        });

        const onVisibleRangeChange = (range: LogicalRange | null) => {
            const { hasMore, isLoadingMore, onLoadMore } = loadMoreRef.current;
            if (range && range.from < LOAD_MORE_THRESHOLD && hasMore && !isLoadingMore) onLoadMore();
        };
        chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    // Resizing keeps bar spacing, which would change the visible period; keep it instead
                    const visible = chart.timeScale().getVisibleRange();
                    chart.resize(width, height);
                    if (visible) chart.timeScale().setVisibleRange(visible);
                }
            }
        });
        ro.observe(container);

        return () => {
            chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange);
            ro.disconnect();
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, []);

    useEffect(() => {
        const chart = chartRef.current;
        const candleSeries = candleSeriesRef.current;
        const volumeSeries = volumeSeriesRef.current;
        if (!chart || !candleSeries || !volumeSeries) return;

        const reframe = candles.length > 0 && framedTimeframeRef.current !== timeframe;
        const previousRange = chart.timeScale().getVisibleLogicalRange();
        const previousFirstTime = firstCandleTimeRef.current;
        firstCandleTimeRef.current = candles[0]?.time ?? null;

        candleSeries.setData(candles.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        })));
        volumeSeries.setData(candles.map((c) => ({
            time: c.time as Time,
            value: c.volume / 1e8,
            color: c.close >= c.open ? 'rgba(247, 147, 26, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        })));

        if (reframe) {
            framedTimeframeRef.current = timeframe;
            if (candles.length > INITIAL_VISIBLE_CANDLES) {
                chart.timeScale().setVisibleLogicalRange({
                    from: candles.length - INITIAL_VISIBLE_CANDLES,
                    to: candles.length + 2,
                });
            } else {
                chart.timeScale().fitContent();
            }
        } else if (previousRange && previousFirstTime !== null) {
            // Older candles were prepended: logical indexes shift by the number added, so shift
            // the view with them to keep showing the same period
            const added = candles.findIndex((c) => c.time >= previousFirstTime);
            if (added > 0) {
                chart.timeScale().setVisibleLogicalRange({
                    from: previousRange.from + added,
                    to: previousRange.to + added,
                });
            }
        }
    }, [candles, timeframe]);

    // Axis dates follow the app language instead of the browser's
    useEffect(() => {
        chartRef.current?.applyOptions({ localization: { locale } });
    }, [locale]);

    // Once the whole history is loaded, stop scrolling past the first candle
    useEffect(() => {
        chartRef.current?.timeScale().applyOptions({ fixLeftEdge: status === 'ready' && !hasMore });
    }, [status, hasMore]);

    const handleTimeframeChange = (seconds: number) => {
        if (seconds === timeframe) return;
        setHovered(null);
        setTimeframe(seconds);
    };

    const message = status === 'error'
        ? t('load_error')
        : status === 'ready' && sales.length === 0 ? t('chart_empty') : null;

    return (
        <section className={chartStyles.chartCard}>
            <div className={chartStyles.chartHeader}>
                <div className={styles.chartHeading}>
                    <div className={chartStyles.chartTitle}>
                        <CandlestickChart size={20} />
                        <span>{t('chart_title')}</span>
                    </div>
                    <span className={styles.chartSource}>{t('chart_source')}</span>
                </div>
                <div className={chartStyles.toolbar}>
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.seconds}
                            type="button"
                            className={`${chartStyles.intervalBtn} ${timeframe === tf.seconds ? chartStyles.intervalBtnActive : ''}`}
                            onClick={() => handleTimeframeChange(tf.seconds)}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={chartStyles.ohlcLegend}>
                {hovered ? (
                    <>
                        <span><span className={chartStyles.ohlcLabel}>O </span><span className={chartStyles.ohlcValue}>{formatSats(hovered.open)}</span></span>
                        <span><span className={chartStyles.ohlcLabel}>H </span><span className={chartStyles.ohlcValue}>{formatSats(hovered.high)}</span></span>
                        <span><span className={chartStyles.ohlcLabel}>L </span><span className={chartStyles.ohlcValue}>{formatSats(hovered.low)}</span></span>
                        <span><span className={chartStyles.ohlcLabel}>C </span><span className={chartStyles.ohlcValue}>{formatSats(hovered.close)}</span></span>
                        <span><span className={chartStyles.ohlcLabel}>Vol </span><span className={chartStyles.ohlcValue}>{formatBtcFromSats(hovered.volume)}</span></span>
                    </>
                ) : (
                    <span className={styles.hint}>{tChart('hover_hint')}</span>
                )}
            </div>

            <div className={chartStyles.chartContainer}>
                {status === 'loading' && (
                    <div className={chartStyles.loadingOverlay}>
                        <Loader2 size={32} className={chartStyles.spinner} />
                    </div>
                )}
                {message && <div className={styles.chartMessage}>{message}</div>}
                {isLoadingMore && (
                    <div className={chartStyles.loadingMore}>
                        <Loader2 size={14} className={chartStyles.spinner} />
                        <span>{tChart('loading_history')}</span>
                    </div>
                )}
                <div ref={containerRef} className={styles.chartCanvas} />
            </div>
        </section>
    );
};
