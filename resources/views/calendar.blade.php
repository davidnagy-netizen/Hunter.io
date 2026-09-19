@extends('layouts.app')

@section('title', __('Pályázati Határidő Naptár'))
@section('header_title', __('Támogatási Határidők és Beadási Ütemezés'))

@section('content')
<div style="max-width: 900px; margin: 0 auto;">
    <div style="margin-bottom: 24px;">
        <h3 style="font-size: 22px; margin-bottom: 6px;">{{ __('Időrendi Pályázati Naptár') }}</h3>
        <p style="color: var(--muted); margin: 0;">{{ __('A nyitott és beadás alatt álló felhívások benyújtási határideje hónapok szerint rendezve.') }}</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 24px;">
        @forelse($grouped as $month => $opps)
            <div class="card" style="margin-bottom: 0;">
                <div style="font-family: var(--display); font-size: 18px; font-weight: 700; color: var(--gold-deep); margin-bottom: 16px; border-bottom: 1px solid var(--line); padding-bottom: 10px;">
                    📅 {{ $month }} ({{ count($opps) }} {{ __('felhívás)') }}
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    @foreach($opps as $opp)
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--paper); border-radius: var(--radius-sm); flex-wrap: wrap; gap: 12px;">
                            <div>
                                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                                    <span class="badge badge-gold" style="font-size: 11px;">{{ $opp->program }}</span>
                                    <span style="font-weight: 600; font-size: 15px;">{{ __($opp->title) }}</span>
                                </div>
                                <div style="font-size: 13px; color: var(--muted);">
                                    {{ __('Keret:') }} {{ number_format($opp->funding_min / 1000000, 0) }}–{{ number_format($opp->funding_max / 1000000, 0) }} {{ __('M Ft') }}
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; gap: 14px;">
                                <span class="badge {{ $opp->daysRemaining() <= 14 ? 'badge-amber' : 'badge-slate' }}">
                                    {{ $opp->deadline->format('Y.m.d.') }} ({{ $opp->daysRemaining() }} {{ __('nap)') }}
                                </span>
                                <a href="{{ route('opportunities.show', $opp->code) }}" class="btn btn-ghost" style="padding: 6px 12px; font-size: 13px;">
                                    {{ __('Részletek →') }}
                                </a>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @empty
            <div class="card" style="text-align: center; color: var(--muted); padding: 40px;">
                {{ __('Nincsenek közeledő pályázati határidők rögzítve.') }}
            </div>
        @endforelse
    </div>
</div>
@endsection
