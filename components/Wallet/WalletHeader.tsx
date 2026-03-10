"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Plus, ArrowUpRight, ArrowRightLeft, CheckCircle2, LogOut } from 'lucide-react';
import styles from './WalletHeader.module.css';
import { useWallet } from '../WalletContext';

interface WalletHeaderProps {
    totalBalanceUsd: number;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({ totalBalanceUsd }) => {
    const t = useTranslations('Wallet');
    const { address, shortenedAddress, clearAddress } = useWallet();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.walletHeader}>
            <div className={styles.topSection}>
                <div>
                    <div className={styles.balanceLabel}>{t('total_value')}</div>
                    <div className={styles.balanceAmount}>
                        ${totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div
                        className={`${styles.addressBadge} ${copied ? styles.copied : ''}`}
                        onClick={handleCopy}
                        title={address}
                    >
                        <span>{address ? shortenedAddress : 'Not Connected'}</span>
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </div>

                    {address && (
                        <button
                            className={styles.actionBtn}
                            style={{ padding: '0.5rem', minWidth: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                            onClick={clearAddress}
                            title="Disconnect Wallet"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.actionRow}>
                <button className={`${styles.actionBtn} ${styles.btnPrimary}`}>
                    <Plus size={20} />
                    <span>{t('receive')}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                    <ArrowUpRight size={20} />
                    <span>{t('send')}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                    <ArrowRightLeft size={20} />
                    <span>{t('swap')}</span>
                </button>
            </div>
        </div>
    );
};
