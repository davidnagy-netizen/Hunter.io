<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Opportunity
 *
 * Represents an open or forthcoming grant / funding call (e.g. GINOP, KEHOP, Széchenyi).
 * Stores funding boundaries, intensity, declarative hard/soft eligibility rules, and document requirements.
 *
 * @property int $id
 * @property string $code (Unique slug/identifier like 'ginop-dig')
 * @property string $program (Framework program, e.g. 'GINOP Plusz')
 * @property string $title
 * @property array<string> $goals
 * @property float $funding_min
 * @property float $funding_max
 * @property float $intensity (e.g. 0.50 for 50% non-repayable grant rate)
 * @property \Illuminate\Support\Carbon $deadline
 * @property string $source_reference
 * @property string|null $source_url
 * @property bool $curated
 * @property bool $is_new
 * @property bool $high_admin
 * @property array<string> $docs
 * @property array<array<string, mixed>> $hard_rules
 * @property array<array<string, mixed>> $soft_rules
 * @property string $status ('open' | 'closed' | 'forthcoming')
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Opportunity extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'program',
        'title',
        'goals',
        'funding_min',
        'funding_max',
        'intensity',
        'deadline',
        'source_reference',
        'source_url',
        'curated',
        'is_new',
        'high_admin',
        'docs',
        'hard_rules',
        'soft_rules',
        'status',
    ];

    /**
     * Attribute type casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'goals' => 'array',
            'funding_min' => 'decimal:2',
            'funding_max' => 'decimal:2',
            'intensity' => 'float',
            'deadline' => 'date',
            'curated' => 'boolean',
            'is_new' => 'boolean',
            'high_admin' => 'boolean',
            'docs' => 'array',
            'hard_rules' => 'array',
            'soft_rules' => 'array',
        ];
    }

    /**
     * Scope a query to only include open funding opportunities.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Calculate remaining days until submission deadline relative to a given date.
     *
     * @param  \Illuminate\Support\Carbon|null  $now
     * @return int
     */
    public function daysRemaining(?\Illuminate\Support\Carbon $now = null): int
    {
        $now = $now ?? now();
        return (int) $now->diffInDays($this->deadline, false);
    }
}
