<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'guru_id', 'session_id', 'checkin_time', 'checkin_lat', 'checkin_lng', 'checkin_accuracy',
        'checkout_time', 'checkout_lat', 'checkout_lng', 'checkout_accuracy', 'durasi', 'status', 'tanggal',
    ];

    protected function casts(): array
    {
        return [
            'checkin_time' => 'datetime',
            'checkout_time' => 'datetime',
            'checkin_lat' => 'float',
            'checkin_lng' => 'float',
            'checkin_accuracy' => 'float',
            'checkout_lat' => 'float',
            'checkout_lng' => 'float',
            'checkout_accuracy' => 'float',
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
        $lat1 = deg2rad($lat1);
        $lng1 = deg2rad($lng1);
        $lat2 = deg2rad($lat2);
        $lng2 = deg2rad($lng2);

        $dLng = $lng2 - $lng1;

        $a = \cos($lat2) * \sin($dLng);
        $b = \cos($lat1) * \sin($lat2) - \sin($lat1) * \cos($lat2) * \cos($dLng);
        $c = \sin($lat1) * \sin($lat2) + \cos($lat1) * \cos($lat2) * \cos($dLng);

        $dLng = \atan2(\sqrt($a * $a + $b * $b), $c);
        $dLng = $dLng == 0 ? 0 : $dLng * 6371000;

        return $dLng;
    }

    public static function calculateDuration($checkin, $checkout): int
    {
        if (! $checkin || ! $checkout) {
            return 0;
        }

        return (int) $checkin->diffInMinutes($checkout);
    }
}
