<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'guru_id', 'session_id', 'checkin_time', 'checkin_lat', 'checkin_lng',
        'checkout_time', 'checkout_lat', 'checkout_lng', 'durasi', 'status', 'tanggal',
    ];

    protected function casts(): array
    {
        return [
            'checkin_time' => 'datetime',
            'checkout_time' => 'datetime',
            'checkin_lat' => 'float',
            'checkin_lng' => 'float',
            'checkout_lat' => 'float',
            'checkout_lng' => 'float',
            'durasi' => 'integer',
            'tanggal' => 'date',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TeachingSession::class, 'session_id');
    }

    public static function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = \sin($dLat / 2) * \sin($dLat / 2) + \cos(\deg2rad($lat1)) * \cos(\deg2rad($lat2)) * \sin($dLng / 2) * \sin($dLng / 2);
        $c = 2 * \atan2(\sqrt($a), \sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public static function calculateDuration($checkin, $checkout): int
    {
        if (! $checkin || ! $checkout) {
            return 0;
        }

        return (int) $checkin->diffInMinutes($checkout);
    }
}
