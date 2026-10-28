"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';
import styles from './MarketBanner.module.css';
import { getDogTokenMarketData } from '../../lib/marketApi';

interface DogMarketData {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
}

export const MarketBanner: React.FC = () => {
    const t = useTranslations('Market');
    const [dogData, setDogData] = useState<DogMarketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getDogTokenMarketData().then((data) => {
            if (cancelled) return;
            setDogData(data);
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const change = dogData?.usd_24h_change;

    return (
        <div className={styles.bannerContainer}>
            <div className={styles.bannerBg}></div>

            <div className={styles.content}>
                <div className={styles.highlightBadge}>
                    <Flame size={16} fill="currentColor" />
                    <span>{t('highlight_title')}</span>
                </div>

                <h2 className={styles.title}>
                    DOG•GO•TO<br />
                    <span className={styles.titleHighlight}>THE•MOON</span>
                </h2>

                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLoading ? <span>…</span> : dogData?.usd ? `$${dogData.usd.toFixed(8)}` : '—'}
                </div>

                <p className={styles.description}>
                    {t('highlight_desc')}
                </p>

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('market_cap')}</span>
                        <span className={styles.statValue}>
                            {isLoading ? <span>…</span> : dogData?.usd_market_cap ? `$${(dogData.usd_market_cap / 1000000).toFixed(2)}M` : '—'}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('volume_24h')}</span>
                        <span className={styles.statValue}>
                            {isLoading ? <span>…</span> : dogData?.usd_24h_vol ? `$${(dogData.usd_24h_vol / 1000000).toFixed(2)}M` : '—'}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('change_24h')}</span>
                        <span className={styles.statValue} style={{ color: (change ?? 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isLoading ? <span>…</span> : typeof change === 'number'
                                ? <>{change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {change >= 0 ? '+' : ''}{change.toFixed(2)}%</>
                                : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.visualSide}>
                <div className={styles.dogCircle} style={{ overflow: 'hidden' }}>
                    {/* Plain <img>: next/image would route this through the image optimizer for a single static logo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="https://coin-images.coingecko.com/coins/images/37352/large/DOGGOTOTHEMOON.png"
                        alt="DOG•GO•TO•THE•MOON"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            </div>
        </div>
    );
};
