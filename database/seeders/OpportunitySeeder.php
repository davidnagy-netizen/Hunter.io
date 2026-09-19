<?php

namespace Database\Seeders;

use App\Models\Opportunity;
use Illuminate\Database\Seeder;

/**
 * Class OpportunitySeeder
 *
 * Seeds initial curated reference Hungarian grant calls (GINOP Plusz, KEHOP Plusz,
 * DIMOP Plusz, Széchenyi Terv Plusz, TOP Plusz, KAP).
 */
class OpportunitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $opportunities = [
            [
                'code' => 'ginop-dig',
                'program' => 'GINOP Plusz',
                'title' => 'Vállalati digitalizáció (ERP, gyártásvezérlés)',
                'goals' => ['digitalization', 'it', 'ai'],
                'funding_min' => 5000000,
                'funding_max' => 50000000,
                'intensity' => 0.50,
                'deadline' => '2026-10-30',
                'source_reference' => 'GINOP_PLUSZ_DIG_felhivas_v1.3',
                'source_url' => null,
                'curated' => true,
                'is_new' => true,
                'high_admin' => false,
                'docs' => [
                    'Utolsó lezárt évi beszámoló',
                    'Cégkivonat (30 napnál nem régebbi)',
                    '2 db független árajánlat',
                    'Rövid fejlesztési terv',
                ],
                'hard_rules' => [
                    ['field' => 'employees', 'op' => 'between', 'value' => [5, 249], 'label' => '5–249 fős vállalkozásnak szól'],
                    ['field' => 'region', 'op' => 'not_in', 'value' => ['HU11'], 'label' => 'A megvalósítási helyszín nem lehet Budapest'],
                    ['field' => 'closed_business_years', 'op' => '>=', 'value' => 2, 'label' => 'Legalább 2 lezárt üzleti év szükséges'],
                    ['field' => 'teaor', 'op' => 'not_in', 'value' => ['01', '02', '03'], 'label' => 'Elsődleges mezőgazdasági tevékenység kizárt'],
                    ['field' => 'investment_value', 'op' => 'between', 'value' => [5000000, 100000000], 'label' => 'A projekt mérete 5–100 M Ft között'],
                    ['field' => 'de_minimis_ok', 'op' => '==', 'value' => true, 'label' => 'Szabad de minimis keret szükséges (~300 000 EUR / 3 év)'],
                ],
                'soft_rules' => [
                    ['field' => 'goals', 'op' => 'includes_any', 'value' => ['digitalization', 'it', 'ai'], 'weight' => 0.5],
                    ['field' => 'investment_value', 'op' => 'between', 'value' => [10000000, 60000000], 'weight' => 0.5],
                ],
                'status' => 'open',
            ],
            [
                'code' => 'kehop-energy',
                'program' => 'KEHOP Plusz',
                'title' => 'Vállalati energiahatékonyság és napelem',
                'goals' => ['energy', 'building'],
                'funding_min' => 3000000,
                'funding_max' => 200000000,
                'intensity' => 0.45,
                'deadline' => '2026-11-20',
                'source_reference' => 'KEHOP_PLUSZ_ENERG_felhivas_v2.0',
                'source_url' => null,
                'curated' => true,
                'is_new' => true,
                'high_admin' => false,
                'docs' => [
                    'Energetikai audit / tanúsítvány',
                    'Utolsó lezárt évi beszámoló',
                    'Kivitelezői árajánlat',
                ],
                'hard_rules' => [
                    ['field' => 'employees', 'op' => 'between', 'value' => [1, 249], 'label' => '1–249 fős vállalkozásnak szól'],
                    ['field' => 'closed_business_years', 'op' => '>=', 'value' => 1, 'label' => 'Legalább 1 lezárt üzleti év szükséges'],
                    ['field' => 'investment_value', 'op' => 'between', 'value' => [3000000, 500000000], 'label' => 'A projekt mérete 3–500 M Ft között'],
                ],
                'soft_rules' => [
                    ['field' => 'goals', 'op' => 'includes_any', 'value' => ['energy', 'building'], 'weight' => 0.6],
                ],
                'status' => 'open',
            ],
            [
                'code' => 'dimop-ai',
                'program' => 'DIMOP Plusz',
                'title' => 'Mesterséges intelligencia és szoftverfejlesztés',
                'goals' => ['ai', 'it', 'digitalization'],
                'funding_min' => 10000000,
                'funding_max' => 75000000,
                'intensity' => 0.60,
                'deadline' => '2026-12-15',
                'source_reference' => 'DIMOP_PLUSZ_AI_felhivas_v1.0',
                'source_url' => null,
                'curated' => true,
                'is_new' => true,
                'high_admin' => false,
                'docs' => [
                    'Műszaki specifikáció és architektúraterv',
                    'Utolsó lezárt évi beszámoló',
                    'Referenciák igazolása',
                ],
                'hard_rules' => [
                    ['field' => 'employees', 'op' => 'between', 'value' => [3, 249], 'label' => '3–249 fős cégeknek'],
                    ['field' => 'closed_business_years', 'op' => '>=', 'value' => 2, 'label' => 'Legalább 2 lezárt év'],
                ],
                'soft_rules' => [
                    ['field' => 'goals', 'op' => 'includes_any', 'value' => ['ai', 'it'], 'weight' => 0.7],
                ],
                'status' => 'open',
            ],
            [
                'code' => 'szechenyi-tech',
                'program' => 'Széchenyi Terv Plusz',
                'title' => 'Komplex technológiafejlesztés és modernizáció',
                'goals' => ['machinery', 'digitalization'],
                'funding_min' => 10000000,
                'funding_max' => 100000000,
                'intensity' => 0.50,
                'deadline' => '2026-11-30',
                'source_reference' => 'SZTECH_2026_MOD_v1',
                'source_url' => null,
                'curated' => true,
                'is_new' => false,
                'high_admin' => false,
                'docs' => [
                    'Gépbeszerzési árajánlatok',
                    'Pénzügyi kimutatás',
                ],
                'hard_rules' => [
                    ['field' => 'employees', 'op' => 'between', 'value' => [5, 249], 'label' => '5–249 fős cég'],
                ],
                'soft_rules' => [
                    ['field' => 'goals', 'op' => 'includes_any', 'value' => ['machinery'], 'weight' => 0.5],
                ],
                'status' => 'open',
            ],
        ];

        foreach ($opportunities as $opp) {
            Opportunity::updateOrCreate(['code' => $opp['code']], $opp);
        }
    }
}
