import React from 'react';
import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Wallet, ArrowLeftRight } from 'lucide-react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import styles from './Marketplace.module.css';

export default async function MarketplacePage() {
    const t = await getTranslations('Marketplace');

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
                <div className={styles.marketplaceContainer}>
                    <div className={styles.glowPattern}></div>

                    <div className={styles.content}>
                        <div className={styles.iconWrapper}>
                            <ArrowLeftRight size={40} />
                        </div>

                        <div className={styles.badge}>
                            <ShieldCheck size={16} />
                            {t('beta_alert')}
                        </div>

                        <h1 className={styles.title}>{t('title')}</h1>

                        <p className={styles.subtitle}>
                            {t('subtitle')}
                            <br /><br />
                            {t('beta_desc')}
                        </p>

                        <button className={styles.primaryBtn}>
                            <Wallet size={20} />
                            Connect Wallet
                        </button>
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {t('connect_prompt')}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
