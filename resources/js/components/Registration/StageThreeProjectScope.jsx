import React from 'react';

/**
 * StageThreeProjectScope Component.
 *
 * Reference: CR-03 Section 4.3 - Stage 3 (Project Scope Context):
 * "Collect development goals, investment scale, and historical de minimis allocations per evaluation."
 *
 * Helps calculate the Fundor Score, project feasibility, and de minimis subsidy headroom.
 *
 * @param {Object} props
 */
export default function StageThreeProjectScope({
    formData,
    onChange,
}) {
    const goalsList = [
        { id: 'digitalization', label: '💻 Digitalizáció és szoftverfejlesztés', desc: 'Vállalatirányítási rendszerek, automatizáció' },
        { id: 'machinery', label: '⚙️ Eszközbeszerzés és kapacitásbővítés', desc: 'Új gépek, modern gyártósorok telepítése' },
        { id: 'green', label: '☀️ Megújuló energia és zöld átállás', desc: 'Napelem, hőszivattyú, épületenergetika' },
        { id: 'innovation', label: '🔬 Kutatás-fejlesztés (K+F)', desc: 'Új termékek, prototípusok, szabadalmak' },
        { id: 'export', label: '🌍 Nemzetközi piacra lépés', desc: 'Külföldi kiállítások, exportfejlesztés' },
    ];

    const toggleGoal = (goalId) => {
        const current = formData.goals || [];
        const updated = current.includes(goalId)
            ? current.filter((g) => g !== goalId)
            : [...current, goalId];
        onChange('goals', updated);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>
                    3. Lépés: Tervezett Fejlesztési Célok és Projekt Kontextus
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
                    Ezek alapján állítja össze a Fundor algoritmus a testreszabott pályázati listát és a Fundor Score pontszámot.
                </p>
            </div>

            {/* Development Goals Selection */}
            <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '8px' }}>
                    Milyen területen tervez beruházást? (Válasszon legalább egyet) <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {goalsList.map((g) => {
                        const isSelected = (formData.goals || []).includes(g.id);
                        return (
                            <div
                                key={g.id}
                                onClick={() => toggleGoal(g.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--line-strong)',
                                    background: isSelected ? 'var(--gold-soft, rgba(217, 154, 43, 0.08))' : 'var(--paper)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by parent div click
                                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                                />
                                <div>
                                    <strong style={{ fontSize: '13.5px', color: 'var(--ink)', display: 'block' }}>{g.label}</strong>
                                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{g.desc}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Planned Investment Scale (HUF) */}
            <div>
                <label htmlFor="proj-budget" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                    Tervezett Teljes Beruházási Költségvetés (HUF) <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <input
                    id="proj-budget"
                    type="number"
                    min="1000000"
                    step="1000000"
                    required
                    value={formData.investment_scale ?? 30000000}
                    onChange={(e) => onChange('investment_scale', parseFloat(e.target.value) || 0)}
                    placeholder="pl. 30000000"
                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                    Ebből a rendszer kiszámítja a várható támogatási összeget (Intenzitás × Beruházási összeg).
                </span>
            </div>

            {/* De Minimis Subsidy Allocation in Past 3 Years */}
            <div>
                <label htmlFor="proj-deminimis" style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '6px' }}>
                    Az elmúlt 3 pénzügyi évben igénybe vett Csekély Összegű (De Minimis) Támogatás (EUR)
                </label>
                <input
                    id="proj-deminimis"
                    type="number"
                    min="0"
                    max="300000"
                    value={formData.de_minimis_allocation ?? 0}
                    onChange={(e) => onChange('de_minimis_allocation', parseFloat(e.target.value) || 0)}
                    placeholder="pl. 0"
                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px', fontSize: '14px' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                    Az uniós de minimis felső határ 3 év alatt 300 000 EUR. A rendszer ellenőrzi a keretösszeg túllépést.
                </span>
            </div>
        </div>
    );
}
