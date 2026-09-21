import React from 'react';

/**
 * StageTwoCompanyProfile Component.
 *
 * Reference: CR-03 Section 4.3 - Stage 2 (Company Profile):
 * "Collect headcount, revenue band (plus optional exact revenue), sector code,
 * registered county/location, closed business years, and legal form."
 *
 * Statutory Standards:
 * - Sector Classification: TEÁOR'25 4-digit codes.
 * - Revenue Banding: 6 statutory SME bands (Act XXXIV of 2004 / EU SME definition).
 *
 * @param {Object} props
 */
export default function StageTwoCompanyProfile({
    formData,
    onChange,
}) {
    // Statutory SME Revenue Bands per Act XXXIV of 2004
    const revenueBands = [
        { id: 1, label: '1. Sáv: 50 millió Ft alatt (Mikrovállalkozás)' },
        { id: 2, label: '2. Sáv: 50M – 200M Ft (Mikrovállalkozás)' },
        { id: 3, label: '3. Sáv: 200M – 800M Ft (Mikro / Kisvállalkozási határ)' },
        { id: 4, label: '4. Sáv: 800M – 4,000M Ft (Kisvállalkozás)' },
        { id: 5, label: '5. Sáv: 4,000M – 20,000M Ft (Középvállalkozás)' },
        { id: 6, label: '6. Sáv: 20,000M Ft felett (Nagyvállalat — nem KKV)' },
    ];

    // Standard TEÁOR'25 Classifications
    const teaor25Sectors = [
        { code: '6201', label: '6201 - Számítógépes programozás' },
        { code: '2562', label: '2562 - Fémmegmunkálás, gépipar' },
        { code: '1071', label: '1071 - Pékáru, élelmiszergyártás' },
        { code: '4120', label: '4120 - Lakó- és nem lakó épület építése' },
        { code: '4690', label: '4690 - Nem szakosodott nagykereskedelem' },
        { code: '7022', label: '7022 - Üzletviteli, vezetési tanácsadás' },
        { code: '8621', label: '8621 - Általános orvosi ellátás, egészségügy' },
        { code: '7219', label: '7219 - Egyéb természettudományi K+F kutatás' },
        { code: '0000', label: 'Egyéb gazdasági ágazat' },
    ];

    const counties = [
        'Budapest', 'Pest', 'Bács-Kiskun', 'Baranya', 'Békés', 'Borsod-Abaúj-Zemplén',
        'Csongrád-Csanád', 'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves',
        'Jász-Nagykun-Szolnok', 'Komárom-Esztergom', 'Nógrád', 'Somogy',
        'Szabolcs-Szatmár-Bereg', 'Tolna', 'Vas', 'Veszprém', 'Zala'
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>
                    2. Lépés: Vállalati Profil és Gazdasági Paraméterek
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
                    A pályázati jogosultsági feltételek és KKV kategória pontos meghatározásához.
                </p>
            </div>

            {/* Headcount & Legal Form Grid */}
            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
                <div>
                    <label htmlFor="prof-headcount" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                        Foglalkoztatotti Létszám (fő) <span style={{ color: 'var(--rose)' }}>*</span>
                    </label>
                    <input
                        id="prof-headcount"
                        type="number"
                        min="0"
                        max="10000"
                        required
                        value={formData.employees ?? ''}
                        onChange={(e) => onChange('employees', parseInt(e.target.value, 10) || 0)}
                        placeholder="pl. 15"
                        style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label htmlFor="prof-legal-form" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                        Társasági Forma <span style={{ color: 'var(--rose)' }}>*</span>
                    </label>
                    <select
                        id="prof-legal-form"
                        required
                        value={formData.legal_form || 'kft'}
                        onChange={(e) => onChange('legal_form', e.target.value)}
                        style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px', background: 'var(--card)' }}
                    >
                        <option value="kft">Korlátolt Felelősségű Társaság (Kft.)</option>
                        <option value="zrt">Zártkörűen Működő Részvénytársaság (Zrt.)</option>
                        <option value="bt">Betéti Társaság (Bt.)</option>
                        <option value="ev">Egyéni Vállalkozó (EV)</option>
                    </select>
                </div>
            </div>

            {/* Sector: TEÁOR'25 Code */}
            <div>
                <label htmlFor="prof-teaor" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                    Főtevékenység Gazdasági Ágazata (TEÁOR'25) <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <select
                    id="prof-teaor"
                    required
                    value={formData.sector_code || '6201'}
                    onChange={(e) => onChange('sector_code', e.target.value)}
                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px', background: 'var(--card)' }}
                >
                    {teaor25Sectors.map((sector) => (
                        <option key={sector.code} value={sector.code}>
                            {sector.label}
                        </option>
                    ))}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                    A rendszer a TEÁOR'25 kód alapján ellenőrzi az iparági kizárásokat és preferenciákat.
                </span>
            </div>

            {/* Revenue Band Selection (Statutory 6 Bands) */}
            <div>
                <label htmlFor="prof-rev-band" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                    Éves Árbevétel Kategória (2004. évi XXXIV. tv. szerinti KKV sávok) <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <select
                    id="prof-rev-band"
                    required
                    value={formData.revenue_band || 2}
                    onChange={(e) => onChange('revenue_band', parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px', background: 'var(--card)' }}
                >
                    {revenueBands.map((band) => (
                        <option key={band.id} value={band.id}>
                            {band.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Optional Exact Revenue & Closed Years */}
            <div className="grid grid-cols-2" style={{ gap: '14px' }}>
                <div>
                    <label htmlFor="prof-exact-revenue" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                        Pontos Éves Árbevétel (HUF) <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--muted)' }}>(opcionális)</span>
                    </label>
                    <input
                        id="prof-exact-revenue"
                        type="number"
                        min="0"
                        value={formData.exact_revenue ?? ''}
                        onChange={(e) => onChange('exact_revenue', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="pl. 125000000"
                        style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label htmlFor="prof-closed-years" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                        Lezárt Teljes Üzleti Évek <span style={{ color: 'var(--rose)' }}>*</span>
                    </label>
                    <input
                        id="prof-closed-years"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={formData.closed_business_years ?? 3}
                        onChange={(e) => onChange('closed_business_years', parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                    />
                </div>
            </div>

            {/* Registered County */}
            <div>
                <label htmlFor="prof-county" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                    Székhely Vármegye / Település <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <select
                    id="prof-county"
                    required
                    value={formData.county || 'Budapest'}
                    onChange={(e) => onChange('county', e.target.value)}
                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px', background: 'var(--card)' }}
                >
                    {counties.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
