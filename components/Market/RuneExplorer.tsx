"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Compass, Loader2, Search, ShieldAlert, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import {
    getRunesMarketList, searchRunes, type MarketPeriod, type RuneListItem, type RuneListPage,
} from '../../lib/unisatApi';
import { normalizeRuneQuery } from '../../lib/validation';
import { formatBtcFromSats, formatChange, formatCompactUsd, formatSats, formatUsd } from '../../lib/format';
import { Skeleton } from '../Skeleton';
import tableStyles from '../RunesTable.module.css';
import chartStyles from '../BitcoinCandleChart.module.css';
import styles from './RuneExplorer.module.css';

const MARKET_PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const COLUMN_COUNT = 7;
const PERIODS: MarketPeriod[] = ['24h', '7d', '30d'];

type Status = 'loading' | 'ready' | 'error';

function fetchPage(term: string, period: MarketPeriod, start: number): Promise<RuneListPage | null> {
    return term
        ? searchRunes(term, start, SEARCH_PAGE_SIZE, period)
        : getRunesMarketList(start, MARKET_PAGE_SIZE, period);
}

export const RuneExplorer: React.FC = () => {
    const t = useTranslations('Marketplace');
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [period, setPeriod] = useState<MarketPeriod>('24h');
    const [term, setTerm] = useState('');
    const [items, setItems] = useState<RuneListItem[]>([]);
    const [btcPrice, setBtcPrice] = useState<number | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [status, setStatus] = useState<Status>('loading');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    // Last loaded "period|term"; null until the first load so the initial empty search still runs
    const loadedKeyRef = useRef<string | null>(null);
    const requestIdRef = useRef(0);

    // Debounce typing, then load the market list (empty search) or the search results
    useEffect(() => {
        const next = query.trim();
        const key = `${period}|${next}`;
        const timer = setTimeout(async () => {
            if (key === loadedKeyRef.current) return;
            loadedKeyRef.current = key;
            const requestId = ++requestIdRef.current;
            setTerm(next);
            setItems([]);
            setIsLoadingMore(false);

            // Input with no letters (e.g. "123") can never match a rune name
            if (next && !normalizeRuneQuery(next)) {
                setHasMore(false);
                setStatus('ready');
                return;
            }

            setStatus('loading');
            const page = await fetchPage(next, period, 0);
            if (requestId !== requestIdRef.current) return;
            if (!page) {
                setStatus('error');
                return;
            }
            setItems(page.items);
            setHasMore(page.hasMore);
            if (page.btcPrice) setBtcPrice(page.btcPrice);
            setStatus('ready');
        }, next && next !== loadedKeyRef.current?.split('|')[1] ? SEARCH_DEBOUNCE_MS : 0);
        return () => clearTimeout(timer);
    }, [query, period]);

    const loadMore = async () => {
        if (isLoadingMore) return;
        const requestId = requestIdRef.current;
        setIsLoadingMore(true);
        const page = await fetchPage(term, period, items.length);
        // The search or period changed while this page was loading
        if (requestId !== requestIdRef.current) return;
        setIsLoadingMore(false);
        if (!page) return;
        setItems((prev) => {
            const seen = new Set(prev.map((item) => item.runeId));
            return [...prev, ...page.items.filter((item) => !seen.has(item.runeId))];
        });
        setHasMore(page.hasMore);
        if (page.btcPrice) setBtcPrice(page.btcPrice);
    };

    const openRune = (e: React.MouseEvent, runeId: string) => {
        // The name cell is a real link; let it handle its own clicks (incl. middle/ctrl-click)
        if ((e.target as HTMLElement).closest('a')) return;
        router.push(`/marketplace/${runeId}`);
    };

    const periodLabel = t(`period_${period}`);
    const toUsd = (sats: number) => (btcPrice ? (sats * btcPrice) / 1e8 : null);

    const caption = term
        ? (status === 'ready' ? t('search_results', { term }) : t('searching', { term }))
        : t('market_sorted', { period: periodLabel });

    return (
        <section className={tableStyles.tableCard}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <div className={tableStyles.title}>
                        <Compass size={20} className="text-accent" />
                        <span>{t('explore_title')}</span>
                    </div>
                    <span className={styles.caption}>{caption}</span>
                </div>

                <div className={styles.controls}>
                    <div className={chartStyles.toolbar} role="group" aria-label={t('period_label')}>
                        {PERIODS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={`${chartStyles.intervalBtn} ${period === p ? chartStyles.intervalBtnActive : ''}`}
                                aria-pressed={period === p}
                                onClick={() => setPeriod(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className={styles.search}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder={t('search_placeholder')}
                            aria-label={t('search_placeholder')}
                            value={query}
                            maxLength={64}
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                type="button"
                                className={styles.clearBtn}
                                aria-label={t('clear_search')}
                                onClick={() => setQuery('')}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={tableStyles.tableWrapper}>
                <table className={tableStyles.table}>
                    <thead>
                        <tr>
                            <th className={tableStyles.th}>#</th>
                            <th className={tableStyles.th}>{t('col_rune')}</th>
                            <th className={`${tableStyles.th} ${styles.numeric}`}>{t('col_price')}</th>
                            <th className={`${tableStyles.th} ${styles.numeric}`}>{t('col_change', { period })}</th>
                            <th className={`${tableStyles.th} ${styles.numeric}`}>{t('col_volume', { period })}</th>
                            <th className={`${tableStyles.th} ${styles.numeric}`}>{t('col_market_cap')}</th>
                            <th className={`${tableStyles.th} ${styles.numeric}`}>{t('col_holders')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {status === 'loading' && Array.from({ length: 6 }, (_, i) => (
                            <tr key={`skeleton-${i}`} className={tableStyles.tr}>
                                <td className={tableStyles.td} colSpan={COLUMN_COUNT}>
                                    <Skeleton height="2rem" />
                                </td>
                            </tr>
                        ))}

                        {status === 'error' && (
                            <tr>
                                <td colSpan={COLUMN_COUNT} className={`${tableStyles.td} ${styles.empty}`}>
                                    {t('load_error')}
                                </td>
                            </tr>
                        )}

                        {status === 'ready' && items.length === 0 && (
                            <tr>
                                <td colSpan={COLUMN_COUNT} className={`${tableStyles.td} ${styles.empty}`}>
                                    {term ? t('no_results', { term }) : t('no_market_runes')}
                                </td>
                            </tr>
                        )}

                        {status === 'ready' && items.map((item, i) => {
                            const market = item.market;
                            const usdPrice = market ? toUsd(market.curPrice) : null;
                            // UniSat reports 0% for runes that did not trade in the period; that is "unknown", not "flat"
                            const traded = !!market && market.btcVolume > 0;
                            const change = traded ? market.changePercent : null;
                            const noTradesHint = market && !traded ? t('no_trades', { period: periodLabel }) : undefined;
                            return (
                                <tr
                                    key={item.runeId}
                                    className={`${tableStyles.tr} ${styles.row}`}
                                    onClick={(e) => openRune(e, item.runeId)}
                                >
                                    <td className={`${tableStyles.td} ${styles.rank}`}>{i + 1}</td>
                                    <td className={tableStyles.td}>
                                        <Link href={`/marketplace/${item.runeId}`} className={styles.runeLink}>
                                            <div className={tableStyles.assetCell}>
                                                <div className={tableStyles.assetIcon}>
                                                    {item.symbol || Array.from(item.spacedRune)[0] || '✦'}
                                                </div>
                                                <div className={tableStyles.assetName}>
                                                    <span className={`${tableStyles.name} ${styles.runeName}`}>
                                                        {item.spacedRune}
                                                        {market?.verified && (
                                                            <BadgeCheck size={14} className={styles.verifiedIcon} aria-label={t('verified')} />
                                                        )}
                                                        {market?.warning && (
                                                            <ShieldAlert size={14} className={styles.warningIcon} aria-label={t('similar_warning_short')} />
                                                        )}
                                                    </span>
                                                    <span className={tableStyles.ticker}>ID {item.runeId}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className={`${tableStyles.td} ${styles.numeric}`}>
                                        {market ? (
                                            usdPrice !== null ? (
                                                <>
                                                    <span>{formatUsd(usdPrice)}</span>
                                                    <span className={styles.subValue}>{formatSats(market.curPrice)} sats</span>
                                                </>
                                            ) : `${formatSats(market.curPrice)} sats`
                                        ) : '—'}
                                    </td>
                                    <td
                                        className={`${tableStyles.td} ${styles.numeric} ${change === null || change === 0 ? '' : change > 0 ? tableStyles.changePositive : tableStyles.changeNegative} ${noTradesHint ? styles.noTrades : ''}`}
                                        title={noTradesHint}
                                    >
                                        {formatChange(change)}
                                    </td>
                                    <td className={`${tableStyles.td} ${styles.numeric} ${noTradesHint ? styles.noTrades : ''}`} title={noTradesHint}>
                                        {traded ? (
                                            toUsd(market.btcVolume) !== null ? (
                                                <>
                                                    <span>{formatCompactUsd(toUsd(market.btcVolume))}</span>
                                                    <span className={styles.subValue}>{formatBtcFromSats(market.btcVolume)}</span>
                                                </>
                                            ) : formatBtcFromSats(market.btcVolume)
                                        ) : '—'}
                                    </td>
                                    <td className={`${tableStyles.td} ${styles.numeric}`}>
                                        {formatCompactUsd(market?.capUSD)}
                                    </td>
                                    <td className={`${tableStyles.td} ${styles.numeric}`}>
                                        {item.holders?.toLocaleString('en-US') ?? '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {status === 'ready' && hasMore && (
                <button type="button" className={styles.loadMore} onClick={loadMore} disabled={isLoadingMore}>
                    {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
                    {t('load_more')}
                </button>
            )}
        </section>
    );
};
