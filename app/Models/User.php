<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * Class User
 *
 * Represents an authenticated user (SME account owner or platform administrator).
 *
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string $email
 * @property string|null $company
 * @property string $password
 * @property string $role ('user' | 'admin')
 * @property string|null $subscription_plan
 * @property Carbon|null $subscription_expires_at
 * @property bool $disabled
 * @property Carbon|null $last_login_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'verification_required', 'email_verified_at',
        'name',
        'username',
        'email',
        'company',
        'password',
        'role',
        'subscription_plan',
        'subscription_expires_at',
        'disabled',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'verification_required' => 'boolean',
            'email_verified_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'disabled' => 'boolean',
        ];
    }

    /**
     * Get the structured company profile owned by this user.
     */
    public function companyProfile(): HasOne
    {
        return $this->hasOne(CompanyProfile::class);
    }

    /**
     * Get the leads associated with this user.
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    /**
     * Check if the user has an active administrative role.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if the user has an active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return $this->subscription_expires_at !== null && $this->subscription_expires_at->isFuture();
    }
}
