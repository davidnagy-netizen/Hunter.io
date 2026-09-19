@extends('layouts.guest')
@section('title', __('Bejelentkezés'))
@section('content')
<div id="react-root" data-react-component="LoginPage" data-props="{{ json_encode(['oldUsername' => old('username', ''), 'currentLocale' => app()->getLocale()]) }}">
<section class="login-shell" aria-labelledby="login-heading">
    <aside class="login-visual">
        <img src="{{ asset('images/login-architecture.png') }}" alt="" width="1024" height="1536" fetchpriority="high">
        <div class="login-visual-content">
            <span class="login-eyebrow">{{ __('Magyar KKV Pályázati Intelligencia') }}</span>
            <h2>{{ __('Ne te keresd a pályázatot.') }}<br><span>{{ __('A Fundor megtalálja neked.') }}</span></h2>
            <div class="login-visual-footer">Fundor.hu</div>
        </div>
    </aside>
    <div class="login-form-panel">
        <div class="login-form-content">
            <span class="login-kicker">{{ __('Támogatási Intelligencia') }}</span>
            <h1 id="login-heading">{{ __('Bejelentkezés') }}</h1>
            <p class="login-intro">{{ __('Lépjen be a Fundor.hu fiókjába a személyre szabott pontozás megtekintéséhez.') }}</p>
            <form action="{{ route('login') }}" method="POST" class="login-form">
                @csrf
                <div class="login-field">
                    <label for="login-username">{{ __('Felhasználónév') }}</label>
                    <input id="login-username" type="text" name="username" required autocomplete="username" value="{{ old('username') }}" placeholder="{{ __('Felhasználónév') }}">
                </div>
                <div class="login-field">
                    <label for="login-password">{{ __('Jelszó') }}</label>
                    <input id="login-password" type="password" name="password" required autocomplete="current-password" placeholder="••••••••">
                </div>
                <label class="login-remember"><input type="checkbox" name="remember" @checked(old('remember'))> {{ __('Emlékezz rám') }}</label>
                <button type="submit" class="btn btn-gold login-submit">{{ __('Bejelentkezés') }} <span aria-hidden="true">→</span></button>
            </form>
            <p class="login-register">{{ __('Még nincs fiókod?') }} <a href="{{ route('register') }}">{{ __('Regisztrálj itt') }} <span aria-hidden="true">↗</span></a></p>
        </div>
    </div>
</section>
</div>
@endsection
@push('styles')
<style>
.login-shell { display: grid; grid-template-columns: 1fr 1fr; max-width: 1180px; margin: 40px auto; min-height: 660px; background: var(--surface); border: 1px solid var(--line); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-lg); }
.login-visual { position: relative; isolation: isolate; display: flex; align-items: flex-end; min-width: 0; background: var(--ink); color: #fff; }
.login-visual > img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: center 45%; }
.login-visual::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, transparent 25%, rgba(14,23,38,.45) 55%, rgba(14,23,38,.95)); }
.login-visual-content { width: 100%; padding: 44px; }
.login-eyebrow { display: block; font-size: 11px; line-height: 1.6; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #f2d59e; margin-bottom: 18px; }
.login-visual h2 { font-size: clamp(28px,3vw,40px); line-height: 1.18; letter-spacing: -.035em; margin: 0 0 38px; }
.login-visual h2 span { color: #f2d59e; }
.login-visual-footer { padding-top: 20px; border-top: 1px solid rgba(255,255,255,.25); font-size: 12px; letter-spacing: .06em; }
.login-form-panel { display: flex; align-items: center; justify-content: center; padding: 56px; min-width: 0; }
.login-form-content { width: 100%; max-width: 370px; }
.login-kicker { display: block; color: var(--gold-deep); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 16px; }
.login-form-content h1 { font-size: clamp(30px,3.4vw,42px); letter-spacing: -.04em; margin-bottom: 14px; overflow-wrap: anywhere; }
.login-intro { color: var(--muted); font-size: 14px; line-height: 1.75; margin: 0 0 32px; }
.login-form { display: flex; flex-direction: column; gap: 20px; }
.login-field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.login-field input { width: 100%; min-height: 50px; border: 1px solid var(--line-strong); border-radius: 10px; padding: 12px 14px; font: inherit; font-size: 14px; color: var(--text); background: var(--surface-2); }
.login-field input:focus-visible, .login-submit:focus-visible, .login-register a:focus-visible { outline: 3px solid var(--gold); outline-offset: 3px; }
.login-remember { display: flex; align-items: center; gap: 8px; min-height: 28px; font-size: 13px; cursor: pointer; }
.login-remember input { width: 17px; height: 17px; margin: 0; accent-color: var(--gold-deep); }
.login-submit { width: 100%; min-height: 50px; justify-content: space-between; padding-inline: 20px; font-family: inherit; }
.login-register { border-top: 1px solid var(--line); padding-top: 24px; margin: 30px 0 0; font-size: 13px; color: var(--muted); line-height: 1.8; }
.login-register a { color: var(--gold-deep); font-weight: 600; white-space: nowrap; }
@media (max-width: 1240px) { .login-shell { margin-inline: 24px; } }
@media (max-width: 760px) {
    .login-shell { grid-template-columns: 1fr; margin: 20px 16px; min-height: auto; border-radius: 18px; }
    .login-visual { min-height: 260px; }
    .login-visual > img { object-position: center 48%; }
    .login-visual-content { padding: 28px; }
    .login-visual h2 { font-size: 28px; margin-bottom: 0; }
    .login-visual-footer { display: none; }
    .login-form-panel { padding: 36px 28px; }
}
@media (max-width: 360px) { .login-form-panel, .login-visual-content { padding: 26px 20px; } .login-visual h2 { font-size: 25px; } }
</style>
@endpush
