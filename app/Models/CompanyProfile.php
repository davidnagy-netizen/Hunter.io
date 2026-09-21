<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Class CompanyProfile
 *
 * Stores the structured SME funding attributes used by the eligibility
 * and scoring engines (TEÁOR code, region, headcounts, development goals, etc.).
 *
 * @property int $id
 * @property int $user_id
 * @property string $company_name
 * @property string|null $initials
 * @property int $employees
 * @property string $region_code
 * @property string $county
 * @property string $industry_id
 * @property string $teaor_code
 * @property string $revenue_band
 * @property int $closed_business_years
 * @property array<string> $goals
 * @property float $planned_investment_value
 * @property string|null $project_name
 * @property array<string>|null $funding_preferences
 * @property bool|null $de_minimis_ok
 * @property bool|null $consortium_ready
 * @property bool|null $eu_experience
 * @property string $country
 * @property string $org_type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class CompanyProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'company_name',
        'initials',
        'employees',
        'region_code',
        'county',
        'industry_id',
        'teaor_code',
        'revenue_band',
        'closed_business_years',
        'goals',
        'planned_investment_value',
        'project_name',
        'funding_preferences',
        'de_minimis_ok',
        'consortium_ready',
        'eu_experience',
        'country',
        'org_type',
    ];

    /**
     * Attribute type casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'employees' => 'integer',
            'closed_business_years' => 'integer',
            'planned_investment_value' => 'decimal:2',
            'goals' => 'array',
            'funding_preferences' => 'array',
            'de_minimis_ok' => 'boolean',
            'consortium_ready' => 'boolean',
            'eu_experience' => 'boolean',
        ];
    }

    /**
     * Get the user that owns this company profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
