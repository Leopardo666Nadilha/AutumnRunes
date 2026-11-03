"use client";

import React, { useCallback } from 'react';
import { ExternalLink, Receipt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatBtcFromSats, formatSats, formatUsd } from '../../lib/format';
import { Skeleton } from '../Skeleton';
import { RuneCandleChart, type SatsToUsd } from './RuneCandleChart';
import { useBtcDailyPrices } from './useBtcDailyPrices';
import { useRuneSales } from './useRuneSales';
import tableStyles from '../RunesTable.module.css';
import explorerStyles from './RuneExplorer.module.css';
import styles from './RuneMarket.module.css';

const RECENT_SALES = 20;

interface RuneMarketActivityProps {
    spacedRune: string;
    divisibility: number;
    /** Current BTC/USD, used when the daily history is unavailable */
    btcUsd: number | null;
}

/** Price chart and latest sales, both built from the rune's marketplace sales history. */
export const RuneMarketActivity: React.FC<RuneMarketActivityProps> = ({ spacedRune, divisibility, btcUsd }) => {
    const t = useTranslations('Marketplace');
    const locale = useLocale();
    const { sales, status, hasMore, isLoadingMore, loadMore } = useRuneSales(spacedRune);
    const btcDaily = useBtcDailyPrices();
    const { usdAt } = btcDaily;

    // Each sale is converted with the BTC price of its own day, so old sales aren't valued at today's BTC
    const toUsd = useCallback<SatsToUsd>((sats, timeMs) => {
        const btcPrice = usdAt?.(timeMs) ?? btcUsd;
        return btcPrice ? (sats * btcPrice) / 1e8 : null;
    }, [usdAt, btcUsd]);

    const pricesLoading = btcDaily.status === 'loading';
    const canConvert = usdAt !== null || btcUsd !== null;
    const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });
    const recent = sales.slice(0, RECENT_SALES);

    return (
        <>
            <RuneCandleChart
                // Wait for BTC prices so the chart is framed once, already in its final unit
                sales={pricesLoading ? [] : sales}
                status={pricesLoading ? 'loading' : status}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMore}
                toUsd={canConvert ? toUsd : null}
            />

            <section className={tableStyles.tableCard}>
                <div className={tableStyles.title}>
                    <Receipt size={20} className="text-accent" />
                    <span>{t('recent_sales')}</span>
                </div>

                <div className={tableStyles.tableWrapper}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th className={tableStyles.th}>{t('col_time')}</th>
                                <th className={`${tableStyles.th} ${explorerStyles.numeric}`}>{t('col_amount')}</th>
                                <th className={`${tableStyles.th} ${explorerStyles.numeric}`}>{t('col_unit_price')}</th>
                                <th className={`${tableStyles.th} ${explorerStyles.numeric}`}>{t('col_total')}</th>
                                <th className={tableStyles.th} aria-label={t('view_tx')} />
                            </tr>
                        </thead>
                        <tbody>
                            {status === 'loading' && Array.from({ length: 4 }, (_, i) => (
                                <tr key={`skeleton-${i}`} className={tableStyles.tr}>
                                    <td className={tableStyles.td} colSpan={5}><Skeleton height="1.5rem" /></td>
                                </tr>
                            ))}

                            {status !== 'loading' && recent.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={`${tableStyles.td} ${explorerStyles.empty}`}>
                                        {status === 'error' ? t('load_error') : t('chart_empty')}
                                    </td>
                                </tr>
                            )}

                            {recent.map((sale) => {
                                const unitUsd = toUsd(sale.unitPrice, sale.time);
                                const totalUsd = toUsd(sale.price, sale.time);
                                return (
                                    <tr key={sale.id} className={tableStyles.tr}>
                                        <td className={`${tableStyles.td} ${styles.muted}`}>{dateFormat.format(sale.time)}</td>
                                        <td className={`${tableStyles.td} ${explorerStyles.numeric}`}>
                                            {/* Same number format as the prices beside it, so "491.356" can't read as 491 thousand */}
                                            {sale.amount.toLocaleString('en-US', { maximumFractionDigits: divisibility })}
                                        </td>
                                        <td className={`${tableStyles.td} ${explorerStyles.numeric}`}>
                                            {unitUsd !== null ? (
                                                <>
                                                    <span>{formatUsd(unitUsd)}</span>
                                                    <span className={explorerStyles.subValue}>{formatSats(sale.unitPrice)} sats</span>
                                                </>
                                            ) : `${formatSats(sale.unitPrice)} sats`}
                                        </td>
                                        <td className={`${tableStyles.td} ${explorerStyles.numeric}`}>
                                            {totalUsd !== null ? (
                                                <>
                                                    <span>{formatUsd(totalUsd)}</span>
                                                    <span className={explorerStyles.subValue}>{formatBtcFromSats(sale.price)}</span>
                                                </>
                                            ) : formatBtcFromSats(sale.price)}
                                        </td>
                                        <td className={`${tableStyles.td} ${styles.linkCell}`}>
                                            {sale.txid && (
                                                <a
                                                    href={`https://mempool.space/tx/${sale.txid}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.iconLink}
                                                    aria-label={t('view_tx')}
                                                    title={t('view_tx')}
                                                >
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
};
