"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, TrendingUp, Loader2 } from 'lucide-react';
import styles from './MarketBanner.module.css';
import { getDogTokenMarketData } from '../../lib/marketApi';
import { Skeleton } from '../Skeleton';

export const MarketBanner: React.FC = () => {
    const t = useTranslations('Market');
    const [dogData, setDogData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDog() {
            setIsLoading(true);
            const data = await getDogTokenMarketData();
            setDogData(data);
            setIsLoading(false);
        }
        fetchDog();
    }, []);

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
                        <span className={styles.statLabel}>Market Cap</span>
                        <span className={styles.statValue}>
                            {isLoading ? <span>…</span> : dogData?.usd_market_cap ? `$${(dogData.usd_market_cap / 1000000).toFixed(2)}M` : '—'}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h Vol</span>
                        <span className={styles.statValue}>
                            {isLoading ? <span>…</span> : dogData?.usd_24h_vol ? `$${(dogData.usd_24h_vol / 1000000).toFixed(2)}M` : '—'}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Change</span>
                        <span className={styles.statValue} style={{ color: (dogData?.usd_24h_change ?? 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isLoading ? <span>…</span> : dogData ? <><TrendingUp size={18} /> {dogData.usd_24h_change >= 0 ? '+' : ''}{dogData.usd_24h_change?.toFixed(2)}%</> : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.visualSide}>
                <div className={styles.dogCircle} style={{ overflow: 'hidden' }}>
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
