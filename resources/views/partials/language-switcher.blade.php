<form action="{{ route('locale.update') }}" method="POST" class="language-toggle" role="group" aria-label="{{ __('Nyelv') }}">
    @csrf
    <input type="hidden" name="return_to" value="{{ request()->getRequestUri() }}">
    @foreach(config('localization.locales') as $code => $name)
        <button type="submit" name="locale" value="{{ $code }}" class="language-toggle-option"
            lang="{{ $code }}" aria-pressed="{{ app()->getLocale() === $code ? 'true' : 'false' }}">
            {{ $name }}
        </button>
    @endforeach
</form>
