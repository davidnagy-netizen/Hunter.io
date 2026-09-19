import React, { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Public and authenticated navigation rail/header with route awareness.
 */
export default function Navbar({
    user = null,
    currentPath = '/',
    currentLocale = 'hu',
    csrfToken = '',
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="public-header">
            <div className="public-header-brand">
                <a href="/">Fundor.hu</a>
                <span className="logo-badge">INTELLIGENCIA</span>
            </div>

            {/* Desktop Actions */}
            <nav className="public-header-actions" aria-label="Fő navigáció">
                <LanguageSwitcher currentLocale={currentLocale} />
                <a
                    href="/assessment"
                    className="btn btn-ghost"
                    aria-current={currentPath === '/assessment' ? 'page' : undefined}
                >
                    Ingyenes Felmérés
                </a>
                {user ? (
                    <a href="/dashboard" className="btn btn-gold">
                        Irányítópult
                    </a>
                ) : (
                    <a
                        href="/login"
                        className="btn btn-gold"
                        aria-current={currentPath === '/login' ? 'page' : undefined}
                    >
                        Bejelentkezés
                    </a>
                )}
            </nav>
        </header>
    );
}
