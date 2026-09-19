@extends('layouts.app')

@section('title', __('Cégprofil Beállítása'))
@section('header_title', __('Vállalati Támogatási Profil Konfiguráció'))

@section('content')
<div id="react-root" data-react-component="OnboardingPage" data-props="{{ json_encode(['existingProfile' => $existingProfile, 'oldInput' => old(), 'currentLocale' => app()->getLocale()]) }}">
<div style="max-width: 800px; margin: 0 auto;">
    <div class="card">
        <h3 style="font-size: 22px; margin-bottom: 6px;">{{ __('Strukturált Cégprofil') }}</h3>
        <p style="color: var(--muted); margin-bottom: 24px;">
            {{ __('Ezeket az adatokat használja a determinisztikus szabályrendszer a pályázatok automatikus szűrésére és a Fundor Score (0–100) kiszámítására.') }}
        </p>

        <form action="{{ route('onboarding.store') }}" method="POST">
            @csrf

            <div style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Company Name & Basic Identity -->
                <div class="grid grid-cols-2">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Cégnév') }}</label>
                        <input type="text" name="company_name" required value="{{ old('company_name', $existingProfile->company_name ?? 'Alfa Gyártó Kft.') }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Létszám (fő)') }}</label>
                        <input type="number" name="employees" required min="1" value="{{ old('employees', $existingProfile->employees ?? 28) }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                </div>

                <!-- Region & County -->
                <div class="grid grid-cols-2">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Régió kód (NUTS-2)') }}</label>
                        <select name="region_code" required style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                            <option value="HU11" {{ old('region_code', $existingProfile->region_code ?? '') === 'HU11' ? 'selected' : '' }}>HU11 — Budapest</option>
                            <option value="HU12" {{ old('region_code', $existingProfile->region_code ?? 'HU12') === 'HU12' ? 'selected' : '' }}>{{ __('HU12 — Pest vármegye') }}</option>
                            <option value="HU21" {{ old('region_code', $existingProfile->region_code ?? '') === 'HU21' ? 'selected' : '' }}>{{ __('HU21 — Közép-Dunántúl') }}</option>
                            <option value="HU22" {{ old('region_code', $existingProfile->region_code ?? '') === 'HU22' ? 'selected' : '' }}>{{ __('HU22 — Nyugat-Dunántúl') }}</option>
                            <option value="HU31" {{ old('region_code', $existingProfile->region_code ?? '') === 'HU31' ? 'selected' : '' }}>{{ __('HU31 — Észak-Magyarország') }}</option>
                            <option value="HU32" {{ old('region_code', $existingProfile->region_code ?? '') === 'HU32' ? 'selected' : '' }}>{{ __('HU32 — Észak-Alföld') }}</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Vármegye') }}</label>
                        <input type="text" name="county" required value="{{ old('county', $existingProfile->county ?? 'Pest') }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                </div>

                <!-- Industry & TEÁOR -->
                <div class="grid grid-cols-2">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Iparág kategória') }}</label>
                        <select name="industry_id" required style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                            <option value="manuf" {{ old('industry_id', $existingProfile->industry_id ?? 'manuf') === 'manuf' ? 'selected' : '' }}>{{ __('Gyártás / feldolgozóipar') }}</option>
                            <option value="it" {{ old('industry_id', $existingProfile->industry_id ?? '') === 'it' ? 'selected' : '' }}>{{ __('IT / Szoftver / Digitális') }}</option>
                            <option value="logistics" {{ old('industry_id', $existingProfile->industry_id ?? '') === 'logistics' ? 'selected' : '' }}>{{ __('Logisztika / szállítás') }}</option>
                            <option value="trade" {{ old('industry_id', $existingProfile->industry_id ?? '') === 'trade' ? 'selected' : '' }}>{{ __('Kereskedelem') }}</option>
                            <option value="agri" {{ old('industry_id', $existingProfile->industry_id ?? '') === 'agri' ? 'selected' : '' }}>{{ __('Mezőgazdaság / élelmiszer') }}</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Főtevékenység TEÁOR kód') }}</label>
                        <input type="text" name="teaor_code" required value="{{ old('teaor_code', $existingProfile->teaor_code ?? '28') }}" placeholder="Pl. 28" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                </div>

                <!-- Financial Fundamentals -->
                <div class="grid grid-cols-2">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Árbevétel sáv') }}</label>
                        <input type="text" name="revenue_band" required value="{{ old('revenue_band', $existingProfile->revenue_band ?? '500 M–1 Mrd Ft') }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Lezárt üzleti évek') }}</label>
                        <input type="number" name="closed_business_years" required min="0" value="{{ old('closed_business_years', $existingProfile->closed_business_years ?? 4) }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                </div>

                <!-- Development Investment & Target -->
                <div class="grid grid-cols-2">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Tervezett beruházás összege (Ft)') }}</label>
                        <input type="number" name="planned_investment_value" required min="0" step="100000" value="{{ old('planned_investment_value', $existingProfile->planned_investment_value ?? 30000000) }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Projekt megnevezése') }}</label>
                        <input type="text" name="project_name" value="{{ old('project_name', $existingProfile->project_name ?? 'ERP és gyártásvezérlő fejlesztés') }}" style="width: 100%; padding: 11px; border: 1px solid var(--line-strong); border-radius: 8px;">
                    </div>
                </div>

                <!-- Development Goals (Checkboxes) -->
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Fejlesztési célok (Legalább 1)') }}</label>
                    <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                        @php
                            $selectedGoals = old('goals', $existingProfile->goals ?? ['digitalization', 'it', 'machinery']);
                        @endphp
                        <label><input type="checkbox" name="goals[]" value="digitalization" {{ in_array('digitalization', $selectedGoals) ? 'checked' : '' }}> {{ __('Digitalizáció') }}</label>
                        <label><input type="checkbox" name="goals[]" value="it" {{ in_array('it', $selectedGoals) ? 'checked' : '' }}> {{ __('IT fejlesztés') }}</label>
                        <label><input type="checkbox" name="goals[]" value="ai" {{ in_array('ai', $selectedGoals) ? 'checked' : '' }}> {{ __('Mesterséges intelligencia') }}</label>
                        <label><input type="checkbox" name="goals[]" value="machinery" {{ in_array('machinery', $selectedGoals) ? 'checked' : '' }}> {{ __('Gép- / eszközbeszerzés') }}</label>
                        <label><input type="checkbox" name="goals[]" value="energy" {{ in_array('energy', $selectedGoals) ? 'checked' : '' }}> {{ __('Energetika') }}</label>
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    <button type="submit" class="btn btn-gold" style="padding: 12px 28px;">{{ __('Profil Mentése és Alkalmasság Újraszámítása') }}</button>
                </div>
            </div>
        </form>
    </div>
</div>
</div>
@endsection
