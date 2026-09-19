import React, { useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * OpportunitiesIndexPage React component.
 * Catalog search, program filter, and paginated grant list.
 */
export default function OpportunitiesIndexPage({
    opportunities = [],
    pagination = null,
    searchQuery = '',
    selectedProgram = '',
    csrfToken = '',
}) {
    const [q, setQ] = useState(searchQuery);
    const [program, setProgram] = useState(selectedProgram);

    // If opportunities is a Laravel paginator object, items are under opportunities.data
    const items = Array.isArray(opportunities)
        ? opportunities
        : (opportunities?.data || []);

    return (
        <div>
            {/* Filter Bar */}
            <div className="card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
                <form action="/opportunities" method="GET" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <input
                            type="text"
                            name="q"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Keresés kulcsszóra, kódra vagy felhívás címre..."
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid var(--line-strong)',
                                borderRadius: '8px',
                            }}
                        />
                    </div>
                    <div>
                        <select
                            name="program"
                            value={program}
                            onChange={(e) => setProgram(e.target.value)}
                            style={{
                                padding: '10px 14px',
                                border: '1px solid var(--line-strong)',
                                borderRadius: '8px',
                            }}
                        >
                            <option value="">Minden programcsalád</option>
                            <option value="GINOP Plusz">GINOP Plusz</option>
                            <option value="KEHOP Plusz">KEHOP Plusz</option>
                            <option value="DIMOP Plusz">DIMOP Plusz</option>
                            <option value="Széchenyi Terv Plusz">Széchenyi Terv Plusz</option>
                        </select>
                    </div>
                    <Button type="submit" variant="dark" style={{ padding: '10px 18px' }}>
                        Szűrés
                    </Button>
                    {(q || program) && (
                        <Button href="/opportunities" variant="ghost" style={{ padding: '10px 14px' }}>
                            Törlés
                        </Button>
                    )}
                </form>
            </div>

            {/* Opportunity Listings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {items && items.length > 0 ? (
                    items.map((opp) => {
                        const daysRemaining = opp.deadline
                            ? Math.ceil((new Date(opp.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                            : 0;

                        return (
                            <div
                                key={opp.id}
                                className="card"
                                style={{
                                    marginBottom: 0,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '20px',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                        <Badge variant="gold">{opp.program}</Badge>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>
                                            {opp.code}
                                        </span>
                                        <Badge variant={daysRemaining <= 14 ? 'amber' : 'slate'}>
                                            {opp.deadline ? new Date(opp.deadline).toLocaleDateString('hu-HU') : 'Közelgő'} ({daysRemaining} nap)
                                        </Badge>
                                    </div>
                                    <h3 style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--ink)' }}>
                                        {opp.title}
                                    </h3>
                                    <div style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
                                        Keret: {Math.round(opp.funding_min / 1000000)}–{Math.round(opp.funding_max / 1000000)} M Ft • Támogatási intenzitás: {Math.round(opp.intensity * 100)}%
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <form action={`/favorites/${opp.id}/toggle`} method="POST">
                                        <input type="hidden" name="_token" value={csrfToken} />
                                        <button type="submit" className="btn btn-ghost" style={{ padding: '9px 12px', fontSize: '13px' }}>
                                            ⭐
                                        </button>
                                    </form>
                                    <Button href={`/opportunities/${opp.code}`} variant="gold" style={{ fontSize: '13.5px' }}>
                                        Megnyitás & Pontozás
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                        A keresési feltételeknek megfelelő pályázati lehetőség nem található.
                    </div>
                )}
            </div>
        </div>
    );
}
