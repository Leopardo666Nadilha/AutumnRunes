"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
    address: string;
    setAddress: (address: string) => void;
    shortenedAddress: string;
    isConnected: boolean;
    clearAddress: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddressState] = useState<string>('');

    // Load from localStorage on mount
    useEffect(() => {
        const savedAddress = localStorage.getItem('unisat_dashboard_address');
        if (savedAddress) {
            setAddressState(savedAddress);
        }
    }, []);

    const setAddress = (newAddress: string) => {
        setAddressState(newAddress);
        if (newAddress) {
            localStorage.setItem('unisat_dashboard_address', newAddress);
        } else {
            localStorage.removeItem('unisat_dashboard_address');
        }
    };

    const clearAddress = () => {
        setAddress('');
    };

    const shortenedAddress = address.length > 12
        ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        : address;

    const isConnected = address.length > 0;

    return (
        <WalletContext.Provider value={{
            address,
            setAddress,
            shortenedAddress,
            isConnected,
            clearAddress
        }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
