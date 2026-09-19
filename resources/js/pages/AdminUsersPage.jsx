import React from 'react';
import Badge from '../components/Badge';

/**
 * AdminUsersPage React component.
 * User account directory with profile details, role indicators, and login timestamps.
 */
export default function AdminUsersPage({
    users = [],
}) {
    const userList = Array.isArray(users) ? users : (users?.data || []);

    return (
        <div className="card">
            <h1 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--ink)' }}>
                Regisztrált Felhasználók
            </h1>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>Név & Felhasználónév</th>
                            <th style={{ padding: '10px' }}>Cégnév</th>
                            <th style={{ padding: '10px' }}>Email</th>
                            <th style={{ padding: '10px' }}>Szerepkör</th>
                            <th style={{ padding: '10px' }}>Utolsó belépés</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userList && userList.length > 0 ? (
                            userList.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--line)' }}>
                                    <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>
                                        #{user.id}
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <strong style={{ color: 'var(--ink)' }}>{user.name}</strong>
                                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.username}</div>
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                        {user.companyProfile?.company_name || user.company || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <Badge variant={user.role === 'admin' ? 'amber' : 'slate'}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '12px 10px', fontSize: '12.5px', color: 'var(--muted)' }}>
                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString('hu-HU') : 'Még nem lépett be'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                                    Nincsenek felhasználók a rendszerben.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
