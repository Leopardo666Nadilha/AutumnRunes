"use client";

import React from 'react';
import { useWallet } from './WalletContext';
import { AddressInput } from './AddressInput';
import { TransactionsList } from './TransactionsList';

export const HistoryContent: React.FC = () => {
    const { isConnected } = useWallet();

    if (!isConnected) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AddressInput />
            </div>
        );
    }

    return <TransactionsList limit={50} showViewAll={false} />;
};
