import React from 'react';
import { getTranslations } from 'next-intl/server';
import {
    ArrowRight, Blocks, CalendarDays, Coins, Code, Compass, Database, Droplets, Eye, Flame, Gem,
    Hammer, Layers, Send, ShieldAlert, ShieldCheck, TriangleAlert, Wallet,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { getRuneInfo, getRunesInfoList } from '../../../lib/unisatApi';
import { toRuneAmount } from '../../../lib/runes';
import { formatCompactNumber } from '../../../lib/format';
import styles from './about.module.css';

// Runes protocol constants (ord): runes start at the 2024 halving block, and the shortest
// allowed name shrinks from 13 letters to 1 over the following halving period, one letter
// every 1/12 of it (17,500 blocks, about 4 months)
const FIRST_RUNE_HEIGHT = 840_000;
const HALVING_INTERVAL = 210_000;
const NAME_UNLOCK_INTERVAL = HALVING_INTERVAL / 12;
const START_NAME_LENGTH = 13;
const BLOCKS_PER_DAY = 144;
const EXAMPLE_RUNE_ID = '840000:3';

interface NameUnlockStatus {
    /** Names with this many letters or more can all be etched */
    available: number;
    /** Names with this many letters are being released during the current step */
    unlocking: number;
    /** 0..1 progress through the whole schedule */
    progress: number;
    daysToNextStep: number;
}

function nameUnlockStatus(height: number): NameUnlockStatus | null {
    const elapsed = height + 1 - FIRST_RUNE_HEIGHT;
    if (elapsed < 0 || elapsed >= HALVING_INTERVAL) return null;
    const step = Math.floor(elapsed / NAME_UNLOCK_INTERVAL);
    const nextStepHeight = FIRST_RUNE_HEIGHT + (step + 1) * NAME_UNLOCK_INTERVAL - 1;
    return {
        available: START_NAME_LENGTH - step,
        unlocking: START_NAME_LENGTH - 1 - step,
        progress: elapsed / HALVING_INTERVAL,
        daysToNextStep: Math.max(1, Math.round((nextStepHeight - height) / BLOCKS_PER_DAY)),
    };
}

export default async function AboutPage() {
    const [t, runesList, example] = await Promise.all([
        getTranslations('About'),
        getRunesInfoList(0, 1),
        getRuneInfo(EXAMPLE_RUNE_ID),
    ]);

    const height = typeof runesList?.height === 'number' ? runesList.height : null;
    const totalRunes = typeof runesList?.total === 'number' ? runesList.total : null;
    const unlock = height !== null ? nameUnlockStatus(height) : null;

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

    const cautions = [
        { icon: Wallet, key: 'wallet' },
        { icon: ShieldAlert, key: 'names' },
        { icon: Droplets, key: 'liquidity' },
        { icon: Flame, key: 'cenotaph' },
    ] as const;

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

                {/* Name unlock schedule */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{t('names_title')}</h2>
                        <p className={styles.sectionLead}>{t('names_lead')}</p>
                    </div>
                    <div className={styles.timelineCard}>
                        <div
                            className={styles.timeline}
                            role="img"
                            aria-label={unlock ? t('names_status', { available: unlock.available, unlocking: unlock.unlocking }) : t('names_done')}
                        >
                            {Array.from({ length: 12 }, (_, i) => {
                                const fill = unlock
                                    ? Math.min(1, Math.max(0, unlock.progress * 12 - i))
                                    : 1;
                                return (
                                    <div key={i} className={styles.segment}>
                                        <div className={styles.segmentFill} style={{ width: `${fill * 100}%` }} />
                                        <span className={styles.segmentLabel}>{12 - i}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.timelineEnds}>
                            <span>{t('names_start')}</span>
                            <span>{t('names_end')}</span>
                        </div>
                        <p className={styles.timelineStatus}>
                            {unlock
                                ? t('names_status_long', {
                                    height: height ?? 0,
                                    available: unlock.available,
                                    unlocking: unlock.unlocking,
                                    days: unlock.daysToNextStep,
                                })
                                : height !== null ? t('names_done') : t('names_unknown')}
                        </p>
                        <p className={styles.footnote}>{t('names_bar_hint')}</p>
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

                {/* Cautions */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <TriangleAlert size={22} className={styles.titleIconWarning} />
                            {t('cautions_title')}
                        </h2>
                    </div>
                    <div className={styles.cautions}>
                        {cautions.map(({ icon: Icon, key }) => (
                            <article key={key} className={styles.caution}>
                                <Icon size={20} className={styles.cautionIcon} />
                                <div>
                                    <h3 className={styles.cautionTitle}>{t(`caution_${key}_title`)}</h3>
                                    <p className={styles.cardText}>{t(`caution_${key}_text`)}</p>
                                </div>
                            </article>
                        ))}
                    </div>
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
