import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { WalletProvider } from '../../components/WalletContext';
import "../globals.css";

export const metadata: Metadata = {
  title: "Autumn Runes Dashboard | Runes Protocol",
  description: "A premium, non-custodial dashboard for managing Bitcoin Runes tokens and tracking market activity via UniSat interface.",
  keywords: ["Bitcoin", "Runes Protocol", "UniSat", "Wallet", "Dashboard", "Crypto", "Web3"],
  authors: [{ name: "Autumn Softwares" }],
  openGraph: {
    title: "Autumn Runes Dashboard",
    description: "Manage your Bitcoin Runes assets with real-time tracking.",
    type: "website",
  },
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Fetch messages
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <WalletProvider>
            <div className="layout-container">
              {children}
            </div>
          </WalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
