@extends('layouts.app')

@section('title', __($opportunity->title) . __(' — Pályázat Részletei'))
@section('header_title', $opportunity->program . ' • ' . $opportunity->title)

@section('content')
<div id="react-root" data-react-component="OpportunityShowPage" data-props="{{ json_encode(['opportunity' => $opportunity, 'profile' => $profile]) }}">
<div style="max-width: 1040px; margin: 0 auto;">
    <!-- Top Summary Card with Score Ring -->
    <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; margin-bottom: 24px;">
        <div style="flex: 1; min-width: 300px;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
                <span class="badge badge-gold">{{ $opportunity->program }}</span>
                <span style="font-family: monospace; font-size: 13px; color: var(--muted);">{{ $opportunity->code }}</span>
                <span class="badge {{ $opportunity->daysRemaining() <= 14 ? 'badge-amber' : 'badge-slate' }}">
                    {{ __('Határidő:') }} {{ $opportunity->deadline->format('Y.m.d.') }} ({{ $opportunity->daysRemaining() }} {{ __('nap van hátra)') }}
                </span>
            </div>
            <h2 style="font-size: 26px; margin-bottom: 12px;">{{ __($opportunity->title) }}</h2>
            <div style="font-size: 14.5px; color: var(--muted); line-height: 1.6;">
                {{ __('Hivatalos forrásazonosító:') }} <strong>{{ $opportunity->source_reference }}</strong>
                @if($opportunity->source_url)
                    • <a href="{{ $opportunity->source_url }}" target="_blank" style="color: var(--blue); text-decoration: underline;">{{ __('Pályázati kiírás megnyitása ↗') }}</a>
                @endif
            </div>
        </div>

        <!-- Fundor Score Visualizer -->
        <div style="text-align: center; padding: 16px 28px; background: var(--paper); border-radius: var(--radius);">
            <div style="font-size: 12px; color: var(--muted-2); font-weight: 600; text-transform: uppercase;">Fundor Score</div>
            <div style="font-family: var(--display); font-size: 48px; font-weight: 700; color: var(--gold-deep); line-height: 1.1;">
                88
            </div>
            <span class="badge badge-green" style="font-size: 11px;">{{ __('Erős lehetőség') }}</span>
        </div>
    </div>

    <div class="grid grid-cols-2">
        <!-- 5-Factor Score Breakdown -->
        <div class="card">
            <h4 style="font-size: 18px; margin-bottom: 16px;">{{ __('5-Faktoros Pontozás Részletezése') }}</h4>
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
                        <span>{{ __('Alkalmasság (35%)') }}</span>
                        <span style="color: var(--green);">35 / 35</span>
                    </div>
                    <div style="background: var(--line); height: 6px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--green); width: 100%; height: 100%;"></div>
                    </div>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
                        <span>{{ __('Projekt Illeszkedés (25%)') }}</span>
                        <span style="color: var(--gold);">22 / 25</span>
                    </div>
                    <div style="background: var(--line); height: 6px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--gold); width: 88%; height: 100%;"></div>
                    </div>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
                        <span>{{ __('Finanszírozási Méret (15%)') }}</span>
                        <span style="color: var(--gold);">14 / 15</span>
                    </div>
                    <div style="background: var(--line); height: 6px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--gold); width: 93%; height: 100%;"></div>
                    </div>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
                        <span>{{ __('Időzítés & Határidő (15%)') }}</span>
                        <span style="color: var(--green);">12 / 15</span>
                    </div>
                    <div style="background: var(--line); height: 6px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--green); width: 80%; height: 100%;"></div>
                    </div>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; margin-bottom: 4px;">
                        <span>{{ __('Megvalósíthatóság (10%)') }}</span>
                        <span style="color: var(--slate);">5 / 10</span>
                    </div>
                    <div style="background: var(--line); height: 6px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--slate); width: 50%; height: 100%;"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Live Grant Calculator -->
        <div class="card">
            <h4 style="font-size: 18px; margin-bottom: 16px;">{{ __('Támogatás és Önerő Kalkulátor') }}</h4>
            @php
                $plannedInvestment = $profile->planned_investment_value ?? 30000000;
                $intensity = $opportunity->intensity;
                $calculatedGrant = min($opportunity->funding_max, $plannedInvestment * $intensity);
                $calculatedOwn = max(0, $plannedInvestment - $calculatedGrant);
            @endphp

            <div style="background: var(--paper); padding: 18px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--muted);">{{ __('Tervezett beruházás összege:') }}</span>
                    <strong>{{ number_format($plannedInvestment, 0, ',', ' ') }} {{ __('Ft') }}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--muted);">{{ __('Támogatási intenzitás:') }}</span>
                    <strong style="color: var(--green);">{{ round($intensity * 100) }}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid var(--line); padding-top: 8px;">
                    <span>{{ __('Várható vissza nem térítendő támogatás:') }}</span>
                    <strong style="color: var(--gold-deep); font-size: 16px;">{{ number_format($calculatedGrant, 0, ',', ' ') }} {{ __('Ft') }}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>{{ __('Szükséges saját forrás (önerő):') }}</span>
                    <strong>{{ number_format($calculatedOwn, 0, ',', ' ') }} {{ __('Ft') }}</strong>
                </div>
            </div>
            <div style="font-size: 12px; color: var(--muted-2);">
                {{ __('Megjegyzés: A támogatás maximális plafonja ennél a felhívásnál') }} {{ number_format($opportunity->funding_max / 1000000, 0) }} {{ __('M Ft.') }}
            </div>
        </div>
    </div>

    <!-- Required Documents Checklist -->
    <div class="card">
        <h4 style="font-size: 18px; margin-bottom: 16px;">{{ __('Kötelező Pályázati Mellékletek és Dokumentumok') }}</h4>
        <div class="grid grid-cols-2">
            @forelse($opportunity->docs ?? [] as $doc)
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--paper); border-radius: 8px;">
                    <span>📄</span>
                    <span style="font-size: 14px;">{{ __($doc) }}</span>
                </div>
            @empty
                <div style="color: var(--muted);">{{ __('Nincsenek dokumentumok rögzítve.') }}</div>
            @endforelse
        </div>
    </div>

    <!-- Interactive Inline Question Resolution -->
    @if(is_null($profile?->de_minimis_ok))
        <div class="card" style="background: var(--gold-bg); border-color: var(--gold);">
            <h4 style="font-size: 17px; margin-bottom: 8px; color: var(--ink);">{{ __('❓ Tisztázandó Alkalmassági Kérdés') }}</h4>
            <p style="font-size: 14px; margin-bottom: 14px; color: var(--text);">
                {{ __('Van-e a vállalkozásnak szabad de minimis kerete (~300 000 EUR az elmúlt 3 pénzügyi évben)?') }}
            </p>
            <form action="{{ route('opportunities.answer', $opportunity->code) }}" method="POST" style="display: flex; gap: 12px;">
                @csrf
                <input type="hidden" name="field" value="de_minimis_ok">
                <button type="submit" name="value" value="1" class="btn btn-dark" style="font-size: 13px;">{{ __('Igen, van szabad keret') }}</button>
                <button type="submit" name="value" value="0" class="btn btn-ghost" style="font-size: 13px; background: #fff;">{{ __('Nem, kimerült a keret') }}</button>
            </form>
        </div>
    @endif
</div>
</div>
@endsection
