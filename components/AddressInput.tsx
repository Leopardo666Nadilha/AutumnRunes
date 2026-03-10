"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Wallet, ArrowRight } from 'lucide-react';
import { useWallet } from './WalletContext';
import styles from './AddressInput.module.css';

export const AddressInput: React.FC = () => {
    const t = useTranslations('Wallet');
    const { setAddress } = useWallet();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = inputValue.trim();
        if (!trimmed) {
            setError(t('wallet_input_empty'));
            return;
        }

        // Basic bitcoin address validation (starts with 1, 3, or bc1)
        if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]+/.test(trimmed)) {
            setError(t('wallet_input_invalid'));
            return;
        }

        setError('');
        setAddress(trimmed);
    };

    return (
        <div className={styles.inputCard}>
            <div className={styles.iconContainer}>
                <Wallet size={32} className={styles.walletIcon} />
            </div>

            <h2 className={styles.title}>{t('wallet_not_connected')}</h2>
            <p className={styles.description}>{t('wallet_input_description')}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setError('');
                        }}
                        placeholder={t('wallet_input_placeholder')}
                        className={`${styles.input} ${error ? styles.inputError : ''}`}
                    />
                </div>
                {error && <div className={styles.errorMessage}>{error}</div>}

                <button type="submit" className={styles.submitBtn}>
                    <span>{t('wallet_input_button')}</span>
                    <ArrowRight size={18} />
                </button>
            </form>
        </div>
    );
};
