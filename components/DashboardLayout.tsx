"use client";

import React from 'react';
import { Wallet, LayoutDashboard, ArrowLeftRight, History, Hexagon, Gem } from 'lucide-react';
import { useWallet } from './WalletContext';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import styles from './DashboardLayout.module.css';
import LocaleSwitcher from './LocaleSwitcher';
import { useRouter } from '@/i18n/routing';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const WalletBadge = () => {
    const { isConnected, shortenedAddress } = useWallet();
    const router = useRouter();

    if (!isConnected) {
        return (
            <div className={styles.walletBadge} style={{ border: '1px dashed var(--border-light)', cursor: 'pointer' }} onClick={() => router.push('/portfolio')}>
                <Wallet size={16} className="text-muted" />
                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Not Connected</span>
            </div>
        );
    }

    return (
        <div className={styles.walletBadge} onClick={() => router.push('/portfolio')} title="Go to Portfolio" style={{ cursor: 'pointer' }}>
            <div className={styles.networkDot}></div>
            <span className="text-secondary">{shortenedAddress}</span>
        </div>
    );
};


export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const t = useTranslations('Dashboard');
    const pathname = usePathname();

    // Helper function to check if a navigation item is active
    const isActive = (path: string) => {
        if (path === '/' && pathname !== '/') return false;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return pathname === path;
    };

    return (
        <div className={styles.layoutContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <Hexagon className={styles.brandIcon} size={32} />
                    <span>{t('brand')}</span>
                </div>

                <nav className={styles.nav}>
                    <Link href="/" className={`${styles.navItem} ${isActive('/') ? styles.navItemActive : ''}`}>
                        <LayoutDashboard className={styles.navIcon} size={20} />
                        <span className={styles.navText}>Home</span>
                    </Link>
                    <Link href="/portfolio" className={`${styles.navItem} ${isActive('/portfolio') ? styles.navItemActive : ''}`}>
                        <Wallet className={styles.navIcon} size={20} />
                        <span className={styles.navText}>{t('nav_portfolio')}</span>
                    </Link>
                    <Link href="/marketplace" className={`${styles.navItem} ${isActive('/marketplace') ? styles.navItemActive : ''}`}>
                        <ArrowLeftRight className={styles.navIcon} size={20} />
                        <span className={styles.navText}>{t('nav_marketplace')}</span>
                    </Link>
                    <Link href="/about" className={`${styles.navItem} ${isActive('/about') ? styles.navItemActive : ''}`}>
                        <Gem className={styles.navIcon} size={20} />
                        <span className={styles.navText}>{t('nav_about')}</span>
                    </Link>
                    <Link href="/history" className={`${styles.navItem} ${isActive('/history') ? styles.navItemActive : ''}`}>
                        <History className={styles.navIcon} size={20} />
                        <span className={styles.navText}>{t('nav_history')}</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Area */}
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div>
                        <h1 className="heading-2">{t('header_title')}</h1>
                        <p className="text-body">{t('header_subtitle')}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <LocaleSwitcher />
                        <WalletBadge />
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
};