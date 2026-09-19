@extends('layouts.guest')

@section('title', __('Cégprofil Regisztráció'))

@section('content')
<div id="react-root" data-react-component="RegisterPage" data-props="{{ json_encode(['oldInput' => old()]) }}">
<div style="max-width: 480px; margin: 50px auto; padding: 0 20px;">
    <div class="card" style="padding: 36px 32px;">
        <h3 style="font-size: 24px; margin-bottom: 8px; text-align: center;">{{ __('Regisztráció') }}</h3>
        <p style="color: var(--muted); font-size: 14px; text-align: center; margin-bottom: 24px;">{{ __('Hozza létre cége fiókját a pályázatfigyelő elindításához.') }}</p>

        <form action="{{ route('register') }}" method="POST">
            @csrf

            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px;">{{ __('Teljes Név') }}</label>
                    <input type="text" name="name" required value="{{ old('name') }}" placeholder="Kovács Péter" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                </div>

                <div>
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px;">{{ __('Vállalkozás Neve') }}</label>
                    <input type="text" name="company" value="{{ old('company') }}" placeholder="Alfa Gyártó Kft." style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                </div>

                <div>
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px;">{{ __('Felhasználónév') }}</label>
                    <input type="text" name="username" required value="{{ old('username') }}" placeholder="kovacspeter" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                </div>

                <div>
                    <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px;">{{ __('Email Cím') }}</label>
                    <input type="email" name="email" required value="{{ old('email') }}" placeholder="peter@alfagyarto.hu" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                </div>

                <div class="grid grid-cols-2">
                    <div>
                        <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px;">{{ __('Jelszó') }}</label>
                        <input type="password" name="password" required style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px;">{{ __('Jelszó újra') }}</label>
                        <input type="password" name="password_confirmation" required style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                </div>

                <button type="submit" class="btn btn-gold" style="width: 100%; padding: 12px; font-size: 15px; margin-top: 8px;">
                    {{ __('Fiók Létrehozása →') }}
                </button>
            </div>
        </form>

        <div style="margin-top: 24px; text-align: center; font-size: 13.5px; color: var(--muted); border-top: 1px solid var(--line); padding-top: 16px;">
            {{ __('Már rendelkezik fiókkal?') }} <a href="{{ route('login') }}" style="color: var(--gold-deep); font-weight: 600;">{{ __('Jelentkezzen be') }}</a>
        </div>
    </div>
</div>
</div>
@endsection
