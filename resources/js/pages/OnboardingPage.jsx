import React, { useState } from 'react';
import Button from '../components/Button';

/**
 * OnboardingPage React component.
 * Configures the company funding profile used for deterministic rule-matching and Fundor Score calculation.
 */
export default function OnboardingPage({
    existingProfile = null,
    csrfToken = '',
    oldInput = {},
}) {
    const defaultGoals = existingProfile?.goals || ['digitalization', 'it', 'machinery'];
    const [selectedGoals, setSelectedGoals] = useState(
        Array.isArray(oldInput.goals) ? oldInput.goals : defaultGoals
    );

    const toggleGoal = (goal) => {
        setSelectedGoals((prev) =>
            prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
        );
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card">
                <h1 style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--ink)' }}>
                    Strukturált Cégprofil
                </h1>
                <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '14.5px' }}>
                    Ezeket az adatokat használja a determinisztikus szabályrendszer a pályázatok automatikus szűrésére és a Fundor Score (0–100) kiszámítására.
                </p>

                <form action="/onboarding" method="POST">
                    <input type="hidden" name="_token" value={csrfToken} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Company Name & Basic Identity */}
                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="company_name" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Cégnév
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
                                    Létszám (fő)
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
                                    Régió kód (NUTS-2)
                                </label>
                                <select
                                    id="region_code"
                                    name="region_code"
                                    required
                                    defaultValue={oldInput.region_code || existingProfile?.region_code || 'HU12'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                >
                                    <option value="HU11">HU11 - Budapest</option>
                                    <option value="HU12">HU12 - Pest vármegye</option>
                                    <option value="HU21">HU21 - Közép-Dunántúl</option>
                                    <option value="HU22">HU22 - Nyugat-Dunántúl</option>
                                    <option value="HU31">HU31 - Észak-Magyarország</option>
                                    <option value="HU32">HU32 - Észak-Alföld</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="county" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Vármegye
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
                                    Iparág kategória
                                </label>
                                <select
                                    id="industry_id"
                                    name="industry_id"
                                    required
                                    defaultValue={oldInput.industry_id || existingProfile?.industry_id || 'manuf'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                >
                                    <option value="manuf">Gyártás / feldolgozóipar</option>
                                    <option value="it">IT / Szoftver / Digitális</option>
                                    <option value="logistics">Logisztika / szállítás</option>
                                    <option value="trade">Kereskedelem</option>
                                    <option value="agri">Mezőgazdaság / élelmiszer</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="teaor_code" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Főtevékenység TEÁOR kód
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
                                    Árbevétel sáv
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
                                    Lezárt üzleti évek
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
                                    Tervezett beruházás összege (Ft)
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
                                    Projekt megnevezése
                                </label>
                                <input
                                    id="project_name"
                                    type="text"
                                    name="project_name"
                                    defaultValue={oldInput.project_name || existingProfile?.project_name || 'ERP és gyártásvezérlő fejlesztés'}
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        {/* Development Goals */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                Fejlesztési célok (Legalább 1)
                            </label>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                {[
                                    { value: 'digitalization', label: 'Digitalizáció' },
                                    { value: 'it', label: 'IT fejlesztés' },
                                    { value: 'ai', label: 'Mesterséges intelligencia' },
                                    { value: 'machinery', label: 'Gép- / eszközbeszerzés' },
                                    { value: 'energy', label: 'Energetika' },
                                ].map((goal) => (
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
                                Profil Mentése és Alkalmasság Újraszámítása
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
