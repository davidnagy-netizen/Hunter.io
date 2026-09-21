import React from 'react';

/**
 * StageOneAccount Component.
 *
 * Reference: CR-03 Section 4.3 - Stage 1 (Sign-Up):
 * "Only collect Email, Password, and Tax Number (adószám). Auto-fetch official company
 * name and seat address via NAV API and display them as read-only confirmation."
 *
 * GDPR Rules:
 * - Terms of Service and Privacy Notice must use two independent, non-pre-ticked checkboxes.
 * - Direct marketing requires a separate explicit opt-in checkbox (GDPR Art. 6(1)(a)).
 *
 * @param {Object} props
 */
export default function StageOneAccount({
    formData,
    onChange,
    taxpayerData,
    taxpayerStatus,
    taxpayerError,
    onTaxNumberBlur,
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>
                    1. Lépés: Fiókadatok és Hivatalos NAV Azonosítás
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
                    Adja meg adószámát a cégadatok hivatalos lekérdezéséhez és fiókja biztonságos létrehozásához.
                </p>
            </div>

            {/* Email Field */}
            <div>
                <label htmlFor="reg-email" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                    Kapcsolattartó Email Címe <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <input
                    id="reg-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => onChange('email', e.target.value)}
                    placeholder="ugyvezeto@vallalkozas.hu"
                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                />
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                <div>
                    <label htmlFor="reg-password" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                        Jelszó <span style={{ color: 'var(--rose)' }}>*</span>
                    </label>
                    <input
                        id="reg-password"
                        type="password"
                        name="password"
                        required
                        value={formData.password || ''}
                        onChange={(e) => onChange('password', e.target.value)}
                        placeholder="Legalább 8 karakter"
                        style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                    />
                </div>
                <div>
                    <label htmlFor="reg-password-conf" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                        Jelszó Megerősítése <span style={{ color: 'var(--rose)' }}>*</span>
                    </label>
                    <input
                        id="reg-password-conf"
                        type="password"
                        name="password_confirmation"
                        required
                        value={formData.password_confirmation || ''}
                        onChange={(e) => onChange('password_confirmation', e.target.value)}
                        placeholder="Jelszó újra"
                        style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                    />
                </div>
            </div>

            {/* Tax Number Field with NAV Auto-Lookup */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="reg-tax-number" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                        Magyar Adószám (8 vagy 11 számjegy) <span style={{ color: 'var(--rose)' }}>*</span>
                    </label>
                    {taxpayerStatus === 'loading' && (
                        <span style={{ fontSize: '12px', color: 'var(--gold-deep)', fontWeight: 600 }}>
                            ⏳ NAV lekérdezés folyamatban...
                        </span>
                    )}
                </div>
                <input
                    id="reg-tax-number"
                    type="text"
                    name="tax_number"
                    required
                    value={formData.tax_number || ''}
                    onChange={(e) => onChange('tax_number', e.target.value)}
                    onBlur={(e) => onTaxNumberBlur(e.target.value)}
                    placeholder="pl. 12345674 vagy 12345674-2-42"
                    style={{
                        width: '100%',
                        padding: '11px',
                        border: taxpayerError ? '1.5px solid var(--rose)' : '1px solid var(--line-strong)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                    }}
                />
                {taxpayerError && (
                    <p style={{ color: 'var(--rose)', fontSize: '12.5px', marginTop: '6px', fontWeight: 500 }}>
                        ⚠️ {taxpayerError}
                    </p>
                )}
            </div>

            {/* Read-Only Company Details (Fetched from NAV Online Invoice API) */}
            {taxpayerData && (
                <div style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--green)', fontSize: '16px' }}>✓</span>
                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
                            Hivatalos NAV Nyilvántartás Megerősítve (Read-Only)
                        </strong>
                    </div>

                    <div style={{ fontSize: '13.5px' }}>
                        <span style={{ color: 'var(--muted)', display: 'inline-block', width: '130px' }}>Hivatalos Cégnév:</span>
                        <strong style={{ color: 'var(--ink)' }}>{taxpayerData.companyName}</strong>
                    </div>

                    <div style={{ fontSize: '13.5px' }}>
                        <span style={{ color: 'var(--muted)', display: 'inline-block', width: '130px' }}>Székhely Cím:</span>
                        <span style={{ color: 'var(--ink)' }}>{taxpayerData.fullAddress}</span>
                    </div>

                    <div style={{ fontSize: '13.5px' }}>
                        <span style={{ color: 'var(--muted)', display: 'inline-block', width: '130px' }}>Adószám:</span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>{taxpayerData.taxNumber}</span>
                    </div>
                </div>
            )}

            {/* GDPR & Privacy Compliance Checkboxes (CR-03: Independent & Un-ticked by default) */}
            <div style={{
                background: 'var(--paper-subtle, #f9fafb)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '6px',
            }}>
                <strong style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '2px' }}>
                    Adatvédelmi és Jogi Nyilatkozatok (GDPR megfelelőség):
                </strong>

                {/* Terms of Service Checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ink)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        required
                        checked={formData.termsAccepted || false}
                        onChange={(e) => onChange('termsAccepted', e.target.checked)}
                        style={{ marginTop: '2px', accentColor: 'var(--gold)' }}
                    />
                    <span>
                        Elfogadom az <a href="/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>Általános Szerződési Feltételeket</a>. <span style={{ color: 'var(--rose)' }}>*</span>
                    </span>
                </label>

                {/* Privacy Notice Checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ink)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        required
                        checked={formData.privacyAccepted || false}
                        onChange={(e) => onChange('privacyAccepted', e.target.checked)}
                        style={{ marginTop: '2px', accentColor: 'var(--gold)' }}
                    />
                    <span>
                        Megismertem és elfogadom az <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>Adatkezelési Tájékoztatót</a>. <span style={{ color: 'var(--rose)' }}>*</span>
                    </span>
                </label>

                {/* Direct Marketing Opt-in Checkbox (Optional) */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.marketingConsent || false}
                        onChange={(e) => onChange('marketingConsent', e.target.checked)}
                        style={{ marginTop: '2px', accentColor: 'var(--gold)' }}
                    />
                    <span>
                        (Opcionális) Hozzájárulok releváns új pályázatokról és finanszírozási lehetőségekről szóló értesítők fogadásához (GDPR 6. cikk (1) a)).
                    </span>
                </label>
            </div>
        </div>
    );
}
