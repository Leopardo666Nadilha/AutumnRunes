import React from 'react';
import { getTranslations } from 'next-intl/server';
import { DashboardLayout } from '../../components/DashboardLayout';
import { MarketBanner } from '../../components/Market/MarketBanner';
import { MarketStats } from '../../components/Market/MarketStats';
import { TopRunesTable } from '../../components/Market/TopRunesTable';
import { BitcoinCandleChart } from '../../components/BitcoinCandleChart';

export default async function MarketOverviewPage() {
  const t = await getTranslations('Market');

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Runes Market Banner highlighting DOG/Bitcoin */}
        <section className="animate-fade-in">
          <MarketBanner />
        </section>

        {/* Bitcoin Candlestick Chart */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <BitcoinCandleChart />
        </section>

        {/* Global Protocol Stats */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <MarketStats />
        </section>

        {/* Top Runes List (Reusing RunesTable component structure for layout consistency) */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s', marginTop: '1rem' }}>
          <TopRunesTable />
        </section>

      </div>
    </DashboardLayout>
  );
}
