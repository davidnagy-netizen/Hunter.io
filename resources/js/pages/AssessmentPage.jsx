import React, { useState } from 'react';
import Button from '../components/Button';
import Badge from '../components/Badge';

/**
 * AssessmentPage React component.
 * Supports interactive form submission and result score presentation.
 */
export default function AssessmentPage({
    completed = false,
    readinessScore = 70,
    teaserOpportunities = [],
    csrfToken = '',
    oldInput = {},
    errors = {},
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (completed) {
        return (
            <div style={{ maxWidth: '760px', margin: '40px auto', padding: '0 20px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                    <Badge variant="green" style={{ fontSize: '14px', marginBottom: '16px' }}>
                        Felmérés Sikeresen Értékelve
                    </Badge>
                    <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--ink)' }}>
                        Az Ön Vállalati Készültségi Pontszáma
                    </h1>
                    <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '15px' }}>
                        A megadott cégadatok alapján a rendszer kiszámította a pályázati alkalmassági alapot.
                    </p>

                    <div style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        border: '8px solid var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px'
                    }}>
                        <span style={{ fontFamily: 'var(--display)', fontSize: '44px', fontWeight: 700, color: 'var(--ink)' }}>
                            {readinessScore}
                        </span>
                    </div>

                    <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--ink)' }}>
                        Előzetesen Releváns Pályázatok
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                        {teaserOpportunities && teaserOpportunities.length > 0 ? (
                            teaserOpportunities.map((opp, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '14px 20px',
                                        background: 'var(--paper)',
                                        borderRadius: 'var(--radius-sm)',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div>
                                        <Badge variant="gold" style={{ fontSize: '11px' }}>{opp.program}</Badge>
                                        <div style={{ fontWeight: 600, marginTop: '4px', color: 'var(--ink)' }}>{opp.title}</div>
                                    </div>
                                    <Badge variant="green">Lehetséges egyezés</Badge>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: 'var(--muted)', padding: '16px' }}>
                                A cégprofil alapján 3 kiemelt felhívás érhető el.
                            </div>
                        )}
                    </div>

                    <Button href="/register" variant="gold" style={{ fontSize: '16px', padding: '14px 28px' }}>
                        Teljes Cégprofil Elkészítése és Részletes Pontszámok
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '760px', margin: '40px auto', padding: '0 20px' }}>
            <div className="card" style={{ padding: '40px 32px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--ink)' }}>
                    KKV Pályázati Készültségi Felmérés
                </h1>
                <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '15px' }}>
                    Válaszoljon néhány alapkérdésre a vállalkozásáról, és azonnal megkapja az előzetes minősítést.
                </p>

                <form action="/assessment" method="POST" onSubmit={() => setIsSubmitting(true)}>
                    <input type="hidden" name="_token" value={csrfToken} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label htmlFor="company_name" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                Vállalkozás neve
                            </label>
                            <input
                                id="company_name"
                                type="text"
                                name="company_name"
                                required
                                defaultValue={oldInput.company_name || ''}
                                placeholder="Pl. Minta Kft."
                                style={{ width: '100%', padding: '12px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                            />
                        </div>

                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="email" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Kapcsolattartó Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    defaultValue={oldInput.email || ''}
                                    placeholder="iroda@mintakft.hu"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Telefonszám (opcionális)
                                </label>
                                <input
                                    id="phone"
                                    type="text"
                                    name="phone"
                                    defaultValue={oldInput.phone || ''}
                                    placeholder="+36 30 123 4567"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2">
                            <div>
                                <label htmlFor="employees" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Alkalmazotti létszám (fő)
                                </label>
                                <input
                                    id="employees"
                                    type="number"
                                    name="employees"
                                    required
                                    min="0"
                                    defaultValue={oldInput.employees || 10}
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="closed_years" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                    Lezárt üzleti évek száma
                                </label>
                                <input
                                    id="closed_years"
                                    type="number"
                                    name="closed_years"
                                    required
                                    min="0"
                                    defaultValue={oldInput.closed_years || 2}
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="revenue_band" style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                                Éves árbevétel sáv
                            </label>
                            <select
                                id="revenue_band"
                                name="revenue_band"
                                required
                                defaultValue={oldInput.revenue_band || '100–500 M Ft'}
                                style={{ width: '100%', padding: '12px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                            >
                                <option value="0–100 M Ft">0 - 100 M Ft</option>
                                <option value="100–500 M Ft">100 - 500 M Ft</option>
                                <option value="500 M–1 Mrd Ft">500 M - 1 Mrd Ft</option>
                                <option value="1–5 Mrd Ft">1 - 5 Mrd Ft</option>
                                <option value="5 Mrd Ft felett">5 Mrd Ft felett</option>
                            </select>
                        </div>

                        <Button
                            type="submit"
                            variant="gold"
                            disabled={isSubmitting}
                            style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px' }}
                        >
                            {isSubmitting ? 'Számítás folyamatban...' : 'Készültségi Pontszám Kiszámítása'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
