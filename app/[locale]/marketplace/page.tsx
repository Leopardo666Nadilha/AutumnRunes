import React from 'react';
import { getTranslations } from 'next-intl/server';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { ConstructionNotice } from '../../../components/Market/ConstructionNotice';
import { RuneExplorer } from '../../../components/Market/RuneExplorer';
import styles from './Marketplace.module.css';

export default async function MarketplacePage() {
    const t = await getTranslations('Marketplace');

    return (
        <DashboardLayout>
            <div className={`${styles.page} animate-fade-in`}>
                <div className={styles.intro}>
                    <h2 className="heading-2">{t('title')}</h2>
                    <p className="text-body">{t('subtitle')}</p>
                </div>

                <ConstructionNotice title={t('construction_badge')} text={t('construction_desc')} />

                <RuneExplorer />
            </div>
        </DashboardLayout>
    );
}
