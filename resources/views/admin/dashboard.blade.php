@extends('layouts.app')

@section('title', __('Adminisztrációs Irányítópult'))
@section('header_title', __('Rendszer és Platform Áttekintés'))

@section('content')
<div id="react-root" data-react-component="AdminDashboardPage" data-props="{{ json_encode(['stats' => $stats, 'recentUsers' => $recentUsers, 'recentLeads' => $recentLeads]) }}">
<div>
    <!-- System Metrics -->
    <div class="grid grid-cols-4" style="margin-bottom: 24px;">
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 12.5px; color: var(--muted-2); font-weight: 500;">{{ __('Regisztrált Felhasználók') }}</div>
            <div style="font-size: 26px; font-weight: 700; color: var(--ink); margin-top: 4px;">{{ $stats['totalUsers'] }}</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 12.5px; color: var(--muted-2); font-weight: 500;">{{ __('Aktív Előfizetések') }}</div>
            <div style="font-size: 26px; font-weight: 700; color: var(--green); margin-top: 4px;">{{ $stats['activeSubscriptions'] }}</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 12.5px; color: var(--muted-2); font-weight: 500;">{{ __('Pályázati Katalógus (Nyitott)') }}</div>
            <div style="font-size: 26px; font-weight: 700; color: var(--gold-deep); margin-top: 4px;">{{ $stats['openOpportunities'] }} / {{ $stats['totalOpportunities'] }}</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
            <div style="font-size: 12.5px; color: var(--muted-2); font-weight: 500;">{{ __('CRM Érdeklődők (Leads)') }}</div>
            <div style="font-size: 26px; font-weight: 700; color: var(--blue); margin-top: 4px;">{{ $stats['totalLeads'] }}</div>
        </div>
    </div>

    <div class="grid grid-cols-2">
        <!-- Recent Users -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="font-size: 18px; margin: 0;">{{ __('Legutóbbi Regisztrációk') }}</h4>
                <a href="{{ route('admin.users') }}" class="btn btn-ghost" style="font-size: 12.5px; padding: 4px 10px;">{{ __('Összes →') }}</a>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                @foreach($recentUsers as $u)
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--paper); border-radius: 8px;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">{{ $u->name }} ({{ $u->username }})</div>
                            <div style="font-size: 12px; color: var(--muted);">{{ $u->company ?? __('Nincs megadva cég') }} • {{ $u->email }}</div>
                        </div>
                        <span class="badge {{ $u->isAdmin() ? 'badge-amber' : 'badge-slate' }}" style="font-size: 11px;">{{ $u->role }}</span>
                    </div>
                @endforeach
            </div>
        </div>

        <!-- Recent Leads -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="font-size: 18px; margin: 0;">{{ __('Legfrissebb Érdeklődők (Leads)') }}</h4>
                <a href="{{ route('admin.crm') }}" class="btn btn-ghost" style="font-size: 12.5px; padding: 4px 10px;">CRM Board →</a>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                @foreach($recentLeads as $l)
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--paper); border-radius: 8px;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">{{ $l->company ?? $l->contact_name }}</div>
                            <div style="font-size: 12px; color: var(--muted);">{{ $l->email }} {{ __('• Pontszám:') }} {{ $l->readiness_score ?? '—' }}</div>
                        </div>
                        <span class="badge badge-gold" style="font-size: 11px;">{{ $l->stage }}</span>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</div>
</div>
@endsection
