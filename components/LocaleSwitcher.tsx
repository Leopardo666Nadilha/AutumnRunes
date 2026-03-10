"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import React, { useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LocaleSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const nextLocale = event.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <Globe size={16} color="var(--text-muted)" />
            <select
                defaultValue={locale}
                disabled={isPending}
                onChange={onSelectChange}
                style={{
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                }}
            >
                <option value="en" style={{ background: 'var(--bg-primary)' }}>English</option>
                <option value="pt" style={{ background: 'var(--bg-primary)' }}>Português</option>
            </select>
        </div>
    );
}
