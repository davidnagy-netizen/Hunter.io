<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Lead
 *
 * Captures top-of-funnel prospects from the free readiness assessment or inquiry forms.
 * Tracks company name, contact info, assessment score, and CRM pipeline stage.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $contact_name
 * @property string $email
 * @property string|null $company
 * @property string|null $phone
 * @property string $stage ('lead' | 'contacted' | 'qualified' | 'converted' | 'dormant')
 * @property int|null $readiness_score
 * @property array<string, mixed>|null $answers
 * @property string|null $note
 * @property string|null $source ('assessment' | 'contact_form' | 'manual')
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Lead extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'contact_name',
        'email',
        'company',
        'phone',
        'stage',
        'readiness_score',
        'answers',
        'note',
        'source',
    ];

    /**
     * Attribute type casting definitions.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'readiness_score' => 'integer',
            'answers' => 'array',
        ];
    }

    /**
     * Get the registered user converted from this lead, if any.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
