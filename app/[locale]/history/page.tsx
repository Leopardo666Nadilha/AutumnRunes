import React from 'react';
import { getTranslations } from 'next-intl/server';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { TransactionsList } from '../../../components/TransactionsList';
import styles from '../page.module.css';

export default async function HistoryPage() {
    const t = await getTranslations('History');

    return (
        <DashboardLayout>
            <div className={styles.gridContainer}>
                <section className="animate-fade-in" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 className="heading-2">{t('title')}</h2>
                        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
                            {t('subtitle')}
                        </p>
                    </div>

                    <TransactionsList />

                </section>
            </div>
        </DashboardLayout>
    );
}
