"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickData, IChartApi, ISeriesApi, Time, CrosshairMode, CandlestickSeries } from 'lightweight-charts';
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
    const [isMounted, setIsMounted] = useState(false);

    // Mark as mounted on client
    useEffect(() => { setIsMounted(true); }, []);

    // Initialize chart AFTER mount and container is available
    useEffect(() => {
        if (!isMounted || !chartContainerRef.current) return;

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
                    chart.resize(width, height);
                }
            }
        });
        ro.observe(container);

        return () => {
            ro.disconnect();
            chart.remove();
            chartInstanceRef.current = null;
            seriesInstanceRef.current = null;
        };
    }, [isMounted]);

    // Fetch market data (price/change)
    useEffect(() => {
        async function fetchPrice() {
            const market = await getBitcoinMarketData();
            if (market) {
                setBtcPrice(market.usd);
                setBtcChange(market.usd_24h_change);
            }
        }
        fetchPrice();
    }, []);

    // Fetch OHLC data when interval changes
    const fetchOHLC = useCallback(async (days: number) => {
        setIsLoading(true);
        setHoveredOHLC(null);
        try {
            const raw = await getBitcoinOHLC(days);
            if (raw && raw.length > 0 && seriesInstanceRef.current && chartInstanceRef.current) {
                const candles: CandlestickData<Time>[] = raw.map((item: number[]) => ({
                    time: (Math.floor(item[0] / 1000)) as Time,
                    open: item[1],
                    high: item[2],
                    low: item[3],
                    close: item[4],
                }));
                seriesInstanceRef.current.setData(candles);
                chartInstanceRef.current.timeScale().fitContent();
            }
        } catch (err) {
            console.error('[BitcoinCandleChart] fetchOHLC error:', err);
        }
        setIsLoading(false);
    }, []);

    // Trigger OHLC fetch after chart is initialized
    useEffect(() => {
        if (!isMounted) return;
        // Wait for chart to be initialized
        const timer = setTimeout(() => fetchOHLC(selectedInterval), 200);
        return () => clearTimeout(timer);
    }, [selectedInterval, fetchOHLC, isMounted]);

    const handleIntervalChange = (days: number) => {
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
                            <span className={`${styles.priceChange} ${(btcChange ?? 0) >= 0 ? styles.changePositive : styles.changeNegative}`}>
                                {(btcChange ?? 0) >= 0 ? '+' : ''}{btcChange?.toFixed(2)}%
                            </span>
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
                <div ref={chartContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            </div>
        </div>
    );
};
