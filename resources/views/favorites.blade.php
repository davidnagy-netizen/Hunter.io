@extends('layouts.app')

@section('title', __('Elmentett Pályázatok'))
@section('header_title', __('Kedvencnek Jelölt Pályázatok'))

@section('content')
<div style="max-width: 900px; margin: 0 auto;">
    <div style="margin-bottom: 24px;">
        <h3 style="font-size: 22px; margin-bottom: 6px;">{{ __('Elmentett Pályázati Lehetőségek') }}</h3>
        <p style="color: var(--muted); margin: 0;">{{ __('Itt követheted nyomon a könyvjelzőzött felhívásokat és azok beadási határidőit.') }}</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 16px;">
        @forelse($favorites as $opp)
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0;">
                <div>
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                        <span class="badge badge-gold">{{ $opp->program }}</span>
                        <span class="badge badge-slate">{{ $opp->deadline->format('Y.m.d.') }}</span>
                    </div>
                    <h4 style="font-size: 17px; margin-bottom: 4px;">{{ __($opp->title) }}</h4>
                    <div style="font-size: 13px; color: var(--muted);">
                        {{ __('Támogatási összeg:') }} {{ number_format($opp->funding_min / 1000000, 0) }}–{{ number_format($opp->funding_max / 1000000, 0) }} {{ __('M Ft') }}
                    </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <form action="{{ route('favorites.toggle', $opp->id) }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-ghost" style="padding: 8px 12px; font-size: 13px; color: var(--red);">
                            {{ __('Eltávolítás') }}
                        </button>
                    </form>
                    <a href="{{ route('opportunities.show', $opp->code) }}" class="btn btn-dark" style="padding: 8px 14px; font-size: 13px;">
                        {{ __('Megnyitás →') }}
                    </a>
                </div>
            </div>
        @empty
            <div class="card" style="text-align: center; color: var(--muted); padding: 48px 24px;">
                <div style="font-size: 32px; margin-bottom: 12px;">⭐</div>
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px; color: var(--ink);">{{ __('Még nincsenek elmentett pályázataid') }}</div>
                <p style="margin-bottom: 20px;">{{ __('Böngéssz a katalógusban, és a csillag ikonra kattintva mentsd el a releváns kiírásokat.') }}</p>
                <a href="{{ route('opportunities.index') }}" class="btn btn-gold">{{ __('Pályázatok Böngészése →') }}</a>
            </div>
        @endforelse
    </div>
</div>
@endsection
