<?php

namespace Database\Seeders;

use App\Models\CompanyProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Class DatabaseSeeder
 *
 * Primary database seeder. Populates the admin account, demo SME profile,
 * and calls the OpportunitySeeder.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed initial grant opportunities
        $this->call(OpportunitySeeder::class);

        // 2. Seed Administrator Account
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin User',
                'username' => 'a',
                'email' => 'a@a.com',
                'password' => Hash::make('a'),
                'role' => 'admin',
                'subscription_plan' => 'enterprise',
                'subscription_expires_at' => now()->addYears(5),
            ]
        );

        // 3. Seed Test User Account
        User::firstOrCreate(
            ['username' => 'b'],
            [
                'name' => 'test-user',
                'email' => 'b@b.com',
                'password' => Hash::make('b'),
                'role' => 'user',
                'subscription_plan' => 'pro',
                'subscription_expires_at' => now()->addYears(1),
            ]
        );

        // 3. Seed Demo SME User & Company Profile (Alfa Gyártó Kft.)
        $demoUser = User::firstOrCreate(
            ['username' => 'demo_sme'],
            [
                'name' => 'Kovács Péter',
                'email' => 'demo@alfagyarto.hu',
                'company' => 'Alfa Gyártó Kft.',
                'password' => Hash::make('DemoUser2026!'),
                'role' => 'user',
                'subscription_plan' => 'pro',
                'subscription_expires_at' => now()->addYear(),
            ]
        );

        CompanyProfile::firstOrCreate(
            ['user_id' => $demoUser->id],
            [
                'company_name' => 'Alfa Gyártó Kft.',
                'initials' => 'AG',
                'employees' => 28,
                'headcount' => 28,
                'legal_form' => 'kft',
                'region_code' => 'HU12',
                'county' => 'Pest',
                'county_code' => '13',
                'industry_id' => 'manuf',
                'teaor_code' => '2829',
                'legacy_teaor_code' => '28',
                'revenue_band' => 3,
                'legacy_revenue_band' => '500 M–1 Mrd Ft',
                'exact_revenue' => null,
                'metrics_complete' => true,
                'closed_business_years' => 4,
                'goals' => ['digitalization', 'it', 'machinery'],
                'planned_investment_value' => 30000000,
                'project_name' => 'ERP és gyártásvezérlő rendszer bevezetése',
                'funding_preferences' => ['non_refundable', 'EU', 'HU'],
                'de_minimis_ok' => null, // Left null to demonstrate interactive Q&A
                'country' => 'HU',
                'org_type' => 'sme',
            ]
        );
    }
}
