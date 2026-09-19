import React, { useState, useEffect } from 'react';

/**
 * Bilingual runtime switcher (HU/EN) posting to /locale with CSRF and return_to path.
 */
export default function LanguageSwitcher({ currentLocale: propLocale, returnTo: propReturnTo }) {
    const [locale, setLocale] = useState(propLocale || 'hu');
    const [csrfToken, setCsrfToken] = useState('');
    const [returnTo, setReturnTo] = useState(propReturnTo || '/');

    useEffect(() => {
        if (!propLocale && typeof document !== 'undefined') {
            const htmlLang = document.documentElement.lang;
            if (htmlLang) {
                setLocale(htmlLang.startsWith('en') ? 'en' : 'hu');
            }
        }
        if (typeof document !== 'undefined') {
            const meta = document.querySelector('meta[name="csrf-token"]');
            if (meta) {
                setCsrfToken(meta.getAttribute('content') || '');
            }
            if (!propReturnTo) {
                setReturnTo(window.location.pathname + window.location.search);
            }
        }
    }, [propLocale, propReturnTo]);

    return (
        <form
            action="/locale"
            method="POST"
            className="language-toggle"
            role="group"
            aria-label={locale === 'en' ? 'Language selection' : 'Nyelvválasztás'}
        >
            <input type="hidden" name="_token" value={csrfToken} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button
                type="submit"
                name="locale"
                value="hu"
                className="language-toggle-option"
                lang="hu"
                aria-pressed={locale === 'hu'}
            >
                Magyar
            </button>
            <button
                type="submit"
                name="locale"
                value="en"
                className="language-toggle-option"
                lang="en"
                aria-pressed={locale === 'en'}
            >
                English
            </button>
        </form>
    );
}
