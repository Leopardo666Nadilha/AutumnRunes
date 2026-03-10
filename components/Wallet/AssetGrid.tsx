"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Database, Loader2 } from 'lucide-react';
import styles from './AssetGrid.module.css';
import { getRunesBalanceList } from '../../lib/unisatApi';
import { useWallet } from '../WalletContext';

interface RuneToken {
    id: string;
    name: string;
    ticker: string;
    balance: number | string;
    valueUsd: number;
    priceUsd: number;
    change24h: number;
}

export const AssetGrid: React.FC = () => {
    const t = useTranslations('Wallet');
    const { address, isConnected } = useWallet();
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
                const mappedRunes = apiData.detail.map((item: any, index: number) => ({
                    id: item.runeid || String(index),
                    name: item.spacedRune || item.rune,
                    ticker: item.rune.substring(0, 4),
                    balance: item.amount,
                    valueUsd: 0,
                    priceUsd: 0,
                    change24h: 0,
                }));
                setRunesList(mappedRunes);
            } else {
                setRunesList([]);
            }
            setIsLoading(false);
        }

        fetchData();
    }, [address, isConnected]);

    if (isLoading) {
        return (
            <div className={styles.emptyState}>
                <Loader2 size={32} className="animate-spin text-muted" />
            </div>
        );
    }

    if (runesList.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Database size={48} opacity={0.2} />
                <p>{t('no_assets')}</p>
            </div>
        );
    }

    return (
        <div className={styles.gridContainer}>
            {runesList.map((rune, i) => (
                <div
                    key={rune.id}
                    className={`${styles.assetCard} animate-fade-in`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                >
                    <div className={styles.cardHeader}>
                        <div className={styles.icon}>{rune.ticker.charAt(0)}</div>
                        <div className={styles.nameInfo}>
                            <span className={styles.ticker}>{rune.ticker}</span>
                            <span className={styles.name}>{rune.name}</span>
                        </div>
                    </div>

                    <div className={styles.balances}>
                        <span className={styles.fiatValue}>
                            ${rune.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={styles.tokenBalance}>
                            {typeof rune.balance === 'number' ? rune.balance.toLocaleString() : rune.balance} {rune.ticker}
                        </span>
                    </div>

                    <div className={styles.footer}>
                        <span className={styles.priceLabel}>{t('unit_price')}</span>
                        <span className={styles.priceValue}>
                            ${rune.priceUsd.toFixed(4)}
                            <span style={{ color: rune.change24h >= 0 ? 'var(--status-success)' : 'var(--status-danger)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                {rune.change24h >= 0 ? '+' : ''}{rune.change24h}%
                            </span>
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
