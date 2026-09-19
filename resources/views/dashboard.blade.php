@extends('layouts.app')

@section('title', __('Irányítópult — Vállalati Pályázatfigyelő'))
@section('header_title', __('Vállalati Pályázati Irányítópult'))

@section('content')
<div id="react-root" data-react-component="DashboardPage" data-props="{{ json_encode(['stats' => $stats, 'profile' => $profile, 'opportunities' => $opportunities, 'currentLocale' => app()->getLocale()]) }}">
<div>
    <!-- Metrics Header -->
    <div class="grid grid-cols-3" style="margin-bottom: 24px;">
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 13px; color: var(--muted-2); font-weight: 500;">{{ __('Aktív Nyitott Kiírások') }}</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--ink); margin-top: 4px;">{{ $stats['totalOpen'] }} {{ __('db') }}</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 13px; color: var(--muted-2); font-weight: 500;">{{ __('30 Napon Belüli Határidők') }}</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--amber); margin-top: 4px;">{{ $stats['upcomingDeadlines'] }} {{ __('db') }}</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 13px; color: var(--muted-2); font-weight: 500;">{{ __('Elérhető Támogatási Keretösszeg') }}</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--green); margin-top: 4px;">
                {{ number_format($stats['totalPotentialFunding'] / 1000000, 0, ',', ' ') }} {{ __('M Ft') }}
            </div>
        </div>
    </div>

    <!-- SME Profile Summary Notice -->
    @if($profile)
        <div class="card" style="background: var(--surface-2); border-left: 4px solid var(--gold); margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <span style="font-weight: 600; font-size: 16px;">{{ $profile->company_name }}</span>
                    <span style="color: var(--muted); margin-left: 8px;">({{ $profile->employees }} {{ __('fő • TEÁOR') }} {{ $profile->teaor_code }} • {{ $profile->county }} {{ __('vármegye)') }}</span>
                </div>
                <div>
                    <a href="{{ route('onboarding') }}" class="btn btn-ghost" style="padding: 6px 14px; font-size: 13px;">{{ __('Profil Módosítása') }}</a>
                </div>
            </div>
        </div>
    @else
        <div class="card" style="background: var(--amber-bg); border-color: var(--amber); margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: var(--ink);">{{ __('Még nincs kitöltve a cégprofilod!') }}</strong>
                    <div style="color: var(--text); font-size: 14px;">{{ __('Töltsd ki az adataidat a pontos Fundor Score számításhoz és szabályalapú szűréshez.') }}</div>
                </div>
                <a href="{{ route('onboarding') }}" class="btn btn-gold" style="font-size: 13px;">{{ __('Profil Kitöltése') }}</a>
            </div>
        </div>
    @endif

    <!-- Ranked Opportunity Cards -->
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 20px; margin: 0;">{{ __('Releváns Pályázati Lehetőségek (Fundor Score ≥ 70)') }}</h3>
        <a href="{{ route('opportunities.index') }}" class="btn btn-ghost" style="font-size: 13px;">{{ __('Összes Megtekintése →') }}</a>
    </div>

    <div class="grid grid-cols-2">
        @forelse($opportunities as $opp)
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <span class="badge badge-gold">{{ $opp->program }}</span>
                        <div style="text-align: right;">
                            <span class="badge {{ $opp->daysRemaining() <= 14 ? 'badge-amber' : 'badge-slate' }}">
                                {{ __('Határidő:') }} {{ $opp->deadline->format('Y.m.d.') }} ({{ $opp->daysRemaining() }} {{ __('nap)') }}
                            </span>
                        </div>
                    </div>
                    <h4 style="font-size: 18px; margin-bottom: 8px;">{{ __($opp->title) }}</h4>
                    <div style="font-size: 13.5px; color: var(--muted); margin-bottom: 16px;">
                        {{ __('Támogatás:') }} {{ number_format($opp->funding_min / 1000000, 0) }}–{{ number_format($opp->funding_max / 1000000, 0) }} {{ __('M Ft') }}
                        ({{ round($opp->intensity * 100) }}{{ __('% intenzitás)') }}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; pt: 14px; border-top: 1px solid var(--line);">
                    <form action="{{ route('favorites.toggle', $opp->id) }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-ghost" style="padding: 8px 12px; font-size: 13px;">
                            {{ __('⭐ Mentés') }}
                        </button>
                    </form>
                    <a href="{{ route('opportunities.show', $opp->code) }}" class="btn btn-dark" style="font-size: 13px; padding: 8px 16px;">
                        {{ __('Részletes Értékelés →') }}
                    </a>
                </div>
            </div>
        @empty
            <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--muted);">
                {{ __('Jelenleg nincsenek elérhető pályázati kiírások.') }}
            </div>
        @endforelse
    </div>
</div>
</div>
@endsection
