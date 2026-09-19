import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * AdminCrmPage React component.
 * Lead & contact sales pipeline board with stage management and CSV export.
 */
export default function AdminCrmPage({
    groupedLeads = {},
    csrfToken = '',
}) {
    const stages = [
        { key: 'lead', name: 'Új Érdeklődő', color: 'var(--blue)' },
        { key: 'contacted', name: 'Felvéve a kapcsolat', color: 'var(--amber)' },
        { key: 'qualified', name: 'Minősített Lead', color: 'var(--gold)' },
        { key: 'converted', name: 'Konvertált Ügyfél', color: 'var(--green)' },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', marginBottom: '4px', color: 'var(--ink)' }}>
                        CRM Értékesítési Pipeline
                    </h1>
                    <p style={{ color: 'var(--muted)', margin: 0 }}>
                        Az ingyenes felmérésből és regisztrációkból érkező érdeklődők követése.
                    </p>
                </div>
                <Button href="/admin/crm/export" variant="ghost" style={{ fontSize: '13.5px' }}>
                    📥 Exportálás CSV formátumban
                </Button>
            </div>

            {/* Pipeline Stages Board */}
            <div className="grid grid-cols-4" style={{ alignItems: 'flex-start', gap: '16px' }}>
                {stages.map((stage) => {
                    const stageLeads = groupedLeads[stage.key] || [];

                    return (
                        <div
                            key={stage.key}
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--line)',
                                borderRadius: 'var(--radius)',
                                padding: '16px',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '14px',
                                borderBottom: `2px solid ${stage.color}`,
                                paddingBottom: '8px',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                                    {stage.name}
                                </span>
                                <Badge variant="slate" style={{ fontSize: '11px' }}>
                                    {stageLeads.length}
                                </Badge>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stageLeads.length > 0 ? (
                                    stageLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            style={{
                                                background: 'var(--paper)',
                                                border: '1px solid var(--line)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', color: 'var(--ink)' }}>
                                                {lead.company || lead.contact_name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                                                {lead.email}
                                            </div>

                                            {lead.readiness_score && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <Badge variant="gold" style={{ fontSize: '10px' }}>
                                                        Score: {lead.readiness_score}
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Stage Changer Form */}
                                            <form action={`/admin/crm/leads/${lead.id}/stage`} method="POST" style={{ marginTop: '8px' }}>
                                                <input type="hidden" name="_token" value={csrfToken} />
                                                <input type="hidden" name="_method" value="PATCH" />
                                                <select
                                                    name="stage"
                                                    defaultValue={lead.stage}
                                                    onChange={(e) => e.target.form.submit()}
                                                    style={{
                                                        width: '100%',
                                                        fontSize: '11.5px',
                                                        padding: '4px 6px',
                                                        border: '1px solid var(--line-strong)',
                                                        borderRadius: '6px',
                                                        background: 'var(--surface)',
                                                    }}
                                                >
                                                    <option value="lead">Új Érdeklődő</option>
                                                    <option value="contacted">Kapcsolatfelvétel</option>
                                                    <option value="qualified">Minősített</option>
                                                    <option value="converted">Konvertált</option>
                                                    <option value="dormant">Inaktív</option>
                                                </select>
                                            </form>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '12px', color: 'var(--muted-2)', textAlign: 'center', padding: '20px 0' }}>
                                        Nincs lead ebben a fázisban.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
