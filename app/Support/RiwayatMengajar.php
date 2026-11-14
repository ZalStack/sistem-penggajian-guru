<?php

namespace App\Support;

use App\Models\Guru;
use App\Models\TeachingSession;
use Illuminate\Support\Collection;

/**
 * Pembentuk riwayat mengajar per guru pada periode tertentu.
 *
 * Dipakai bersama oleh modul Penggajian dan Laporan sehingga format data
 * riwayat (kelas khusus & reguler) serta potensi gajinya selalu sama.
 */
class RiwayatMengajar
{
    /**
     * @param  Collection<int, int|string>  $guruIds
     * @param  string  $periode  format Y-m
     * @return array<int, array{sessions: array<int, array<string, mixed>>, total_sesi: int, sesi_khusus: int, sesi_reguler: int, potensi_gaji: float}>
     */
    public static function perPeriode(Collection $guruIds, string $periode): array
    {
        $guruIds = $guruIds->filter()->unique()->values();

        if ($guruIds->isEmpty()) {
            return [];
        }

        [$tahun, $bulan] = explode('-', $periode);

        $sessions = TeachingSession::with(['program', 'location', 'attendances'])
            ->aktif()
            ->whereIn('guru_id', $guruIds)
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan)
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->get();

        $gurus = Guru::with('grade')->whereIn('id', $guruIds)->get()->keyBy('id');

        $riwayat = [];

        foreach ($guruIds as $guruId) {
            $guruSessions = $sessions->where('guru_id', $guruId)->values();
            $guru = $gurus->get($guruId);

            $honorPerSesi = (float) ($guru?->grade?->honor_per_sesi ?? 0);
            $tunjangan = (float) ($guru?->tunjangan_khusus ?? 0);

            $totalSesi = (int) $guruSessions->sum('jumlah_sesi');
            $sesiKhusus = (int) $guruSessions
                ->filter(fn (TeachingSession $s) => str_contains(strtolower($s->program?->nama ?? ''), 'khusus'))
                ->sum('jumlah_sesi');

            $riwayat[(int) $guruId] = [
                'sessions' => $guruSessions->map(fn (TeachingSession $s) => [
                    'id' => $s->id,
                    'tanggal' => $s->tanggal->toDateString(),
                    'tanggal_label' => Tanggal::format($s->tanggal, 'd M Y'),
                    'hari' => Tanggal::hari($s->tanggal),
                    'pekan' => (int) $s->pekan,
                    'jam_mulai' => $s->jam_mulai->format('H:i'),
                    'jam_selesai' => $s->jam_selesai->format('H:i'),
                    'jumlah_sesi' => (int) $s->jumlah_sesi,
                    'bahan_ajar' => $s->bahan_ajar,
                    'mapel' => $s->mapel,
                    'program' => $s->program?->nama,
                    'lokasi' => $s->location?->nama_lokasi ?? '-',
                    'status' => $s->effective_status,
                ])->all(),
                'total_sesi' => $totalSesi,
                'sesi_khusus' => $sesiKhusus,
                'sesi_reguler' => $totalSesi - $sesiKhusus,
                'potensi_gaji' => round(($totalSesi * $honorPerSesi) + $tunjangan, 2),
            ];
        }

        return $riwayat;
    }
}
