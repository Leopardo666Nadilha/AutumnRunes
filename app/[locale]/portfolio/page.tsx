import React from 'react';
import { getTranslations } from 'next-intl/server';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { PortfolioContent } from '../../../components/PortfolioContent';

export default async function PortfolioOverviewPage() {
    const t = await getTranslations('Dashboard');

    return (
        <DashboardLayout>
            <PortfolioContent />
        </DashboardLayout>
    );
}
