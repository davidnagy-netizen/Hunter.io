import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * AdminDashboardPage React component.
 * Administrative health metrics, user signups, and lead pipeline overview.
 */
export default function AdminDashboardPage({
    stats = {
        totalUsers: 0,
        activeSubscriptions: 0,
        totalOpportunities: 0,
        openOpportunities: 0,
        totalLeads: 0,
    },
    recentUsers = [],
    recentLeads = [],
}) {
    return (
        <div>
            {/* System Metrics */}
            <div className="grid grid-cols-4" style={{ marginBottom: '24px', gap: '16px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        Regisztrált Felhasználók
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                        {stats.totalUsers}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        Aktív Előfizetések
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--green)', marginTop: '4px' }}>
                        {stats.activeSubscriptions}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        Pályázati Katalógus (Nyitott)
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--gold-deep)', marginTop: '4px' }}>
                        {stats.openOpportunities} / {stats.totalOpportunities}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        CRM Érdeklődők (Leads)
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--blue)', marginTop: '4px' }}>
                        {stats.totalLeads}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '20px' }}>
                {/* Recent Users */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--ink)' }}>
                            Legutóbbi Regisztrációk
                        </h3>
                        <Button href="/admin/users" variant="ghost" style={{ fontSize: '12.5px', padding: '4px 10px' }}>
                            Összes
                        </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentUsers && recentUsers.length > 0 ? (
                            recentUsers.map((u) => (
                                <div
                                    key={u.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 14px',
                                        background: 'var(--paper)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                                            {u.name} ({u.username})
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                            {u.company || 'Nincs megadva cég'} • {u.email}
                                        </div>
                                    </div>
                                    <Badge variant={u.role === 'admin' ? 'amber' : 'slate'} style={{ fontSize: '11px' }}>
                                        {u.role}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px' }}>
                                Nincsenek friss regisztrációk.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--ink)' }}>
                            Legfrissebb Érdeklődők (Leads)
                        </h3>
                        <Button href="/admin/crm" variant="ghost" style={{ fontSize: '12.5px', padding: '4px 10px' }}>
                            CRM Board
                        </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentLeads && recentLeads.length > 0 ? (
                            recentLeads.map((l) => (
                                <div
                                    key={l.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 14px',
                                        background: 'var(--paper)',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                                            {l.company || l.contact_name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                            {l.email} • Pontszám: {l.readiness_score ?? 'N/A'}
                                        </div>
                                    </div>
                                    <Badge variant="gold" style={{ fontSize: '11px' }}>
                                        {l.stage}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px' }}>
                                Nincsenek friss érdeklődők.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
