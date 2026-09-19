<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Fundor.hu') }} — @yield('title', __('Pályázatfigyelő és Támogatási Intelligencia'))</title>

    <!-- Project Fonts: Space Grotesk & Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">

    <!-- Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    @stack('styles')
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation Rail -->
        <aside class="sidebar">
            <div class="sidebar-logo">
                <span>Fundor.hu</span>
                <span class="logo-badge">PROTOTYPE</span>
            </div>

            <nav>
                <ul class="nav-links">
                    <li>
                        <a href="{{ route('dashboard') }}" class="nav-link {{ request()->routeIs('dashboard') ? 'active' : '' }}">
                            <span>📊</span>
                            <span>{{ __('Áttekintés') }}</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('opportunities.index') }}" class="nav-link {{ request()->routeIs('opportunities.*') ? 'active' : '' }}">
                            <span>🎯</span>
                            <span>{{ __('Pályázatok') }}</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('calendar') }}" class="nav-link {{ request()->routeIs('calendar') ? 'active' : '' }}">
                            <span>📅</span>
                            <span>{{ __('Határidők') }}</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('favorites') }}" class="nav-link {{ request()->routeIs('favorites') ? 'active' : '' }}">
                            <span>⭐</span>
                            <span>{{ __('Kedvencek') }}</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('onboarding') }}" class="nav-link {{ request()->routeIs('onboarding') ? 'active' : '' }}">
                            <span>🏢</span>
                            <span>{{ __('Cégprofil') }}</span>
                        </a>
                    </li>

                    @if(Auth::check() && Auth::user()->isAdmin())
                        <li style="margin-top: 16px; padding: 0 14px; font-size: 11px; text-transform: uppercase; color: var(--muted-2); letter-spacing: .05em;">{{ __('Adminisztráció') }}</li>
                        <li>
                            <a href="{{ route('admin.dashboard') }}" class="nav-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                                <span>⚙️</span>
                                <span>{{ __('Rendszer') }}</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.crm') }}" class="nav-link {{ request()->routeIs('admin.crm') ? 'active' : '' }}">
                                <span>👥</span>
                                <span>CRM Pipeline</span>
                            </a>
                        </li>
                    @endif
                </ul>
            </nav>

            <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--ink-2);">
                @auth
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 600; font-size: 13.5px;">{{ Auth::user()->name }}</div>
                            <div style="font-size: 12px; color: var(--muted-2);">{{ Auth::user()->company ?? __('SME Felhasználó') }}</div>
                        </div>
                    </div>
                    <form action="{{ route('logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-ghost" style="width: 100%; color: #fff; border-color: var(--ink-2); font-size: 13px;">{{ __('Kijelentkezés') }}</button>
                    </form>
                @else
                    <a href="{{ route('login') }}" class="btn btn-gold" style="width: 100%; font-size: 13px;">{{ __('Bejelentkezés') }}</a>
                @endauth
            </div>
        </aside>

        <!-- Main Workspace -->
        <main class="main-content">
            <header class="topbar">
                <div>
                    <h2 style="font-size: 18px; margin: 0;">@yield('header_title', __('Támogatási Intelligencia'))</h2>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    @include('partials.language-switcher')
                    <span class="badge badge-gold">HU12 • Pest</span>
                    <a href="{{ route('home') }}" class="btn btn-ghost" style="padding: 6px 12px; font-size: 13px;">{{ __('Kezdőlap') }}</a>
                </div>
            </header>

            <div class="content-body">
                <!-- Flash Notification Banner -->
                @if(session('success'))
                    <div style="background: var(--green-bg); color: var(--green); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px; font-weight: 500;">
                        {{ session('success') }}
                    </div>
                @endif

                @if($errors->any())
                    <div style="background: var(--red-bg); color: var(--red); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px; font-weight: 500;">
                        <ul style="margin: 0; padding-left: 20px;">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                @yield('content')
            </div>
        </main>
    </div>

    @stack('scripts')
</body>
</html>
