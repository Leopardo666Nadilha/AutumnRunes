"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Database, Loader2 } from 'lucide-react';
import styles from './RunesTable.module.css';
import { getRunesBalanceList } from '../lib/unisatApi';
import { useWallet } from './WalletContext';
import { Skeleton } from './Skeleton';
import { formatRuneAmount, toRuneAmount } from '../lib/runes';

export interface RuneToken {
    id: string;
    name: string;
    ticker: string;
    balance: number;
    divisibility: number;
    valueUsd: number;
    priceUsd: number;
    change24h: number | null;
}

export const RunesTable: React.FC = () => {
    const t = useTranslations('Dashboard');
    const { address, isConnected } = useWallet();
    const [searchTerm, setSearchTerm] = useState('');
    const [runesList, setRunesList] = useState<RuneToken[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!isConnected || !address) {
                setRunesList([]);
                return;
            }
            setIsLoading(true);
            const apiData = await getRunesBalanceList(address);

            if (apiData && apiData.detail && apiData.detail.length > 0) {
                // Map UniSat OpenAPI structure to our UI structure
                let mappedRunes = apiData.detail.map((item: any, index: number) => ({
                    id: item.runeid || String(index),
                    name: item.spacedRune || item.rune,
                    ticker: item.symbol || item.rune.substring(0, 4),
                    balance: toRuneAmount(item.amount, item.divisibility),
                    divisibility: item.divisibility ?? 0,
                    valueUsd: 0,
                    priceUsd: 0,
                    change24h: null, // No 24h price history source yet
                }));

                // Fetch live prices for the tickers from CoinGecko API
                const tickers = mappedRunes.map((r: any) => r.name);
                const { getRunesPrices } = await import('../lib/marketApi');
                const pricesMap = await getRunesPrices(tickers);

                mappedRunes = mappedRunes.map((rune: any) => {
                    const price = pricesMap[rune.name] || 0;
                    return {
                        ...rune,
                        priceUsd: price,
                        valueUsd: rune.balance * price
                    };
                });

                setRunesList(mappedRunes);
            } else {
                // Fallback to empty
                setRunesList([]);
            }
            setIsLoading(false);
        }

        fetchData();
    }, [address, isConnected]);

    const filteredRunes = runesList.filter(
        rune =>
            rune.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rune.ticker.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <th className={styles.th}>Asset</th>
                            <th className={styles.th}>Balance</th>
                            <th className={styles.th}>Price</th>
                            <th className={`${styles.th} ${styles.valueCell}`}>Value / 24h</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
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
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                            <Skeleton width="5rem" />
                                            <Skeleton width="3rem" height="0.8rem" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : filteredRunes.map((rune, i) => (
                            <tr
                                key={rune.id}
                                className={`${styles.tr} animate-fade-in`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <td className={styles.td}>
                                    <div className={styles.assetCell}>
                                        <div className={styles.assetIcon}>
                                            {Array.from(rune.ticker)[0]}
                                        </div>
                                        <div className={styles.assetName}>
                                            <span className={styles.name}>{rune.name}</span>
                                            <span className={styles.ticker}>{rune.ticker}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>{formatRuneAmount(rune.balance, rune.divisibility)}</td>
                                <td className={styles.td}>${rune.priceUsd.toFixed(4)}</td>
                                <td className={styles.td}>
                                    <div className={styles.valueCell}>
                                        <span className={styles.name}>${rune.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        {rune.change24h !== null && (
                                            <span className={rune.change24h >= 0 ? styles.changePositive : styles.changeNegative}>
                                                {rune.change24h >= 0 ? '+' : ''}{rune.change24h.toFixed(2)}%
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRunes.length === 0 && !isLoading && (
                    <div className="flex-col items-center justify-center gap-sm" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                        <Database size={48} opacity={0.2} />
                        <p>{searchTerm ? `No Runes found matching "${searchTerm}"` : 'No Runes found for this address.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
