import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, BadgeCheck, ShieldAlert } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { ConstructionNotice } from '../../../../components/Market/ConstructionNotice';
import { RuneMarketActivity } from '../../../../components/Market/RuneMarketActivity';
import { getRuneInfo, getRuneMarketStats } from '../../../../lib/unisatApi';
import { getBitcoinMarketData } from '../../../../lib/marketApi';
import { isValidRuneId } from '../../../../lib/validation';
import { toRuneAmount } from '../../../../lib/runes';
import {
    formatBtcFromSats, formatChange, formatCompactNumber, formatCompactUsd, formatSats, formatUsd,
} from '../../../../lib/format';
import tableStyles from '../../../../components/RunesTable.module.css';
import styles from '../../../../components/Market/RuneMarket.module.css';

// Mint caps above this are treated as unlimited (compact formatting tops out at trillions)
const UNLIMITED_MINT_CAP = 1e15;

interface RunePageProps {
    params: Promise<{ locale: string; runeId: string }>;
}

function parseRuneId(raw: string): string | null {
    try {
        const id = decodeURIComponent(raw);
        return isValidRuneId(id) ? id : null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: RunePageProps): Promise<Metadata> {
    const id = parseRuneId((await params).runeId);
    const info = id ? await getRuneInfo(id) : null;
    return info ? { title: `${info.spacedRune} | Autumn Runes` } : {};
}

export default async function RunePage({ params }: RunePageProps) {
    const id = parseRuneId((await params).runeId);
    const info = id ? await getRuneInfo(id) : null;
    if (!info) notFound();

    const [t, locale, stats, btcMarket] = await Promise.all([
        getTranslations('Marketplace'),
        getLocale(),
        getRuneMarketStats(info.spacedRune),
        getBitcoinMarketData(),
    ]);
    const btcUsd = typeof btcMarket?.usd === 'number' ? btcMarket.usd : null;
    const toUsd = (sats: number) => (btcUsd ? (sats * btcUsd) / 1e8 : null);

    const supply = toRuneAmount(info.supply, info.divisibility);
    const premine = toRuneAmount(info.premine, info.divisibility);
    const burned = toRuneAmount(info.burned, info.divisibility);
    const fullAmount = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: info.divisibility });

    const mintCap = Number(info.terms?.cap);
    const mints = Number(info.mints);
    const hasMintCap = Number.isFinite(mintCap) && mintCap > 0;
    // Keep the value to one short word; progress and counts go on the smaller line below
    const mintValue = !info.terms ? t('mint_none') : info.mintable ? t('mint_open') : t('mint_closed');
    // Some runes (e.g. UNCOMMON•GOODS) set the cap to the u128 maximum, i.e. no real limit
    const unlimitedMint = !hasMintCap || mintCap >= UNLIMITED_MINT_CAP;
    const mintSub = !info.terms
        ? (supply > 0 && premine >= supply ? t('mint_all_premined') : undefined)
        : unlimitedMint
            ? t('mint_unlimited', { mints: formatCompactNumber(mints) })
            : t('mint_progress', {
                progress: Math.min(100, Math.floor((mints / mintCap) * 100)),
                mints: formatCompactNumber(mints),
                cap: formatCompactNumber(mintCap),
            });

    // UNCOMMON•GOODS (1:0) is built into the protocol: no etching transaction and timestamp 0
    const hasEtching = info.timestamp > 0 && /^[0-9a-f]{64}$/.test(info.etching) && /[1-9a-f]/.test(info.etching);
    const etchedBlock = t('etched_block', { height: info.height.toLocaleString('en-US') });

    const change = stats?.change ?? null;
    const traded24h = !!stats && stats.btcVolume > 0;
    const statCards: { label: string; value: string; title?: string; sub?: React.ReactNode }[] = [
        {
            label: t('stat_market_cap'),
            value: formatCompactUsd(stats?.capUSD),
        },
        {
            label: t('stat_volume'),
            value: !stats ? '—' : btcUsd ? formatCompactUsd(toUsd(stats.btcVolume)) : formatBtcFromSats(stats.btcVolume),
            sub: stats && btcUsd ? formatBtcFromSats(stats.btcVolume) : undefined,
        },
        {
            label: t('stat_holders'),
            value: info.holders.toLocaleString('en-US'),
        },
        {
            label: t('stat_transactions'),
            value: info.transactions.toLocaleString('en-US'),
        },
        {
            label: t('stat_supply'),
            value: formatCompactNumber(supply),
            title: fullAmount(supply),
        },
        {
            label: t('stat_premine'),
            value: formatCompactNumber(premine),
            title: fullAmount(premine),
            sub: supply > 0 ? t('share_of_supply', { pct: Number(((premine / supply) * 100).toFixed(2)) }) : undefined,
        },
        {
            label: t('stat_burned'),
            value: formatCompactNumber(burned),
            title: fullAmount(burned),
        },
        {
            label: t('stat_mint'),
            value: mintValue,
            sub: mintSub,
        },
        hasEtching
            ? {
                label: t('stat_etched'),
                value: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(info.timestamp * 1000),
                sub: (
                    <a
                        href={`https://mempool.space/tx/${info.etching}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.inlineLink}
                    >
                        {etchedBlock}
                    </a>
                ),
            }
            : {
                label: t('stat_etched'),
                value: t('etched_protocol'),
                sub: etchedBlock,
            },
        {
            label: t('stat_divisibility'),
            value: String(info.divisibility),
        },
    ];

    return (
        <DashboardLayout>
            <div className={`${styles.page} animate-fade-in`}>
                <Link href="/marketplace" className={styles.back}>
                    <ArrowLeft size={16} />
                    {t('back_to_market')}
                </Link>

                <section className={styles.hero}>
                    <div className={styles.identity}>
                        <div className={styles.symbol}>{info.symbol || '✦'}</div>
                        <div className={styles.identityText}>
                            <h2 className={styles.runeName}>
                                <span>{info.spacedRune}</span>
                                {stats?.verified && (
                                    <BadgeCheck size={20} className={styles.verified} aria-label={t('verified')} />
                                )}
                            </h2>
                            <span className={styles.meta}>#{info.number.toLocaleString('en-US')} · ID {info.runeid}</span>
                        </div>
                    </div>

                    <div className={styles.priceBlock}>
                        {stats ? (
                            <>
                                {btcUsd ? (
                                    <span className={styles.price}>{formatUsd(toUsd(stats.curPrice))}</span>
                                ) : (
                                    <span className={styles.price}>
                                        {formatSats(stats.curPrice)} <span className={styles.priceUnit}>sats</span>
                                    </span>
                                )}
                                <span className={styles.priceSub}>
                                    {btcUsd && <span>{formatSats(stats.curPrice)} sats</span>}
                                    {change !== null ? (
                                        <span
                                            className={change > 0 ? tableStyles.changePositive : change < 0 ? tableStyles.changeNegative : ''}
                                            title={t(stats.changeSource === 'coingecko' ? 'change_source_coingecko' : 'change_source_sales')}
                                        >
                                            {formatChange(change)} · 24h{' '}
                                            <span className={styles.changeSource}>
                                                ({t(stats.changeSource === 'coingecko' ? 'source_coingecko' : 'source_sales')})
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={styles.noTrades}>
                                            {traded24h ? t('change_unavailable') : t('no_trades', { period: t('period_24h') })}
                                        </span>
                                    )}
                                </span>
                            </>
                        ) : (
                            <span className={styles.noMarket}>{t('no_market_data')}</span>
                        )}
                    </div>
                </section>

                {stats?.warning && (
                    <div className={styles.warning} role="alert">
                        <ShieldAlert size={18} />
                        <span>{t('similar_warning')}</span>
                    </div>
                )}

                <ConstructionNotice title={t('construction_badge')} text={t('trading_unavailable')} />

                <div className={styles.statsGrid}>
                    {statCards.map((card) => (
                        <div key={card.label} className={styles.stat}>
                            <span className={styles.statLabel}>{card.label}</span>
                            <span className={styles.statValue} title={card.title}>{card.value}</span>
                            {card.sub && <span className={styles.statSub}>{card.sub}</span>}
                        </div>
                    ))}
                </div>

                <RuneMarketActivity
                    key={info.runeid}
                    spacedRune={info.spacedRune}
                    divisibility={info.divisibility}
                    btcUsd={btcUsd}
                />
            </div>
        </DashboardLayout>
    );
}
