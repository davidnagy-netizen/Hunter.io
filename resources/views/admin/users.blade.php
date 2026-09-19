@extends('layouts.app')

@section('title', __('Felhasználók Kezelése'))
@section('header_title', __('Felhasználói Fiókok és Cégprofilok'))

@section('content')
<div class="card">
    <h3 style="font-size: 20px; margin-bottom: 16px;">{{ __('Regisztrált Felhasználók') }}</h3>

    <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="border-bottom: 2px solid var(--line); text-align: left; color: var(--muted);">
                    <th style="padding: 10px;">ID</th>
                    <th style="padding: 10px;">{{ __('Név & Felhasználónév') }}</th>
                    <th style="padding: 10px;">{{ __('Cégnév') }}</th>
                    <th style="padding: 10px;">Email</th>
                    <th style="padding: 10px;">{{ __('Szerepkör') }}</th>
                    <th style="padding: 10px;">{{ __('Utolsó belépés') }}</th>
                </tr>
            </thead>
            <tbody>
                @forelse($users as $user)
                    <tr style="border-bottom: 1px solid var(--line);">
                        <td style="padding: 12px 10px; font-family: monospace;">#{{ $user->id }}</td>
                        <td style="padding: 12px 10px;">
                            <strong>{{ $user->name }}</strong>
                            <div style="font-size: 12px; color: var(--muted);">{{ $user->username }}</div>
                        </td>
                        <td style="padding: 12px 10px;">{{ $user->companyProfile->company_name ?? $user->company ?? '—' }}</td>
                        <td style="padding: 12px 10px;">{{ $user->email }}</td>
                        <td style="padding: 12px 10px;">
                            <span class="badge {{ $user->isAdmin() ? 'badge-amber' : 'badge-slate' }}">{{ $user->role }}</span>
                        </td>
                        <td style="padding: 12px 10px; font-size: 12.5px; color: var(--muted);">
                            {{ $user->last_login_at ? $user->last_login_at->format('Y.m.d H:i') : __('Még nem lépett be') }}
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="padding: 20px; text-align: center; color: var(--muted);">{{ __('Nincsenek felhasználók a rendszerben.') }}</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div style="margin-top: 20px;">
        {{ $users->links() }}
    </div>
</div>
@endsection
