"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Database, BarChart3, Loader2 } from 'lucide-react';
import styles from './MarketStats.module.css';
import { getRunesInfoList } from '../../lib/unisatApi';

export const MarketStats: React.FC = () => {
    const t = useTranslations('Market');
    const [totalRunes, setTotalRunes] = useState<number | null>(null);
    const [totalMints, setTotalMints] = useState<number | null>(null);
    const [totalHolders, setTotalHolders] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchStats() {
            const data = await getRunesInfoList(0, 5);
            if (cancelled) return;
            if (data) {
                setTotalRunes(data.total ?? null);
                // Sum up mints and holders from the top 5 runes as representative metrics
                if (data.detail && data.detail.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mints = data.detail.reduce((acc: number, r: any) => acc + (parseInt(r.mints, 10) || 0), 0);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const holders = data.detail.reduce((acc: number, r: any) => acc + (Number(r.holders) || 0), 0);
                    setTotalMints(mints);
                    setTotalHolders(holders);
                }
            }
            setIsLoading(false);
        }
        fetchStats();
        return () => { cancelled = true; };
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
                    <span className={styles.label}>{t('runes_etched')}</span>
                    <span className={styles.value}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatCount(totalRunes)}
                    </span>
                    <span className={styles.trend}>
                        {t('runes_etched_hint')}
                    </span>
                </div>
            </div>

            <div className={`${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                <div className={styles.iconWrapper}>
                    <BarChart3 size={24} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>{t('total_mints')}</span>
                    <span className={styles.value}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatCount(totalMints)}
                    </span>
                    <span className={styles.trend}>
                        {t('top5_hint')}
                    </span>
                </div>
            </div>

            <div className={`${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
                <div className={styles.iconWrapper}>
                    <Users size={24} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>{t('total_holders')}</span>
                    <span className={styles.value}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatCount(totalHolders)}
                    </span>
                    <span className={styles.trend}>
                        {t('top5_hint')}
                    </span>
                </div>
            </div>

        </div>
    );
};
