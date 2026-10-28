"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Plus, ArrowUpRight, Copy, CheckCircle2, LogOut } from 'lucide-react';
import styles from './WalletCard.module.css';
import { Link } from '@/i18n/routing';
import { useWallet } from './WalletContext';
import { Skeleton } from './Skeleton';
import type { PortfolioData } from './usePortfolioData';

const formatUsd = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const WalletCard: React.FC<{ data: PortfolioData }> = ({ data }) => {
    const t = useTranslations('Dashboard');
    const { address, shortenedAddress, clearAddress } = useWallet();
    const [copied, setCopied] = useState(false);

    const { btcBalance, btcPrice, runes, isLoadingBalance, isLoadingPrices } = data;
    const btcValueUsd = (btcBalance ?? 0) * (btcPrice ?? 0);
    const runesValueUsd = runes.reduce((sum, rune) => sum + (rune.valueUsd ?? 0), 0);

    const handleCopy = async () => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be unavailable (insecure context / permission denied)
        }
    };

    return (
        <div className={styles.walletCard}>
            <div className={styles.cardHeader}>
                <div className={styles.balanceLabel}>
                    <span>{t('total_balance')}</span>
                    <Eye size={16} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        className="badge badge-orange"
                        onClick={handleCopy}
                        title={t('copy_address')}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', font: 'inherit' }}
                    >
                        {shortenedAddress}
                        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                        type="button"
                        onClick={clearAddress}
                        className={styles.disconnectBtn}
                        title={t('disconnect')}
                        aria-label={t('disconnect')}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <div>
                <h2 className={`${styles.balanceAmount} ${styles.animatePulseGlow}`}>
                    {isLoadingBalance || isLoadingPrices
                        ? <Skeleton width="250px" height="4rem" />
                        : formatUsd(btcValueUsd + runesValueUsd)}
                </h2>
            </div>

            <div className={styles.balanceSplit}>
                <div className={styles.splitItem}>
                    <span className={styles.splitLabel}>{t('bitcoin')}</span>
                    <span className={styles.splitValue}>
                        {isLoadingBalance
                            ? <Skeleton width="100px" height="1.5rem" />
                            : `${(btcBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC`}
                    </span>
                </div>
                <div className={styles.splitItem}>
                    <span className={styles.splitLabel}>{t('runes')}</span>
                    <span className={styles.splitValue}>
                        {isLoadingBalance || isLoadingPrices
                            ? <Skeleton width="100px" height="1.5rem" />
                            : formatUsd(runesValueUsd)}
                    </span>
                </div>
            </div>

            <div className={styles.actions}>
                <Link href="/marketplace" className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                    <Plus size={18} />
                    <span>{t('btn_receive')}</span>
                </Link>
                <Link href="/marketplace" className={`${styles.actionBtn} ${styles.secondaryBtn}`}>
                    <ArrowUpRight size={18} />
                    <span>{t('btn_send')}</span>
                </Link>
            </div>
        </div>
    );
};
