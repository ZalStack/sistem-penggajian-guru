<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class Penggajian extends Model
{
    use HasFactory;

    public const STATUS_BELUM = 'belum_dibayar';

    public const STATUS_SUDAH = 'sudah_dibayar';

    protected $fillable = [
        'guru_id',
        'periode',
        'jumlah_sesi',
        'jumlah_hadir',
        'total_jam',
        'transport_id',
        'honor',
        'total_transport',
        'tunjangan_khusus',
        'detail',
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
            'tunjangan_khusus' => 'decimal:2',
            'total' => 'decimal:2',
            'detail' => 'array',
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

    public function scopeForPeriod($query, string $periode)
    {
        return $query->where('periode', $periode);
    }

    public function scopePaid($query)
    {
        return $query->where('status_bayar', self::STATUS_SUDAH);
    }

    /**
     * Rincian perhitungan honor per jenis kelas & transport.
     *
     * @return Collection<int, array{program_id: int|null, program: string, transport_id: int|null, transport: string, jumlah_sesi: int, jumlah_hadir: int, honor: float, transport_biaya: float, total: float}>
     */
    public function rincian(): Collection
    {
        return collect($this->detail ?? [])->map(fn ($row) => (array) $row);
    }

    /**
     * Hitung ulang rekap honor satu guru untuk periode tertentu.
     *
     * Rekap disimpan dalam SATU baris per guru per periode sehingga tidak ada
     * penghitungan ganda ketika guru mengajar beberapa jenis kelas atau beberapa
     * sesi. Rincian per program & transport disimpan pada kolom `detail`.
     *
     * Baris yang sudah dibayar tidak dihitung ulang maupun dihapus.
     */
    public static function calculateForGuru(Guru $guru, string $periode): void
    {
        [$year, $month] = explode('-', $periode);
        $existing = static::where('guru_id', $guru->id)->where('periode', $periode)->first();

        if ($existing && $existing->status_bayar === self::STATUS_SUDAH) {
            return;
        }

        $honorPerSesi = (float) ($guru->grade?->honor_per_sesi ?? 0);
        $tunjanganKhusus = (float) ($guru->tunjangan_khusus ?? 0);

        $attendances = Attendance::with('session.program', 'session.transport')
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'valid')
            ->get();

        if ($attendances->isEmpty()) {
            $existing?->delete();

            return;
        }

        $scheduledSessions = TeachingSession::aktif()
            ->with('program', 'transport')
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->get();

        $detail = static::buildDetail($attendances, $scheduledSessions, $honorPerSesi);

        $jumlahHadir = (int) $attendances->count();
        $totalJam = round($attendances->sum('durasi') / 60, 2);
        $honor = $jumlahHadir * $honorPerSesi;
        $totalTransport = collect($detail)->sum('transport_biaya');

        static::updateOrCreate(
            ['guru_id' => $guru->id, 'periode' => $periode],
            [
                'jumlah_sesi' => (int) $scheduledSessions->sum('jumlah_sesi'),
                'jumlah_hadir' => $jumlahHadir,
                'total_jam' => $totalJam,
                'transport_id' => null,
                'honor' => $honor,
                'total_transport' => $totalTransport,
                'tunjangan_khusus' => $tunjanganKhusus,
                'detail' => $detail,
                'total' => $honor + $totalTransport + $tunjanganKhusus,
            ]
        );
    }

    /**
     * Susun rincian per (program, transport) dari data kehadiran valid +
     * sesi terjadwal, tanpa pernah menghitung sesi yang dibatalkan.
     *
     * @param  Collection<int, Attendance>  $attendances
     * @param  Collection<int, TeachingSession>  $scheduledSessions
     * @return array<int, array{program_id: int|null, program: string, transport_id: int|null, transport: string, jumlah_sesi: int, jumlah_hadir: int, honor: float, transport_biaya: float, total: float}>
     */
    protected static function buildDetail(Collection $attendances, Collection $scheduledSessions, float $honorPerSesi): array
    {
        $rows = [];

        foreach ($attendances->groupBy(function (Attendance $attendance) {
            $programId = $attendance->session?->program_id;
            $transportId = $attendance->session?->transport_id;

            return ($programId === null ? '' : (string) $programId).'|'.($transportId === null ? '' : (string) $transportId);
        }) as $key => $group) {
            [$programId, $transportId] = explode('|', $key);
            $first = $group->first();

            $jumlahHadir = (int) $group->count();
            $programNama = $first->session?->program?->nama ?? 'Tanpa Program';
            $transportNama = $first->session?->transport?->jenis ?? 'Tanpa Transport';
            $biayaTransport = (float) ($first->session?->transport?->biaya ?? 0);

            $honor = $jumlahHadir * $honorPerSesi;
            $transportBiaya = $jumlahHadir * $biayaTransport;

            $rows[] = [
                'program_id' => $programId === '' ? null : (int) $programId,
                'program' => $programNama,
                'transport_id' => $transportId === '' ? null : (int) $transportId,
                'transport' => $transportNama,
                'jumlah_sesi' => (int) $scheduledSessions
                    ->where('program_id', $programId === '' ? null : (int) $programId)
                    ->where('transport_id', $transportId === '' ? null : (int) $transportId)
                    ->sum('jumlah_sesi'),
                'jumlah_hadir' => $jumlahHadir,
                'honor' => $honor,
                'transport_biaya' => $transportBiaya,
                'total' => $honor + $transportBiaya,
            ];
        }

        usort($rows, fn (array $a, array $b) => [$a['program'], $a['transport']] <=> [$b['program'], $b['transport']]);

        return $rows;
    }
}
