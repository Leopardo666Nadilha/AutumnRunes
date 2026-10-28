"use client";

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore, ReactNode } from 'react';
import { isValidBitcoinAddress } from '../lib/validation';

interface WalletContextType {
    address: string;
    setAddress: (address: string) => void;
    shortenedAddress: string;
    isConnected: boolean;
    clearAddress: () => void;
}

const STORAGE_KEY = 'unisat_dashboard_address';
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Tiny external store over localStorage so every tab/component stays in sync
// without a setState-in-effect round trip after hydration.
const listeners = new Set<() => void>();

function readStoredAddress(): string {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return isValidBitcoinAddress(saved) ? saved : '';
    } catch {
        return '';
    }
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) listener(); };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

function writeStoredAddress(address: string) {
    try {
        if (address) localStorage.setItem(STORAGE_KEY, address);
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage unavailable (private mode / blocked): the address just won't persist
    }
    listeners.forEach((l) => l());
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const address = useSyncExternalStore(subscribe, readStoredAddress, () => '');

    const setAddress = useCallback((newAddress: string) => {
        writeStoredAddress(isValidBitcoinAddress(newAddress) ? newAddress : '');
    }, []);

    const clearAddress = useCallback(() => writeStoredAddress(''), []);

    const value = useMemo<WalletContextType>(() => ({
        address,
        setAddress,
        shortenedAddress: address.length > 12
            ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
            : address,
        isConnected: address.length > 0,
        clearAddress,
    }), [address, setAddress, clearAddress]);

    return (
        <WalletContext.Provider value={value}>
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
