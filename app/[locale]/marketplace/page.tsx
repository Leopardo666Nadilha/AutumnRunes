import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Construction, ArrowLeftRight } from 'lucide-react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Link } from '@/i18n/routing';
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
                            <Construction size={16} />
                            {t('construction_badge')}
                        </div>

                        <h1 className={styles.title}>{t('title')}</h1>

                        <p className={styles.subtitle}>
                            {t('subtitle')}
                            <br /><br />
                            {t('construction_desc')}
                        </p>

                        <Link href="/portfolio" className={styles.primaryBtn}>
                            {t('back_to_portfolio')}
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
