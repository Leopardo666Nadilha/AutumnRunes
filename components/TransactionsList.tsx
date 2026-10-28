"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { History, ArrowDownLeft, ArrowUpRight, Gem, Loader2 } from 'lucide-react';
import styles from './TransactionsList.module.css';
import { getAddressTransactions, type AddressTransaction } from '../lib/mempoolApi';
import { Link } from '@/i18n/routing';
import { useWallet } from './WalletContext';

interface TransactionsListProps {
    limit?: number;
    showViewAll?: boolean;
}

const formatBtc = (sats: number) =>
    (sats / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 8 });

export const TransactionsList: React.FC<TransactionsListProps> = ({ limit = 5, showViewAll = true }) => {
    const t = useTranslations('Transactions');
    const { address, isConnected } = useWallet();
    const [txList, setTxList] = useState<AddressTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!isConnected || !address) return;

        let cancelled = false;
        async function fetchHistory() {
            setIsLoading(true);
            setHasError(false);
            const data = await getAddressTransactions(address, limit);
            if (cancelled) return;
            setTxList(data ?? []);
            setHasError(data === null);
            setIsLoading(false);
        }

        fetchHistory();
        return () => { cancelled = true; };
    }, [address, isConnected, limit]);

    const getIcon = (tx: AddressTransaction) => {
        if (tx.hasRunestone) return <Gem size={18} />;
        return tx.netSats >= 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />;
    };

    const getIconWrapperClass = (tx: AddressTransaction) => {
        if (tx.hasRunestone) return styles.iconEtch;
        return tx.netSats >= 0 ? styles.iconMint : styles.iconTransfer;
    };

    const getLabel = (tx: AddressTransaction) => {
        if (tx.hasRunestone) return t('type_runes');
        return tx.netSats >= 0 ? t('type_received') : t('type_sent');
    };

    const visibleTx = isConnected ? txList : [];

    return (
        <div className={styles.txCard}>
            <div className={styles.txHeader}>
                <div className={styles.title}>
                    <History size={20} className="text-accent" />
                    <span>{t('recent_activity')}</span>
                    {isLoading && <Loader2 size={16} className="text-muted animate-spin" />}
                </div>
                {showViewAll && <Link href="/history" className={styles.viewAll}>{t('view_all')}</Link>}
            </div>

            <div className={styles.txList}>
                {visibleTx.map((tx, i) => (
                    <a
                        key={tx.txid}
                        href={`https://mempool.space/tx/${encodeURIComponent(tx.txid)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.txItem} animate-fade-in`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                        title={tx.txid}
                    >
                        <div className={styles.txInfo}>
                            <div className={`${styles.txIconWrapper} ${getIconWrapperClass(tx)}`}>
                                {getIcon(tx)}
                            </div>
                            <div className={styles.txDetails}>
                                <span className={styles.txType}>{getLabel(tx)}</span>
                                <span className={styles.txTime}>
                                    {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : t('pending')}
                                </span>
                            </div>
                        </div>

                        <div className={styles.txAmount}>
                            <span className={`${styles.amount} ${tx.netSats > 0 ? styles.amountPositive : tx.netSats < 0 ? styles.amountNegative : ''}`}>
                                {tx.netSats > 0 ? '+' : ''}{formatBtc(tx.netSats)} BTC
                            </span>
                            <span className={styles.asset}>
                                {`${tx.txid.substring(0, 6)}...${tx.txid.substring(tx.txid.length - 4)}`}
                            </span>
                        </div>
                    </a>
                ))}
                {isConnected && !isLoading && visibleTx.length === 0 && (
                    <p className={styles.emptyState}>{hasError ? t('load_error') : t('no_history')}</p>
                )}
            </div>
        </div>
    );
};
