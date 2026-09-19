import React, { useState } from 'react';
import Button from '../components/Button';

/**
 * OnboardingPage React component.
 * Configures the company funding profile used for deterministic rule-matching and Fundor Score calculation.
 * Fully supports Hungarian and English localization.
 */
export default function OnboardingPage({
    existingProfile = null,
    csrfToken = '',
    oldInput = {},
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';
    const defaultGoals = existingProfile?.goals || ['digitalization', 'it', 'machinery'];
    const [selectedGoals, setSelectedGoals] = useState(
        Array.isArray(oldInput.goals) ? oldInput.goals : defaultGoals
    );

    const toggleGoal = (goal) => {
        setSelectedGoals((prev) =>
            prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
        );
    };

    const t = {
        title: isEn ? 'Structured Company Profile' : 'Strukturált Cégprofil',
        desc: isEn
            ? 'The deterministic rules engine uses this data to filter grant calls automatically and calculate your Fundor Score (0–100).'
            : 'Ezeket az adatokat használja a determinisztikus szabályrendszer a pályázatok automatikus szűrésére és a Fundor Score (0–100) kiszámítására.',
        companyName: isEn ? 'Company Name' : 'Cégnév',
        employees: isEn ? 'Headcount (employees)' : 'Létszám (fő)',
        regionCode: isEn ? 'Region Code (NUTS-2)' : 'Régió kód (NUTS-2)',
        county: isEn ? 'County' : 'Vármegye',
        industryCategory: isEn ? 'Industry Classification' : 'Iparág kategória',
        teaorCode: isEn ? 'Primary TEÁOR Code' : 'Főtevékenység TEÁOR kód',
        revenueBand: isEn ? 'Annual Revenue Range' : 'Árbevétel sáv',
        closedYears: isEn ? 'Completed Financial Years' : 'Lezárt üzleti évek',
        investmentValue: isEn ? 'Planned Investment Value (HUF)' : 'Tervezett beruházás összege (Ft)',
        projectName: isEn ? 'Project Title' : 'Projekt megnevezése',
        goalsTitle: isEn ? 'Development Objectives (At least 1)' : 'Fejlesztési célok (Legalább 1)',
        saveBtn: isEn
            ? 'Save Profile & Recalculate Eligibility'
            : 'Profil Mentése és Alkalmasság Újraszámítása',
        regions: [
            { code: 'HU11', name: 'HU11 - Budapest' },
            { code: 'HU12', name: isEn ? 'HU12 - Pest county' : 'HU12 - Pest vármegye' },
            { code: 'HU21', name: isEn ? 'HU21 - Central Transdanubia' : 'HU21 - Közép-Dunántúl' },
            { code: 'HU22', name: isEn ? 'HU22 - Western Transdanubia' : 'HU22 - Nyugat-Dunántúl' },
            { code: 'HU31', name: isEn ? 'HU31 - Northern Hungary' : 'HU31 - Észak-Magyarország' },
            { code: 'HU32', name: isEn ? 'HU32 - Northern Great Plain' : 'HU32 - Észak-Alföld' },
        ],
        industries: [
            { id: 'manuf', name: isEn ? 'Manufacturing / Industrial' : 'Gyártás / feldolgozóipar' },
            { id: 'it', name: isEn ? 'IT / Software / Digital' : 'IT / Szoftver / Digitális' },
            { id: 'logistics', name: isEn ? 'Logistics / Transport' : 'Logisztika / szállítás' },
            { id: 'trade', name: isEn ? 'Wholesale & Retail Trade' : 'Kereskedelem' },
            { id: 'agri', name: isEn ? 'Agriculture & Food Processing' : 'Mezőgazdaság / élelmiszer' },
        ],
        goals: [
            { value: 'digitalization', label: isEn ? 'Digitalization' : 'Digitalizáció' },
            { value: 'it', label: isEn ? 'IT Development' : 'IT fejlesztés' },
            { value: 'ai', label: isEn ? 'Artificial Intelligence' : 'Mesterséges intelligencia' },
            { value: 'machinery', label: isEn ? 'Machinery & Equipment' : 'Gép- / eszközbeszerzés' },
            { value: 'energy', label: isEn ? 'Energy Efficiency' : 'Energetika' },
        ],
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card">
                <h1 style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--ink)' }}>
                    {t.title}
                </h1>
                <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '14.5px' }}>
                    {t.desc}
                </p>

                <form action="/onboarding" method="POST">
                    <input type="hidden" name="_token" value={csrfToken} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Company Name & Basic Identity */}
                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="company_name" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.companyName}
                                </label>
                                <input
                                    id="company_name"
                                    type="text"
                                    name="company_name"
                                    required
                                    defaultValue={oldInput.company_name || existingProfile?.company_name || 'Alfa Gyártó Kft.'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="employees" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.employees}
                                </label>
                                <input
                                    id="employees"
                                    type="number"
                                    name="employees"
                                    required
                                    min="1"
                                    defaultValue={oldInput.employees || existingProfile?.employees || 28}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        {/* Region & County */}
                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="region_code" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.regionCode}
                                </label>
                                <select
                                    id="region_code"
                                    name="region_code"
                                    required
                                    defaultValue={oldInput.region_code || existingProfile?.region_code || 'HU12'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                >
                                    {t.regions.map((reg) => (
                                        <option key={reg.code} value={reg.code}>
                                            {reg.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="county" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.county}
                                </label>
                                <input
                                    id="county"
                                    type="text"
                                    name="county"
                                    required
                                    defaultValue={oldInput.county || existingProfile?.county || 'Pest'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        {/* Industry & TEÁOR */}
                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="industry_id" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.industryCategory}
                                </label>
                                <select
                                    id="industry_id"
                                    name="industry_id"
                                    required
                                    defaultValue={oldInput.industry_id || existingProfile?.industry_id || 'manuf'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                >
                                    {t.industries.map((ind) => (
                                        <option key={ind.id} value={ind.id}>
                                            {ind.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="teaor_code" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.teaorCode}
                                </label>
                                <input
                                    id="teaor_code"
                                    type="text"
                                    name="teaor_code"
                                    required
                                    defaultValue={oldInput.teaor_code || existingProfile?.teaor_code || '28'}
                                    placeholder="Pl. 28"
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        {/* Financial Fundamentals */}
                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="revenue_band" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.revenueBand}
                                </label>
                                <input
                                    id="revenue_band"
                                    type="text"
                                    name="revenue_band"
                                    required
                                    defaultValue={oldInput.revenue_band || existingProfile?.revenue_band || '500 M–1 Mrd Ft'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="closed_business_years" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.closedYears}
                                </label>
                                <input
                                    id="closed_business_years"
                                    type="number"
                                    name="closed_business_years"
                                    required
                                    min="0"
                                    defaultValue={oldInput.closed_business_years || existingProfile?.closed_business_years || 4}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        {/* Development Investment & Target */}
                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="planned_investment_value" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.investmentValue}
                                </label>
                                <input
                                    id="planned_investment_value"
                                    type="number"
                                    name="planned_investment_value"
                                    required
                                    min="0"
                                    step="100000"
                                    defaultValue={oldInput.planned_investment_value || existingProfile?.planned_investment_value || 30000000}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="project_name" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    {t.projectName}
                                </label>
                                <input
                                    id="project_name"
                                    type="text"
                                    name="project_name"
                                    defaultValue={oldInput.project_name || existingProfile?.project_name || (isEn ? 'ERP & production workflow development' : 'ERP és gyártásvezérlő fejlesztés')}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        {/* Development Goals */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                {t.goalsTitle}
                            </label>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                {t.goals.map((goal) => (
                                    <label key={goal.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="goals[]"
                                            value={goal.value}
                                            checked={selectedGoals.includes(goal.value)}
                                            onChange={() => toggleGoal(goal.value)}
                                        />
                                        <span>{goal.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <Button type="submit" variant="gold" style={{ padding: '12px 28px' }}>
                                {t.saveBtn}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
