<?php

namespace App\Integrations\Catalog;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class CatalogFeedClient
{
    public function fetch(): array
    {
        $url = config('fundor.catalog_feed_url');
        $host = strtolower(rtrim((string) parse_url($url, PHP_URL_HOST), '.'));
        if ($host === 'kavosz.hu' || str_ends_with($host, '.kavosz.hu')) {
            throw new \InvalidArgumentException('Kavosz data requires manual document review (CR-02).');
        }
        // Only a deployment-controlled normalized feed is accepted; requests cannot choose a URL.
        $response = Http::acceptJson()->withoutRedirecting()->timeout(60)->get($url)->throw();
        if (! $response->successful()) {
            throw new \RuntimeException('Catalog feed must return a successful response without redirects.');
        }
        $payload = $response->json();
        Validator::make($payload ?? [], ['opportunities' => 'required|array|min:1', 'opportunities.*.id' => 'required|string|max:255|distinct',
            'opportunities.*.instrument_type' => 'required|in:grant',
            'opportunities.*.title' => 'required|string|max:255', 'opportunities.*.program' => 'required|string|max:255',
            'opportunities.*.deadline' => 'required|date_format:Y-m-d', 'opportunities.*.intensity' => 'required|numeric|min:0|max:1',
            'opportunities.*.goals' => 'present|array', 'opportunities.*.hard' => 'present|array',
            'opportunities.*.fundingMin' => 'nullable|numeric|min:0|max:9999999999999', 'opportunities.*.fundingMax' => 'nullable|numeric|min:0|max:9999999999999',
            'opportunities.*.status' => 'sometimes|in:open,forthcoming', 'opportunities.*.hard.*.field' => 'required|string',
            'opportunities.*.hard.*.op' => 'required|in:between,in,not_in,>=,<=,==,includes_any', 'opportunities.*.hard.*.value' => 'present',
            'opportunities.*.goals.*' => 'string', 'opportunities.*.docs' => 'sometimes|array', 'opportunities.*.docs.*' => 'string',
            'opportunities.*.soft' => 'sometimes|array', 'opportunities.*.soft.*.field' => 'required|string',
            'opportunities.*.soft.*.op' => 'required|in:between,in,not_in,>=,<=,==,includes_any', 'opportunities.*.soft.*.value' => 'present',
            'opportunities.*.soft.*.weight' => 'sometimes|numeric|min:0', 'opportunities.*.consortium' => 'sometimes|array',
            'opportunities.*.consortium.required' => 'sometimes|boolean', 'opportunities.*.summary' => 'sometimes|string',
            'opportunities.*.description' => 'sometimes|string', 'opportunities.*.smeFit' => 'sometimes|numeric|min:0|max:1',
            'opportunities.*.partnerShare' => 'sometimes|nullable|array', 'opportunities.*.partnerShare.minHuf' => 'sometimes|numeric|min:0',
            'opportunities.*.partnerShare.maxHuf' => 'sometimes|numeric|min:0', 'opportunities.*.sectors' => 'sometimes|array',
            'opportunities.*.applicantTypes' => 'sometimes|array', 'opportunities.*.goalScores' => 'sometimes|array'])->validate();

        return $payload;
    }
}
