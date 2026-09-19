<header class="public-header">
    <div class="public-header-brand">
        <a href="{{ route('home') }}">Fundor.hu</a>
        <span class="logo-badge">{{ __('INTELLIGENCIA') }}</span>
    </div>
    <nav class="public-header-actions">
        @include('partials.language-switcher')
        <a href="{{ route('assessment.show') }}" class="btn btn-ghost" @if(request()->routeIs('assessment.show')) aria-current="page" @endif>{{ __('Ingyenes Felmérés') }}</a>
        @auth
            <a href="{{ route('dashboard') }}" class="btn btn-gold">{{ __('Irányítópult') }}</a>
        @else
            <a href="{{ route('login') }}" class="btn btn-gold" @if(request()->routeIs('login')) aria-current="page" @endif>{{ __('Bejelentkezés') }}</a>
        @endauth
    </nav>
</header>
