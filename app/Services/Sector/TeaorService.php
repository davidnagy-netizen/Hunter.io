<?php

declare(strict_types=1);

namespace App\Services\Sector;

use Illuminate\Support\Str;

/** CR-03: versioned KSH classification; split mappings remain explicit candidates. */
final class TeaorService
{
    private array $data;

    public function __construct()
    {
        $this->data = json_decode(file_get_contents(resource_path('data/teaor25.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    public function exists(string $code): bool
    {
        return preg_match('/^[0-9]{4}$/D', $code) && isset($this->data['sectors'][$code]);
    }

    /** @return list<string> All official candidates; empty means unknown. */
    public function fromLegacy(string $code): array
    {
        return $this->data['mapping'][$code] ?? [];
    }

    /** @return list<array{code:string,label:string}> Bounded, accent-insensitive search. */
    public function search(string $query): array
    {
        $query = mb_strtolower(Str::ascii(trim($query)));
        if ($query === '') {
            return [];
        }
        $matches = [];
        foreach ($this->data['sectors'] as $code => $label) {
            if (str_contains((string) $code, $query) || str_contains(mb_strtolower(Str::ascii($label)), $query)) {
                $matches[] = ['code' => (string) $code, 'label' => $label];
            }
        }
        usort($matches, fn ($a, $b) => ($b['code'] === $query) <=> ($a['code'] === $query) ?: strcmp($a['code'], $b['code']));

        return array_slice($matches, 0, 20);
    }
}
