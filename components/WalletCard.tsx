"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Plus, ArrowUpRight, Loader2, Copy, CheckCircle2, LogOut } from 'lucide-react';
import styles from './WalletCard.module.css';
import { getAddressBalance } from '../lib/unisatApi';
import { getBitcoinMarketData } from '../lib/marketApi';
import { useWallet } from './WalletContext';
import { Skeleton } from './Skeleton';

export const WalletCard: React.FC = () => {
    const t = useTranslations('Dashboard');
    const { address, shortenedAddress, isConnected, clearAddress } = useWallet();
    const [btcBalance, setBtcBalance] = useState<number | null>(null);
    const [runesValueUsd, setRunesValueUsd] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [btcPrice, setBtcPrice] = useState<number>(0);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ... (useEffect remains handled implicitly by replace logic start) ...


    useEffect(() => {
        async function fetchBalance() {
            if (!isConnected || !address) {
                setBtcBalance(0);
                setRunesValueUsd(0);
                return;
            }

            setIsLoading(true);

            // Fetch wallet data, market data, and runes data
            const { getRunesBalanceList } = await import('../lib/unisatApi');
            const { getRunesPrices } = await import('../lib/marketApi');

            const [balanceData, marketData, runesData] = await Promise.all([
                getAddressBalance(address),
                getBitcoinMarketData(),
                getRunesBalanceList(address)
            ]);

            if (marketData && marketData.usd) {
                setBtcPrice(marketData.usd);
            }

            if (balanceData && balanceData.satoshi !== undefined) {
                // Convert satoshis to BTC
                setBtcBalance(balanceData.satoshi / 100000000);
            } else {
                setBtcBalance(0);
            }

            // Calculate Runes total USD value
            if (runesData && runesData.detail && runesData.detail.length > 0) {
                const tickers = runesData.detail.map((r: any) => r.spacedRune || r.rune);
                const pricesMap = await getRunesPrices(tickers);

                let totalRunesUsd = 0;
                for (const rune of runesData.detail) {
                    const name = rune.spacedRune || rune.rune;
                    const amount = parseFloat(rune.amount) || 0;
                    const price = pricesMap[name] || 0;
                    totalRunesUsd += amount * price;
                }
                setRunesValueUsd(totalRunesUsd);
            } else {
                setRunesValueUsd(0);
            }

            setIsLoading(false);
        }

        fetchBalance();
    }, [address, isConnected]);

    return (
        <div className={styles.walletCard}>
            <div className={styles.cardHeader}>
                <div className={styles.balanceLabel}>
                    <span>{t('total_balance')}</span>
                    <Eye size={16} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="badge badge-orange" onClick={handleCopy} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {shortenedAddress}
                        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    </div>
                    <button
                        onClick={clearAddress}
                        className={styles.disconnectBtn}
                        title="Disconnect Wallet"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <div>
                <h2 className={`${styles.balanceAmount} ${styles.animatePulseGlow}`}>
                    {isLoading ? (
                        <Skeleton width="250px" height="4rem" />
                    ) : (
                        `$${((btcBalance ? btcBalance * btcPrice : 0) + runesValueUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                </h2>
            </div>

            <div className={styles.balanceSplit}>
                <div className={styles.splitItem}>
                    <span className={styles.splitLabel}>{t('bitcoin')}</span>
                    <span className={styles.splitValue}>
                        {isLoading ? <Skeleton width="100px" height="1.5rem" /> : `${btcBalance} BTC`}
                    </span>
                </div>
                <div className={styles.splitItem}>
                    <span className={styles.splitLabel}>{t('runes')}</span>
                    <span className={styles.splitValue}>
                        {isLoading ? <Skeleton width="100px" height="1.5rem" /> : `$${runesValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                    <Plus size={18} />
                    <span>{t('btn_receive')}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.secondaryBtn}`}>
                    <ArrowUpRight size={18} />
                    <span>{t('btn_send')}</span>
                </button>
            </div>
        </div>
    );
};
