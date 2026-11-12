import React from 'react';
import { getTranslations } from 'next-intl/server';
import {
    ArrowRight, Blocks, CalendarDays, Coins, Code, Compass, Database, Eye, Flame, Gem,
    Hammer, Layers, Send, ShieldCheck, Wallet,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { getRuneInfo, getRunesInfoList } from '../../../lib/unisatApi';
import { toRuneAmount } from '../../../lib/runes';
import { formatCompactNumber } from '../../../lib/format';
import styles from './about.module.css';

const EXAMPLE_RUNE_ID = '840000:3';

export default async function AboutPage() {
    const [t, runesList, example] = await Promise.all([
        getTranslations('About'),
        getRunesInfoList(0, 1),
        getRuneInfo(EXAMPLE_RUNE_ID),
    ]);

    const height = typeof runesList?.height === 'number' ? runesList.height : null;
    const totalRunes = typeof runesList?.total === 'number' ? runesList.total : null;

    const lifecycle = [
        { icon: Hammer, key: 'etch' },
        { icon: Coins, key: 'mint' },
        { icon: Send, key: 'transfer' },
        { icon: Flame, key: 'burn' },
    ] as const;

    const basics = [
        { icon: Layers, key: 'utxo' },
        { icon: Code, key: 'runestone' },
        { icon: Database, key: 'indexer' },
    ] as const;

    const comparisonRows = ['network', 'balances', 'data', 'transfer', 'utxos', 'indexer'] as const;

    const sources = ['unisat', 'coingecko', 'binance', 'mempool'] as const;

    // Anatomy of a real rune; the section is skipped if the indexer is unavailable
    const anatomy = example ? (() => {
        const supply = toRuneAmount(example.supply, example.divisibility);
        const premine = toRuneAmount(example.premine, example.divisibility);
        const [block, tx] = example.runeid.split(':');
        return [
            { label: t('anatomy_name'), value: example.spacedRune, hint: t('anatomy_name_hint', { rune: example.rune }) },
            { label: t('anatomy_symbol'), value: example.symbol || '¤', hint: t('anatomy_symbol_hint') },
            { label: t('anatomy_id'), value: example.runeid, hint: t('anatomy_id_hint', { block: Number(block), tx: Number(tx) }) },
            {
                label: t('anatomy_divisibility'),
                value: String(example.divisibility),
                hint: t('anatomy_divisibility_hint', { units: 10 ** example.divisibility }),
            },
            { label: t('anatomy_supply'), value: formatCompactNumber(supply), hint: t('anatomy_supply_hint') },
            {
                label: t('anatomy_premine'),
                value: supply > 0 ? `${Number(((premine / supply) * 100).toFixed(2))}%` : '—',
                hint: example.terms ? t('anatomy_premine_hint_mint') : t('anatomy_premine_hint_all'),
            },
        ];
    })() : null;

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

                {/* Lifecycle */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{t('lifecycle_title')}</h2>
                        <p className={styles.sectionLead}>{t('lifecycle_lead')}</p>
                    </div>
                    <ol className={styles.steps}>
                        {lifecycle.map(({ icon: Icon, key }, i) => (
                            <li key={key} className={styles.step}>
                                <div className={styles.stepHeader}>
                                    <span className={styles.stepNumber}>{i + 1}</span>
                                    <Icon size={20} className={styles.stepIcon} />
                                </div>
                                <h3 className={styles.stepTitle}>{t(`lifecycle_${key}_title`)}</h3>
                                <p className={styles.cardText}>{t(`lifecycle_${key}_text`)}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Anatomy of a real rune */}
                {example && anatomy && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>{t('anatomy_title')}</h2>
                            <p className={styles.sectionLead}>{t('anatomy_lead', { name: example.spacedRune })}</p>
                        </div>
                        <div className={styles.anatomy}>
                            <div className={styles.anatomyBadge}>
                                <span className={styles.anatomySymbol}>{example.symbol || '¤'}</span>
                                <div className={styles.anatomyHeading}>
                                    <span className={styles.anatomyName}>{example.spacedRune}</span>
                                    <span className={styles.anatomyMeta}>
                                        {t('anatomy_holders', { holders: example.holders })}
                                    </span>
                                </div>
                                <Link href={`/marketplace/${example.runeid}`} className={styles.inlineCta}>
                                    {t('anatomy_link')}
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                            <dl className={styles.anatomyFields}>
                                {anatomy.map((field) => (
                                    <div key={field.label} className={styles.anatomyField}>
                                        <dt className={styles.fieldLabel}>{field.label}</dt>
                                        <dd className={styles.fieldValue}>{field.value}</dd>
                                        <dd className={styles.fieldHint}>{field.hint}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                )}

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
