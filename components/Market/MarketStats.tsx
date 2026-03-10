"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Database, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import styles from './MarketStats.module.css';
import { getRunesInfoList } from '../../lib/unisatApi';

export const MarketStats: React.FC = () => {
    const t = useTranslations('Market');
    const [totalRunes, setTotalRunes] = useState<number | null>(null);
    const [totalMints, setTotalMints] = useState<number | null>(null);
    const [totalHolders, setTotalHolders] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setIsLoading(true);
            const data = await getRunesInfoList(0, 5);
            if (data) {
                setTotalRunes(data.total ?? null);
                // Sum up mints and holders from the top 5 runes as representative metrics
                if (data.detail && data.detail.length > 0) {
                    const mints = data.detail.reduce((acc: number, r: any) => acc + parseInt(r.mints || '0'), 0);
                    const holders = data.detail.reduce((acc: number, r: any) => acc + (r.holders || 0), 0);
                    setTotalMints(mints);
                    setTotalHolders(holders);
                }
            }
            setIsLoading(false);
        }
        fetchStats();
    }, []);

    const formatCount = (n: number | null) => {
        if (n === null) return '—';
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return `${n.toLocaleString()}`;
    };

    return (
        <div className={styles.statsGrid}>

            <div className={`${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
                <div className={styles.iconWrapper}>
                    <Database size={24} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>{t('global_supply')}</span>
                    <span className={styles.value}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatCount(totalRunes)}
                    </span>
                    <span className={`${styles.trend} ${styles.trendPositive}`}>
                        <TrendingUp size={12} /> Runes etched
                    </span>
                </div>
            </div>

            <div className={`${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                <div className={styles.iconWrapper}>
                    <BarChart3 size={24} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>{t('global_volume')}</span>
                    <span className={styles.value}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatCount(totalMints)}
                    </span>
                    <span className={`${styles.trend} ${styles.trendPositive}`}>
                        <TrendingUp size={12} /> Total mints (Top 5)
                    </span>
                </div>
            </div>

            <div className={`${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
                <div className={styles.iconWrapper}>
                    <Activity size={24} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>{t('global_transactions')}</span>
                    <span className={styles.value}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatCount(totalHolders)}
                    </span>
                    <span className={`${styles.trend} ${styles.trendPositive}`}>
                        <TrendingUp size={12} /> Holders (Top 5)
                    </span>
                </div>
            </div>

        </div>
    );
};
