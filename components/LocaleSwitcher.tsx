"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import React, { useEffect, useId, useRef, useState, useTransition } from 'react';
import { Check, ChevronDown, Globe, Loader2 } from 'lucide-react';
import styles from './LocaleSwitcher.module.css';

type Locale = (typeof routing.locales)[number];

const LOCALE_LABELS: Record<Locale, string> = {
    en: 'English',
    pt: 'Português',
};

export default function LocaleSwitcher() {
    const t = useTranslations('Dashboard');
    const locale = useLocale() as Locale;
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
    const listId = useId();

    const locales = routing.locales;

    // Close when clicking anywhere outside the switcher
    useEffect(() => {
        if (!isOpen) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [isOpen]);

    // Keep keyboard focus on the highlighted option while the menu is open
    useEffect(() => {
        if (isOpen) optionRefs.current[activeIndex]?.focus();
    }, [isOpen, activeIndex]);

    const open = () => {
        setActiveIndex(Math.max(0, locales.indexOf(locale)));
        setIsOpen(true);
    };

    const close = (restoreFocus: boolean) => {
        setIsOpen(false);
        if (restoreFocus) triggerRef.current?.focus();
    };

    const select = (nextLocale: Locale) => {
        close(true);
        if (nextLocale === locale) return;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    const onTriggerKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            open();
        }
    };

    const onListKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % locales.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((i) => (i - 1 + locales.length) % locales.length);
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(locales.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                select(locales[activeIndex]);
                break;
            case 'Escape':
                e.preventDefault();
                close(true);
                break;
            case 'Tab':
                close(false);
                break;
        }
    };

    return (
        <div ref={rootRef} className={styles.root}>
            <button
                ref={triggerRef}
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
                aria-label={`${t('language')}: ${LOCALE_LABELS[locale]}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listId}
                disabled={isPending}
                onClick={() => (isOpen ? close(false) : open())}
                onKeyDown={onTriggerKeyDown}
            >
                {isPending
                    ? <Loader2 size={16} className={`${styles.icon} animate-spin`} />
                    : <Globe size={16} className={styles.icon} />}
                <span>{LOCALE_LABELS[locale]}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={t('language')}
                    className={styles.menu}
                    onKeyDown={onListKeyDown}
                >
                    {locales.map((loc, index) => {
                        const isSelected = loc === locale;
                        return (
                            <li
                                key={loc}
                                ref={(el) => { optionRefs.current[index] = el; }}
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={index === activeIndex ? 0 : -1}
                                className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                                onClick={() => select(loc)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                <span className={styles.optionCode}>{loc.toUpperCase()}</span>
                                <span className={styles.optionLabel}>{LOCALE_LABELS[loc]}</span>
                                {isSelected && <Check size={14} className={styles.check} />}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
