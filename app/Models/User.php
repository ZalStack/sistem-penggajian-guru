<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'guru_id',
    ];

    protected $visible = [
        'id',
        'name',
        'email',
        'role',
        'guru_id',
        'email_verified_at',
        'created_at',
        'updated_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isGuru(): bool
    {
        return $this->role === 'guru';
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Format email standar guru: namalengkap@satuguru.com
     */
    public static function formatGuruEmail(string $name, ?int $excludeUserId = null): string
    {
        $cleanName = preg_replace('/[^a-z0-9]/', '', strtolower(trim($name)));
        if ($cleanName === '') {
            $cleanName = 'guru';
        }

        $candidate = $cleanName.'@satuguru.com';
        $i = 2;
        while (static::where('email', $candidate)
            ->when($excludeUserId, fn ($q) => $q->where('id', '!=', $excludeUserId))
            ->exists()) {
            $candidate = $cleanName.$i.'@satuguru.com';
            $i++;
        }

        return $candidate;
    }

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if ($user->role === 'guru' && ! empty($user->name)) {
                $cleanName = preg_replace('/[^a-z0-9]/', '', strtolower(trim($user->name)));
                if ($cleanName !== '') {
                    $expectedPrefix = $cleanName;
                    $currentEmail = strtolower(trim((string) $user->email));
                    if (! str_ends_with($currentEmail, '@satuguru.com') || ! str_starts_with($currentEmail, $expectedPrefix)) {
                        $user->email = static::formatGuruEmail($user->name, $user->id);
                    }
                }
            }
        });
    }
}
