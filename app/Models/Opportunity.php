<?php

namespace App\Models;

use App\Enums\InstrumentType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

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
 * @property Carbon $deadline
 * @property string $source_reference
 * @property string|null $source_url
 * @property bool $curated
 * @property bool $is_new
 * @property bool $high_admin
 * @property array<string> $docs
 * @property array<array<string, mixed>> $hard_rules
 * @property array<array<string, mixed>> $soft_rules
 * @property string $status ('open' | 'closed' | 'forthcoming')
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
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
        'instrument_type',
        'effective_from_date',
        'source_document_reference',
        'last_verified_date',
        'manual_reviewed_by',
        'loan_terms',
    ];

    /**
     * Attribute type casting definitions.
     *
     * Reference: CR-02 Section 4.2 - Enforcing InstrumentType enum casting.
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
            'instrument_type' => InstrumentType::class,
            'effective_from_date' => 'date',
            'last_verified_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Opportunity $opportunity) {
            $opportunity->instrument_type ??= InstrumentType::GRANT;
            if ($opportunity->instrument_type->isDebtInstrument()) {
                Validator::make(array_replace($opportunity->getAttributes(), [
                    'effective_from_date' => $opportunity->effective_from_date?->toDateString(),
                    'last_verified_date' => $opportunity->last_verified_date?->toDateString(),
                ]), [
                    'effective_from_date' => 'required|date_format:Y-m-d',
                    'source_document_reference' => 'required|string|max:255',
                    'last_verified_date' => 'required|date_format:Y-m-d|before_or_equal:today',
                    'manual_reviewed_by' => 'required|string|max:255',
                    'loan_terms' => 'required|string',
                    'curated' => 'required|accepted',
                ])->validate();
            }
        });
    }

    /**
     * Scope a query to only include open funding opportunities.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope a query to strictly filter non-repayable grant opportunities.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeGrants($query)
    {
        return $query->whereIn('instrument_type', [
            InstrumentType::GRANT->value,
        ]);
    }

    /**
     * Scope a query to strictly filter debt/loan instruments (e.g. Kavosz Széchenyi products).
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeLoans($query)
    {
        return $query->whereIn('instrument_type', [
            InstrumentType::SUBSIDISED_LOAN->value,
            InstrumentType::GUARANTEE->value,
            InstrumentType::COMBINED->value,
        ]);
    }

    /**
     * Check if this opportunity is a loan product.
     *
     * @return bool True if this instrument contains a debt obligation.
     */
    public function isLoan(): bool
    {
        return $this->instrument_type instanceof InstrumentType
            ? $this->instrument_type->isDebtInstrument()
            : in_array($this->instrument_type, [InstrumentType::SUBSIDISED_LOAN->value, InstrumentType::GUARANTEE->value, InstrumentType::COMBINED->value], true);
    }

    /**
     * Check if this opportunity is a non-repayable grant.
     *
     * @return bool True only for a standalone grant.
     */
    public function isGrant(): bool
    {
        return $this->instrument_type instanceof InstrumentType
            ? $this->instrument_type->isGrant()
            : $this->instrument_type === InstrumentType::GRANT->value;
    }

    /**
     * Calculate remaining days until submission deadline relative to a given date.
     */
    public function daysRemaining(?Carbon $now = null): int
    {
        $now = $now ?? now();

        return (int) $now->diffInDays($this->deadline, false);
    }
}
