@extends('layouts.app')

@section('title', 'CRM Pipeline')
@section('header_title', __('Érdeklődők és Ügyfélkapcsolat Kezelés (CRM)'))

@section('content')
<div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
            <h3 style="font-size: 22px; margin-bottom: 4px;">{{ __('CRM Értékesítési Pipeline') }}</h3>
            <p style="color: var(--muted); margin: 0;">{{ __('Az ingyenes felmérésből és regisztrációkból érkező érdeklődők követése.') }}</p>
        </div>
        <a href="{{ route('admin.crm.export') }}" class="btn btn-ghost" style="font-size: 13.5px;">
            {{ __('📥 Exportálás CSV formátumban') }}
        </a>
    </div>

    <!-- Pipeline Stages Board -->
    <div class="grid grid-cols-4" style="align-items: flex-start; gap: 16px;">
        @php
            $stages = [
                'lead' => ['name' => __('Új Érdeklődő'), 'color' => 'var(--blue)'],
                'contacted' => ['name' => __('Felvéve a kapcsolat'), 'color' => 'var(--amber)'],
                'qualified' => ['name' => __('Minősített Lead'), 'color' => 'var(--gold)'],
                'converted' => ['name' => __('Konvertált Ügyfél'), 'color' => 'var(--green)'],
            ];
        @endphp

        @foreach($stages as $stageKey => $meta)
            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 2px solid {{ $meta['color'] }}; padding-bottom: 8px;">
                    <span style="font-weight: 700; font-size: 14px;">{{ $meta['name'] }}</span>
                    <span class="badge badge-slate" style="font-size: 11px;">{{ count($groupedLeads[$stageKey] ?? []) }}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    @forelse($groupedLeads[$stageKey] ?? [] as $lead)
                        <div style="background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 12px;">
                            <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">{{ $lead->company ?? $lead->contact_name }}</div>
                            <div style="font-size: 12px; color: var(--muted); margin-bottom: 8px;">{{ $lead->email }}</div>

                            @if($lead->readiness_score)
                                <span class="badge badge-gold" style="font-size: 10px; margin-bottom: 8px;">Score: {{ $lead->readiness_score }}</span>
                            @endif

                            <!-- Stage Changer Form -->
                            <form action="{{ route('admin.crm.leads.stage', $lead->id) }}" method="POST" style="margin-top: 8px;">
                                @csrf
                                @method('PATCH')
                                <select name="stage" onchange="this.form.submit()" style="width: 100%; font-size: 11.5px; padding: 4px 6px; border: 1px solid var(--line-strong); border-radius: 6px;">
                                    <option value="lead" {{ $lead->stage === 'lead' ? 'selected' : '' }}>{{ __('Új Érdeklődő') }}</option>
                                    <option value="contacted" {{ $lead->stage === 'contacted' ? 'selected' : '' }}>{{ __('Kapcsolatfelvétel') }}</option>
                                    <option value="qualified" {{ $lead->stage === 'qualified' ? 'selected' : '' }}>{{ __('Minősített') }}</option>
                                    <option value="converted" {{ $lead->stage === 'converted' ? 'selected' : '' }}>{{ __('Konvertált') }}</option>
                                    <option value="dormant" {{ $lead->stage === 'dormant' ? 'selected' : '' }}>{{ __('Inaktív') }}</option>
                                </select>
                            </form>
                        </div>
                    @empty
                        <div style="font-size: 12px; color: var(--muted-2); text-align: center; padding: 20px 0;">
                            {{ __('Nincs lead ebben a fázisban.') }}
                        </div>
                    @endforelse
                </div>
            </div>
        @endforeach
    </div>
</div>
@endsection
