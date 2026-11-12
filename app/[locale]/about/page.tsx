import React from 'react';
import { getTranslations } from 'next-intl/server';
import {
    Blocks, CalendarDays, Code, Compass, Database, Eye, Gem, Layers, ShieldCheck, Wallet,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { getRunesInfoList } from '../../../lib/unisatApi';
import styles from './about.module.css';

export default async function AboutPage() {
    const [t, runesList] = await Promise.all([
        getTranslations('About'),
        getRunesInfoList(0, 1),
    ]);

    const height = typeof runesList?.height === 'number' ? runesList.height : null;
    const totalRunes = typeof runesList?.total === 'number' ? runesList.total : null;

    const basics = [
        { icon: Layers, key: 'utxo' },
        { icon: Code, key: 'runestone' },
        { icon: Database, key: 'indexer' },
    ] as const;

    const comparisonRows = ['network', 'balances', 'data', 'transfer', 'utxos', 'indexer'] as const;

    const sources = ['unisat', 'coingecko', 'binance', 'mempool'] as const;

    return (
        <DashboardLayout>
            <div className={styles.container}>

                {/* Hero */}
                <section className={`${styles.hero} animate-fade-in`}>
                    <div className={styles.heroIcon}>
                        <Gem size={64} strokeWidth={1.5} />
                    </div>
                    <h1 className={styles.heroTitle}>{t('title')}</h1>
                    <p className={styles.heroSubtitle}>{t('subtitle')}</p>
                    <div className={styles.heroFacts}>
                        <span className={styles.fact}>
                            <CalendarDays size={16} />
                            {t('fact_launch')}
                        </span>
                        {totalRunes !== null && (
                            <span className={styles.fact}>
                                <Gem size={16} />
                                {t('fact_total', { total: totalRunes })}
                            </span>
                        )}
                        {height !== null && (
                            <span className={styles.fact}>
                                <Blocks size={16} />
                                {t('fact_height', { height })}
                            </span>
                        )}
                    </div>
                </section>

                {/* Basics */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{t('basics_title')}</h2>
                        <p className={styles.sectionLead}>{t('basics_lead')}</p>
                    </div>
                    <div className={styles.gridCards}>
                        {basics.map(({ icon: Icon, key }) => (
                            <article key={key} className={styles.card}>
                                <div className={styles.cardIcon}><Icon size={24} /></div>
                                <h3 className={styles.cardTitle}>{t(`basics_${key}_title`)}</h3>
                                <p className={styles.cardText}>{t(`basics_${key}_text`)}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Comparison */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{t('compare_title')}</h2>
                        <p className={styles.sectionLead}>{t('compare_lead')}</p>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.compareTable}>
                            <thead>
                                <tr>
                                    <th scope="col" />
                                    <th scope="col" className={styles.highlightCol}>{t('compare_runes')}</th>
                                    <th scope="col">BRC-20</th>
                                    <th scope="col">ERC-20</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row) => (
                                    <tr key={row}>
                                        <th scope="row">{t(`compare_${row}`)}</th>
                                        <td className={styles.highlightCol}>{t(`compare_${row}_runes`)}</td>
                                        <td>{t(`compare_${row}_brc20`)}</td>
                                        <td>{t(`compare_${row}_erc20`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={styles.footnote}>{t('compare_note')}</p>
                </section>

                {/* What this app does */}
                <section className={styles.appCard}>
                    <div className={styles.appIntro}>
                        <div className={`${styles.cardIcon} ${styles.cardIconSuccess}`}><ShieldCheck size={24} /></div>
                        <h2 className={styles.sectionTitle}>{t('app_title')}</h2>
                        <p className={styles.cardText}>{t('app_text')}</p>
                        <p className={styles.readOnly}>
                            <Eye size={16} />
                            {t('app_read_only')}
                        </p>
                    </div>
                    <div className={styles.sources}>
                        <h3 className={styles.sourcesTitle}>{t('sources_title')}</h3>
                        <ul className={styles.sourceList}>
                            {sources.map((source) => (
                                <li key={source}>
                                    <span className={styles.sourceName}>{t(`source_${source}`)}</span>
                                    <span className={styles.sourceUse}>{t(`source_${source}_use`)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles.ctas}>
                        <Link href="/portfolio" className={styles.primaryCta}>
                            <Wallet size={18} />
                            {t('cta_portfolio')}
                        </Link>
                        <Link href="/marketplace" className={styles.secondaryCta}>
                            <Compass size={18} />
                            {t('cta_market')}
                        </Link>
                    </div>
                </section>

            </div>
        </DashboardLayout>
    );
}
