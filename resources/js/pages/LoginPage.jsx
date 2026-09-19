import React from 'react';

/**
 * LoginPage React component.
 * Editorial split-panel login architecture with hero visual and accessible form controls.
 */
export default function LoginPage({
    csrfToken = '',
    oldUsername = '',
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';

    const labels = {
        title: isEn ? 'Sign in' : 'Bejelentkezés',
        kicker: isEn ? 'Grant Intelligence' : 'Támogatási Intelligencia',
        intro: isEn
            ? 'Sign in to your Fundor.hu account to view personalized eligibility scores.'
            : 'Lépjen be a Fundor.hu fiókjába a személyre szabott pontozás megtekintéséhez.',
        username: isEn ? 'Username' : 'Felhasználónév',
        password: isEn ? 'Password' : 'Jelszó',
        remember: isEn ? 'Remember me' : 'Emlékezz rám',
        submit: isEn ? 'Sign in' : 'Bejelentkezés',
        noAccount: isEn ? "Don't have an account yet?" : 'Még nincs fiókod?',
        registerHere: isEn ? 'Register here' : 'Regisztrálj itt',
    };

    return (
        <section className="login-shell" aria-labelledby="login-heading">
            <aside className="login-visual">
                <img
                    src="/images/login-architecture.png"
                    alt=""
                    width="1024"
                    height="1536"
                    fetchPriority="high"
                />
                <div className="login-visual-content">
                    <span className="login-eyebrow">
                        {isEn ? 'Hungarian SME Grant Intelligence' : 'Magyar KKV Pályázati Intelligencia'}
                    </span>
                    <h2>
                        {isEn ? 'Stop searching for grants.' : 'Ne te keresd a pályázatot.'}
                        <br />
                        <span>{isEn ? 'Fundor finds them for you.' : 'A Fundor megtalálja neked.'}</span>
                    </h2>
                    <div className="login-visual-footer">Fundor.hu</div>
                </div>
            </aside>

            <div className="login-form-panel">
                <div className="login-form-content">
                    <span className="login-kicker">{labels.kicker}</span>
                    <h1 id="login-heading">{labels.title}</h1>
                    <p className="login-intro">{labels.intro}</p>

                    <form action="/login" method="POST" className="login-form">
                        <input type="hidden" name="_token" value={csrfToken} />

                        <div className="login-field">
                            <label htmlFor="login-username">{labels.username}</label>
                            <input
                                id="login-username"
                                type="text"
                                name="username"
                                required
                                autoComplete="username"
                                defaultValue={oldUsername}
                                placeholder={labels.username}
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="login-password">{labels.password}</label>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                            />
                        </div>

                        <label className="login-remember">
                            <input type="checkbox" name="remember" /> {labels.remember}
                        </label>

                        <button type="submit" className="btn btn-gold login-submit">
                            {labels.submit} <span aria-hidden="true">→</span>
                        </button>
                    </form>

                    <p className="login-register">
                        {labels.noAccount}{' '}
                        <a href="/register">
                            {labels.registerHere} <span aria-hidden="true">↗</span>
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}
