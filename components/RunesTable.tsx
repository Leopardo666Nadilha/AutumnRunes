"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Database } from 'lucide-react';
import styles from './RunesTable.module.css';
import { Skeleton } from './Skeleton';
import { formatRuneAmount } from '../lib/runes';
import type { PortfolioData } from './usePortfolioData';

export const RunesTable: React.FC<{ data: PortfolioData }> = ({ data }) => {
    const t = useTranslations('Dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const { runes, isLoadingBalance, isLoadingPrices } = data;

    const term = searchTerm.trim().toLowerCase();
    const filteredRunes = runes.filter(
        rune => rune.name.toLowerCase().includes(term) || rune.symbol.toLowerCase().includes(term)
    );

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
                <div className={styles.title}>
                    <Database size={20} className="text-accent" />
                    <span>{t('my_assets')}</span>
                </div>
                <div className={styles.searchContainer}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>{t('col_asset')}</th>
                            <th className={styles.th}>{t('col_balance')}</th>
                            <th className={styles.th}>{t('col_price')}</th>
                            <th className={`${styles.th} ${styles.valueCell}`}>{t('col_value')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingBalance ? (
                            Array.from({ length: 3 }, (_, i) => (
                                <tr key={`skeleton-${i}`} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
                                            <div>
                                                <Skeleton width="6rem" height="1.2rem" />
                                                <Skeleton width="3rem" height="0.8rem" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}><Skeleton width="4rem" /></td>
                                    <td className={styles.td}><Skeleton width="4rem" /></td>
                                    <td className={styles.td}><Skeleton width="5rem" /></td>
                                </tr>
                            ))
                        ) : filteredRunes.map((rune, i) => (
                            <tr
                                key={rune.id}
                                className={`${styles.tr} animate-fade-in`}
                                style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
                            >
                                <td className={styles.td}>
                                    <div className={styles.assetCell}>
                                        <div className={styles.assetIcon}>
                                            {Array.from(rune.symbol)[0]}
                                        </div>
                                        <div className={styles.assetName}>
                                            <span className={styles.name}>{rune.name}</span>
                                            <span className={styles.ticker}>{rune.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>{formatRuneAmount(rune.balance, rune.divisibility)}</td>
                                <td className={styles.td}>
                                    {rune.priceUsd === null
                                        ? (isLoadingPrices ? <Skeleton width="4rem" /> : '—')
                                        : rune.priceUsd > 0 ? `$${rune.priceUsd.toLocaleString(undefined, { maximumSignificantDigits: 4 })}` : '—'}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.valueCell}>
                                        <span className={styles.name}>
                                            {rune.valueUsd === null
                                                ? (isLoadingPrices ? <Skeleton width="4rem" /> : '—')
                                                : `$${rune.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRunes.length === 0 && !isLoadingBalance && (
                    <div className="flex-col items-center justify-center gap-sm" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                        <Database size={48} opacity={0.2} />
                        <p>{term ? t('no_runes_match', { term: searchTerm.trim() }) : t('no_runes')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
