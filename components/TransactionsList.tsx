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

            if (apiData && apiData.list && apiData.list.length > 0) {
                // Map from UniSat API
                const mappedTx = apiData.list.map((item: any) => ({
                    id: item.txid,
                    type: item.type || 'Transfer', // UniSat event type mapped to UI
                    asset: item.rune || 'RUNE',
                    amount: item.amount || 0,
                    txid: item.txid,
                    timestamp: new Date(item.blockTime * 1000).toLocaleDateString(),
                    status: 'Confirmed'
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
                                {typeof tx.amount === 'number' && tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                            <span className={styles.asset}>{tx.asset.length > 12 ? tx.asset.substring(0, 12) + '...' : tx.asset}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
