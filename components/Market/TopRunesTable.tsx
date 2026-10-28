"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from '../RunesTable.module.css';
import { getRunesInfoList } from '../../lib/unisatApi';

interface RuneDetail {
    runeid: string;
    spacedRune: string;
    symbol: string;
    holders: number;
    transactions: number;
    mints: string;
    supply: string;
}

export const TopRunesTable: React.FC = () => {
    const t = useTranslations('Market');
    const [runesList, setRunesList] = useState<RuneDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getRunesInfoList(0, 10).then((data) => {
            if (cancelled) return;
            if (data && Array.isArray(data.detail)) {
                setRunesList(data.detail);
            }
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableHeader} style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <div className={styles.title}>
                    <Trophy size={20} className="text-accent" />
                    <span>{t('top_runes')}</span>
                    {isLoading && <Loader2 size={16} className="text-muted animate-spin" />}
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>#</th>
                            <th className={styles.th}>{t('col_rune')}</th>
                            <th className={styles.th}>{t('col_holders')}</th>
                            <th className={styles.th}>{t('col_transactions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isLoading && runesList.length === 0 && (
                            <tr>
                                <td colSpan={4} className={styles.td} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    {t('no_runes_data')}
                                </td>
                            </tr>
                        )}
                        {runesList.map((rune, i) => (
                            <tr
                                key={rune.runeid}
                                className={`${styles.tr} animate-fade-in`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <td className={styles.td} style={{ color: 'var(--text-muted)', width: '2rem' }}>
                                    {i + 1}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.assetCell}>
                                        <div className={styles.assetIcon} style={{ background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.2)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                                            {rune.symbol || (rune.spacedRune ? Array.from(rune.spacedRune)[0] : '✦')}
                                        </div>
                                        <div className={styles.assetName}>
                                            <span className={styles.name}>{rune.spacedRune}</span>
                                            <span className={styles.ticker}>ID: {rune.runeid}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {rune.holders?.toLocaleString() ?? '—'}
                                    </span>
                                </td>
                                <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                                    {rune.transactions?.toLocaleString() ?? '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
