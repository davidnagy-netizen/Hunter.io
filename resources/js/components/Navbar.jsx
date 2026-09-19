import React, { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Public and authenticated navigation rail/header with route awareness and bilingual localization.
 */
export default function Navbar({
    user = null,
    currentPath = '/',
    currentLocale = 'hu',
    csrfToken = '',
}) {
    const isEn = currentLocale === 'en';

    return (
        <header className="public-header">
            <div className="public-header-brand">
                <a href="/">Fundor.hu</a>
                <span className="logo-badge">{isEn ? 'INTELLIGENCE' : 'INTELLIGENCIA'}</span>
            </div>

            {/* Desktop Actions */}
            <nav className="public-header-actions" aria-label={isEn ? 'Main navigation' : 'Fő navigáció'}>
                <LanguageSwitcher currentLocale={currentLocale} />
                <a
                    href="/assessment"
                    className="btn btn-ghost"
                    aria-current={currentPath === '/assessment' ? 'page' : undefined}
                >
                    {isEn ? 'Free Assessment' : 'Ingyenes Felmérés'}
                </a>
                {user ? (
                    <a href="/dashboard" className="btn btn-gold">
                        {isEn ? 'Dashboard' : 'Irányítópult'}
                    </a>
                ) : (
                    <a
                        href="/login"
                        className="btn btn-gold"
                        aria-current={currentPath === '/login' ? 'page' : undefined}
                    >
                        {isEn ? 'Log in' : 'Bejelentkezés'}
                    </a>
                )}
            </nav>
        </header>
    );
}
