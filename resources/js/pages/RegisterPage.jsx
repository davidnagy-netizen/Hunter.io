import React from 'react';
import Button from '../components/Button';

/**
 * RegisterPage React component.
 * Company account registration form with responsive input grid.
 */
export default function RegisterPage({
    csrfToken = '',
    oldInput = {},
}) {
    return (
        <div style={{ maxWidth: '480px', margin: '50px auto', padding: '0 20px' }}>
            <div className="card" style={{ padding: '36px 32px' }}>
                <h1 style={{ fontSize: '24px', marginBottom: '8px', textAlign: 'center', color: 'var(--ink)' }}>
                    Regisztráció
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                    Hozza létre cége fiókját a pályázatfigyelő elindításához.
                </p>

                <form action="/register" method="POST">
                    <input type="hidden" name="_token" value={csrfToken} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label htmlFor="register-name" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                Teljes Név
                            </label>
                            <input
                                id="register-name"
                                type="text"
                                name="name"
                                required
                                defaultValue={oldInput.name || ''}
                                placeholder="Kovács Péter"
                                style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-company" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                Vállalkozás Neve
                            </label>
                            <input
                                id="register-company"
                                type="text"
                                name="company"
                                defaultValue={oldInput.company || ''}
                                placeholder="Alfa Gyártó Kft."
                                style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-username" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                Felhasználónév
                            </label>
                            <input
                                id="register-username"
                                type="text"
                                name="username"
                                required
                                defaultValue={oldInput.username || ''}
                                placeholder="kovacspeter"
                                style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-email" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                Email Cím
                            </label>
                            <input
                                id="register-email"
                                type="email"
                                name="email"
                                required
                                defaultValue={oldInput.email || ''}
                                placeholder="peter@alfagyarto.hu"
                                style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                            />
                        </div>

                        <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                            <div>
                                <label htmlFor="register-password" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                    Jelszó
                                </label>
                                <input
                                    id="register-password"
                                    type="password"
                                    name="password"
                                    required
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="register-password-conf" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                    Jelszó újra
                                </label>
                                <input
                                    id="register-password-conf"
                                    type="password"
                                    name="password_confirmation"
                                    required
                                    style={{ width: '100%', padding: '11px', border: '1px solid var(--line-strong)', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="gold"
                            style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '8px' }}
                        >
                            Fiók Létrehozása
                        </Button>
                    </div>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13.5px', color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                    Már rendelkezik fiókkal?{' '}
                    <a href="/login" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                        Jelentkezzen be
                    </a>
                </div>
            </div>
        </div>
    );
}
