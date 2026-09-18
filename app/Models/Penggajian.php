<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penggajian extends Model
{
    use HasFactory;

    protected $fillable = [
        'guru_id',
        'periode',
        'jumlah_sesi',
        'jumlah_hadir',
        'total_jam',
        'transport_id',
        'honor',
        'total_transport',
        'total',
        'status_bayar',
    ];

    protected function casts(): array
    {
        return [
            'jumlah_sesi' => 'integer',
            'jumlah_hadir' => 'integer',
            'total_jam' => 'decimal:2',
            'honor' => 'decimal:2',
            'total_transport' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function transport(): BelongsTo
    {
        return $this->belongsTo(Transport::class);
    }

    public static function calculateForGuru(Guru $guru, string $periode): void
    {
        [$year, $month] = explode('-', $periode);
        $honorPerSesi = $guru->grade->honor_per_sesi ?? 0;

        $attendances = Attendance::with('session.transport')
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'valid')
            ->get();

        if ($attendances->isEmpty()) {
            return;
        }

        $grouped = $attendances->groupBy('session.transport_id');

        foreach ($grouped as $transportId => $groupAttendances) {
            $jumlahHadir = $groupAttendances->count();
            $totalJam = round($groupAttendances->sum('durasi') / 60, 2);
            $biayaTransport = $groupAttendances->first()?->session?->transport?->biaya ?? 0;

            $totalSesi = TeachingSession::where('guru_id', $guru->id)
                ->whereYear('tanggal', $year)
                ->whereMonth('tanggal', $month)
                ->where('transport_id', $transportId)
                ->sum('jumlah_sesi');

            $honor = $jumlahHadir * $honorPerSesi;
            $totalTransport = $jumlahHadir * $biayaTransport;

            static::updateOrCreate(
                ['guru_id' => $guru->id, 'periode' => $periode, 'transport_id' => $transportId],
                [
                    'jumlah_sesi' => $totalSesi,
                    'jumlah_hadir' => $jumlahHadir,
                    'total_jam' => $totalJam,
                    'honor' => $honor,
                    'total_transport' => $totalTransport,
                    'total' => $honor + $totalTransport,
                ]
            );
        }
    }
}
