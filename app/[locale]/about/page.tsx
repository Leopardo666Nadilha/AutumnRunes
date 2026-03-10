import React from 'react';
import { useTranslations } from 'next-intl';
import { Gem, Layers, Code, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import styles from './about.module.css';

export default function AboutPage() {
    const t = useTranslations('About');

    return (
        <DashboardLayout>
            <div className={styles.container}>

                {/* Hero Section */}
                <section className={`${styles.hero} animate-fade-in`}>
                    <div className={styles.heroIcon}>
                        <Gem size={72} strokeWidth={1.5} />
                    </div>
                    <h1 className={styles.heroTitle}>{t('title')}</h1>
                    <p className={styles.heroSubtitle}>{t('subtitle')}</p>
                </section>

                {/* Technical Explainer Cards */}
                <section className={styles.gridCards}>
                    <div className={`${styles.explainCard} neon-border-trace`} style={{ animationDelay: '0.1s' }}>
                        <div className={styles.cardIcon}>
                            <Layers size={28} />
                        </div>
                        <h2 className={styles.cardTitle}>{t('section_1_title')}</h2>
                        <p className={styles.cardText}>{t('section_1_desc')}</p>
                    </div>

                    <div className={`${styles.explainCard} neon-border-trace`} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.cardIcon}>
                            <Code size={28} />
                        </div>
                        <h2 className={styles.cardTitle}>{t('section_2_title')}</h2>
                        <p className={styles.cardText}>{t('section_2_desc')}</p>
                    </div>
                </section>

                {/* Comparison Section */}
                <section className={styles.comparisonSection} style={{ animationDelay: '0.3s' }}>
                    <div className={styles.compContent}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', opacity: 0.8 }}>
                            <ArrowRightLeft size={48} className="text-muted" />
                        </div>
                        <h2 className={styles.heroTitle} style={{ fontSize: '2rem' }}>
                            {t('vs_brc20_title')}
                        </h2>
                        <p className={styles.cardText} style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.125rem' }}>
                            {t('vs_brc20_desc')}
                        </p>
                    </div>
                </section>

                {/* Wallet Role */}
                <section className={`${styles.explainCard} neon-border-trace`} style={{ animationDelay: '0.4s' }}>
                    <div className={styles.cardIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}>
                        <ShieldCheck size={28} />
                    </div>
                    <h2 className={styles.cardTitle}>{t('wallet_role_title')}</h2>
                    <p className={styles.cardText}>{t('wallet_role_desc')}</p>
                </section>

            </div>
        </DashboardLayout>
    );
}
