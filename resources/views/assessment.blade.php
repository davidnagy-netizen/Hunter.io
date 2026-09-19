@extends('layouts.guest')

@section('title', __('Ingyenes Pályázati Készültségi Felmérés'))

@section('content')
<div id="react-root" data-react-component="AssessmentPage" data-props="{{ json_encode(['completed' => $completed ?? false, 'readinessScore' => $readinessScore ?? 70, 'teaserOpportunities' => $teaserOpportunities ?? [], 'oldInput' => old()]) }}">
<div style="max-width: 760px; margin: 40px auto; padding: 0 20px;">
    @if(isset($completed) && $completed)
        <!-- Assessment Result View -->
        <div class="card" style="text-align: center; padding: 48px 32px;">
            <span class="badge badge-green" style="font-size: 14px; margin-bottom: 16px;">{{ __('Felmérés Sikeresen Értékelve') }}</span>
            <h2 style="font-size: 32px; margin-bottom: 8px;">{{ __('Az Ön Vállalati Készültségi Pontszáma') }}</h2>
            <p style="color: var(--muted); margin-bottom: 32px;">{{ __('A megadott cégadatok alapján a rendszer kiszámította a pályázati alkalmassági alapot.') }}</p>

            <div style="width: 140px; height: 140px; border-radius: 50%; border: 8px solid var(--gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 32px;">
                <span style="font-family: var(--display); font-size: 42px; font-weight: 700; color: var(--ink);">{{ $readinessScore }}</span>
            </div>

            <h3 style="font-size: 20px; margin-bottom: 16px;">{{ __('Előzetesen Releváns Pályázatok') }}</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
                @foreach($teaserOpportunities as $opp)
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: var(--paper); border-radius: var(--radius-sm); text-align: left;">
                        <div>
                            <span class="badge badge-gold" style="font-size: 11px;">{{ $opp->program }}</span>
                            <div style="font-weight: 600; margin-top: 4px;">{{ __($opp->title) }}</div>
                        </div>
                        <span class="badge badge-green">{{ __('Lehetséges egyezés') }}</span>
                    </div>
                @endforeach
            </div>

            <a href="{{ route('register') }}" class="btn btn-gold" style="font-size: 16px; padding: 14px 28px;">
                {{ __('Teljes Cégprofil Elkészítése és Részletes Pontszámok →') }}
            </a>
        </div>
    @else
        <!-- Assessment Form -->
        <div class="card" style="padding: 40px 32px;">
            <h2 style="font-size: 28px; margin-bottom: 8px;">{{ __('KKV Pályázati Készültségi Felmérés') }}</h2>
            <p style="color: var(--muted); margin-bottom: 28px;">{{ __('Válaszoljon néhány alapkérdésre a vállalkozásáról, és azonnal megkapja az előzetes minősítést.') }}</p>

            <form action="{{ route('assessment.submit') }}" method="POST">
                @csrf
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Vállalkozás neve') }}</label>
                        <input type="text" name="company_name" required value="{{ old('company_name') }}" placeholder="{{ __('Pl. Minta Kft.') }}" style="width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: 8px; font-family: inherit;">
                    </div>

                    <div class="grid grid-cols-2">
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Kapcsolattartó Email') }}</label>
                            <input type="email" name="email" required value="{{ old('email') }}" placeholder="iroda@mintakft.hu" style="width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: 8px; font-family: inherit;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Telefonszám (opcionális)') }}</label>
                            <input type="text" name="phone" value="{{ old('phone') }}" placeholder="+36 30 123 4567" style="width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: 8px; font-family: inherit;">
                        </div>
                    </div>

                    <div class="grid grid-cols-2">
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Alkalmazotti létszám (fő)') }}</label>
                            <input type="number" name="employees" required min="0" value="{{ old('employees', 10) }}" style="width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: 8px; font-family: inherit;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Lezárt üzleti évek száma') }}</label>
                            <input type="number" name="closed_years" required min="0" value="{{ old('closed_years', 2) }}" style="width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: 8px; font-family: inherit;">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">{{ __('Éves árbevétel sáv') }}</label>
                        <select name="revenue_band" required style="width: 100%; padding: 12px; border: 1px solid var(--line-strong); border-radius: 8px; font-family: inherit;">
                            <option value="0–100 M Ft">{{ __('0–100 M Ft') }}</option>
                            <option value="100–500 M Ft" selected>{{ __('100–500 M Ft') }}</option>
                            <option value="500 M–1 Mrd Ft">{{ __('500 M–1 Mrd Ft') }}</option>
                            <option value="1–5 Mrd Ft">{{ __('1–5 Mrd Ft') }}</option>
                            <option value="5 Mrd Ft felett">{{ __('5 Mrd Ft felett') }}</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-gold" style="width: 100%; padding: 14px; font-size: 16px; margin-top: 10px;">
                        {{ __('Készültségi Pontszám Kiszámítása →') }}
                    </button>
                </div>
            </form>
        </div>
    @endif
</div>
</div>
@endsection
