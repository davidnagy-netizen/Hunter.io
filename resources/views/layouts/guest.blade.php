<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Fundor.hu') }} — @yield('title', __('Pályázati Intelligencia'))</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @stack('styles')
</head>
<body style="background: var(--paper); overflow-x: hidden;">
    @unless(request()->routeIs('login'))
        <x-public-navbar />
    @endunless

    <main>
        @if($errors->any() && !session()->has('alert.config'))
            <div role="alert" style="max-width: 760px; margin: 20px auto; padding: 16px; color: var(--red);">
                <ul>
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        @yield('content')
    </main>

    <footer style="padding: 40px 32px; text-align: center; color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); margin-top: 60px;">
        <p>&copy; {{ date('Y') }} {{ __('Fundor.hu — Aetherpontis. Minden jog fenntartva. Laravel 13 alapú architektúra.') }}</p>
    </footer>

    @stack('scripts')
    @include('sweetalert::alert')
</body>
</html>
