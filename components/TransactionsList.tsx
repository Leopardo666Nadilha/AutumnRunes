"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { History, ArrowRightLeft, Plus, Send, Zap, Loader2 } from 'lucide-react';
import styles from './TransactionsList.module.css';
import { getAddressHistory } from '../lib/unisatApi';
import { useWallet } from './WalletContext';

interface Transaction {
    id: string;
    type: string;
    asset: string;
    amount: number | string;
    txid: string;
    timestamp: string;
    status: string;
}

export const TransactionsList: React.FC = () => {
    const t = useTranslations('Dashboard');
    const { address, isConnected } = useWallet();
    const [txList, setTxList] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchHistory() {
            if (!isConnected || !address) {
                setTxList([]);
                return;
            }
            setIsLoading(true);
            const apiData = await getAddressHistory(address);

            if (apiData && apiData.detail && apiData.detail.length > 0) {
                // UniSat /history returns plain BTC transactions: { txid, timestamp, confirmations, ... }.
                // It carries no per-address amount or rune, so only the tx itself is shown.
                const mappedTx = apiData.detail.map((item: any) => ({
                    id: item.txid,
                    type: 'Transfer',
                    asset: `${item.txid.substring(0, 6)}...${item.txid.substring(item.txid.length - 4)}`,
                    amount: '',
                    txid: item.txid,
                    timestamp: item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString() : '—',
                    status: item.confirmations > 0 ? 'Confirmed' : 'Pending'
                }));
                setTxList(mappedTx.slice(0, 5)); // Keep latest 5
            } else {
                setTxList([]);
            }
            setIsLoading(false);
        }

        fetchHistory();
    }, [address, isConnected]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'Mint': return <Plus size={18} className={styles.iconMint} />;
            case 'Transfer': return <Send size={18} className={styles.iconTransfer} />;
            case 'Trade': return <ArrowRightLeft size={18} className={styles.iconTrade} />;
            case 'Etch': return <Zap size={18} className={styles.iconEtch} />;
            default: return <History size={18} />;
        }
    };

    const getIconWrapperClass = (type: string) => {
        switch (type) {
            case 'Mint': return styles.iconMint;
            case 'Transfer': return styles.iconTransfer;
            case 'Trade': return styles.iconTrade;
            case 'Etch': return styles.iconEtch;
            default: return '';
        }
    };

    return (
        <div className={styles.txCard}>
            <div className={styles.txHeader}>
                <div className={styles.title}>
                    <History size={20} className="text-accent" />
                    <span>{t('recent_activity')}</span>
                </div>
                <a href="#" className={styles.viewAll}>{t('view_all')}</a>
            </div>

            <div className={styles.txList}>
                {txList.map((tx, i) => (
                    <div
                        key={tx.id}
                        className={`${styles.txItem} animate-fade-in`}
                        style={{ animationDelay: `${i * 0.15}s` }}
                    >
                        <div className={styles.txInfo}>
                            <div className={`${styles.txIconWrapper} ${getIconWrapperClass(tx.type)}`}>
                                {getIcon(tx.type)}
                            </div>
                            <div className={styles.txDetails}>
                                <span className={styles.txType}>{tx.type}</span>
                                <span className={styles.txTime}>{tx.timestamp}</span>
                            </div>
                        </div>

                        <div className={styles.txAmount}>
                            <span className={styles.amount}>
                                {tx.amount !== '' ? `${typeof tx.amount === 'number' && tx.amount > 0 ? '+' : ''}${tx.amount}` : tx.status}
                            </span>
                            <a
                                href={`https://mempool.space/tx/${encodeURIComponent(tx.txid)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.asset}
                            >
                                {tx.asset.length > 13 ? tx.asset.substring(0, 13) + '...' : tx.asset}
                            </a>
                        </div>
                    </div>
                ))}
                {!isLoading && txList.length === 0 && (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No transactions found for this address.</p>
                )}
            </div>
        </div>
    );
};
