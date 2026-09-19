@extends('layouts.app')

@section('title', __('Pályázati Katalógus és Kereső'))
@section('header_title', __('Nyitott és Várható Pályázatok Katalógusa'))

@section('content')
<div id="react-root" data-react-component="OpportunitiesIndexPage" data-props="{{ json_encode(['opportunities' => $opportunities, 'searchQuery' => request('q', ''), 'selectedProgram' => request('program', ''), 'currentLocale' => app()->getLocale()]) }}">
<div>
    <!-- Filter Bar -->
    <div class="card" style="padding: 18px 24px; margin-bottom: 24px;">
        <form action="{{ route('opportunities.index') }}" method="GET" style="display: flex; gap: 14px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 240px;">
                <input type="text" name="q" value="{{ request('q') }}" placeholder="{{ __('Keresés kulcsszóra, kódra vagy felhívás címre...') }}" style="width: 100%; padding: 10px 14px; border: 1px solid var(--line-strong); border-radius: 8px;">
            </div>
            <div>
                <select name="program" style="padding: 10px 14px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    <option value="">{{ __('-- Minden programcsalád --') }}</option>
                    <option value="GINOP Plusz" {{ request('program') === 'GINOP Plusz' ? 'selected' : '' }}>GINOP Plusz</option>
                    <option value="KEHOP Plusz" {{ request('program') === 'KEHOP Plusz' ? 'selected' : '' }}>KEHOP Plusz</option>
                    <option value="DIMOP Plusz" {{ request('program') === 'DIMOP Plusz' ? 'selected' : '' }}>DIMOP Plusz</option>
                    <option value="Széchenyi Terv Plusz" {{ request('program') === 'Széchenyi Terv Plusz' ? 'selected' : '' }}>Széchenyi Terv Plusz</option>
                </select>
            </div>
            <button type="submit" class="btn btn-dark" style="padding: 10px 18px;">{{ __('Szűrés') }}</button>
            @if(request()->hasAny(['q', 'program']))
                <a href="{{ route('opportunities.index') }}" class="btn btn-ghost" style="padding: 10px 14px;">{{ __('Törlés') }}</a>
            @endif
        </form>
    </div>

    <!-- Opportunity Listings -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
        @forelse($opportunities as $opp)
            <div class="card" style="margin-bottom: 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 280px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                        <span class="badge badge-gold">{{ $opp->program }}</span>
                        <span style="font-family: monospace; font-size: 12px; color: var(--muted);">{{ $opp->code }}</span>
                        <span class="badge {{ $opp->daysRemaining() <= 14 ? 'badge-amber' : 'badge-slate' }}">
                            {{ $opp->deadline->format('Y.m.d.') }} ({{ $opp->daysRemaining() }} {{ __('nap)') }}
                        </span>
                    </div>
                    <h3 style="font-size: 18px; margin-bottom: 6px;">{{ __($opp->title) }}</h3>
                    <div style="font-size: 13.5px; color: var(--muted);">
                        {{ __('Keret:') }} {{ number_format($opp->funding_min / 1000000, 0) }}–{{ number_format($opp->funding_max / 1000000, 0) }} {{ __('M Ft •') }}
                        {{ __('Támogatási intenzitás:') }} {{ round($opp->intensity * 100) }}%
                    </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <form action="{{ route('favorites.toggle', $opp->id) }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-ghost" style="padding: 9px 12px; font-size: 13px;">⭐</button>
                    </form>
                    <a href="{{ route('opportunities.show', $opp->code) }}" class="btn btn-gold" style="font-size: 13.5px;">
                        {{ __('Megnyitás & Pontozás →') }}
                    </a>
                </div>
            </div>
        @empty
            <div class="card" style="text-align: center; color: var(--muted); padding: 40px;">
                {{ __('A keresési feltételeknek megfelelő pályázati lehetőség nem található.') }}
            </div>
        @endforelse
    </div>

    <!-- Pagination -->
    <div style="margin-top: 24px;">
        {{ $opportunities->links() }}
    </div>
</div>
</div>
@endsection
