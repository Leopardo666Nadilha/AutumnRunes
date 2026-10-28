"use client";

import React from 'react';
import { useWallet } from './WalletContext';
import { AddressInput } from './AddressInput';
import { WalletCard } from './WalletCard';
import { RunesTable } from './RunesTable';
import { TransactionsList } from './TransactionsList';
import { usePortfolioData } from './usePortfolioData';
import styles from '../app/[locale]/page.module.css';

export const PortfolioContent: React.FC = () => {
    const { address, isConnected } = useWallet();
    const data = usePortfolioData(address);

    if (!isConnected) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <AddressInput />
            </div>
        );
    }

    return (
        <div className={styles.gridContainer}>
            {/* Top Row: Wallet Value */}
            <section className={`${styles.overviewSection} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                <WalletCard data={data} />
            </section>

            {/* Bottom Row: Assets Table & Transactions */}
            <section className={styles.detailsSection}>
                <div className={`${styles.mainColumn} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
                    <RunesTable data={data} />
                </div>
                <div className={`${styles.sideColumn} animate-fade-in`} style={{ animationDelay: '0.4s' }}>
                    <TransactionsList />
                </div>
            </section>
        </div>
    );
};
