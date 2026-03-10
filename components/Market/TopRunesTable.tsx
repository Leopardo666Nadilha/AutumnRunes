"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Loader2, TrendingUp } from 'lucide-react';
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
    const [runesList, setRunesList] = useState<RuneDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRunes() {
            setIsLoading(true);
            const data = await getRunesInfoList(0, 10);
            if (data && data.detail) {
                setRunesList(data.detail);
            }
            setIsLoading(false);
        }
        fetchRunes();
    }, []);

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableHeader} style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <div className={styles.title}>
                    <Trophy size={20} className="text-accent" />
                    <span>Top Runes by Holders</span>
                    {isLoading && <Loader2 size={16} className="text-muted animate-spin" />}
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>#</th>
                            <th className={styles.th}>Rune</th>
                            <th className={styles.th}>Holders</th>
                            <th className={styles.th}>Transactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isLoading && runesList.length === 0 && (
                            <tr>
                                <td colSpan={4} className={styles.td} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    No runes data available. Check your API key.
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
                                            {rune.symbol || rune.spacedRune?.charAt(0) || '✦'}
                                        </div>
                                        <div className={styles.assetName}>
                                            <span className={styles.name}>{rune.spacedRune}</span>
                                            <span className={styles.ticker}>ID: {rune.runeid}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                        <TrendingUp size={14} style={{ color: 'var(--status-success)' }} />
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
