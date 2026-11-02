"use client";

import React from 'react';
import { ExternalLink, Receipt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatRuneAmount } from '../../lib/runes';
import { formatBtcFromSats, formatSats, formatUsd } from '../../lib/format';
import { Skeleton } from '../Skeleton';
import { RuneCandleChart } from './RuneCandleChart';
import { useRuneSales } from './useRuneSales';
import tableStyles from '../RunesTable.module.css';
import explorerStyles from './RuneExplorer.module.css';
import styles from './RuneMarket.module.css';

const RECENT_SALES = 20;

interface RuneMarketActivityProps {
    spacedRune: string;
    divisibility: number;
    btcUsd: number | null;
}

/** Price chart and latest sales, both built from the rune's marketplace sales history. */
export const RuneMarketActivity: React.FC<RuneMarketActivityProps> = ({ spacedRune, divisibility, btcUsd }) => {
    const t = useTranslations('Marketplace');
    const locale = useLocale();
    const { sales, status, hasMore, isLoadingMore, loadMore } = useRuneSales(spacedRune);

    const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });
    const recent = sales.slice(0, RECENT_SALES);

    return (
        <>
            <RuneCandleChart
                sales={sales}
                status={status}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMore}
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

                            {recent.map((sale) => (
                                <tr key={sale.id} className={tableStyles.tr}>
                                    <td className={`${tableStyles.td} ${styles.muted}`}>{dateFormat.format(sale.time)}</td>
                                    <td className={`${tableStyles.td} ${explorerStyles.numeric}`}>
                                        {formatRuneAmount(sale.amount, divisibility)}
                                    </td>
                                    <td className={`${tableStyles.td} ${explorerStyles.numeric}`}>
                                        <span>{formatSats(sale.unitPrice)} sats</span>
                                        {btcUsd && (
                                            <span className={explorerStyles.subValue}>{formatUsd((sale.unitPrice * btcUsd) / 1e8)}</span>
                                        )}
                                    </td>
                                    <td className={`${tableStyles.td} ${explorerStyles.numeric}`}>
                                        <span>{formatBtcFromSats(sale.price)}</span>
                                        {btcUsd && (
                                            <span className={explorerStyles.subValue}>{formatUsd((sale.price * btcUsd) / 1e8)}</span>
                                        )}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
};
