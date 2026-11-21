<?php

namespace App\Services;

use App\Models\Guru;
use App\Models\TeachingSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AdikSyncService
{
    /**
     * Push Guru model data to SI ADIK-KK (Web Induk KPM)
     */
    public static function pushTeacherToAdik(Guru $guru): bool
    {
        $baseUrl = rtrim((string) config('services.adik.base_url', 'https://kelas-khusus.kpmacademic.io'), '/');
        $apiKey = (string) config('services.adik.api_key', 'kpm-satellite-secret-key-2026');

        if (empty($baseUrl)) {
            return false;
        }

        try {
            $guru->loadMissing(['user', 'grade']);

            $payload = [
                'id' => $guru->id,
                'nama' => $guru->nama,
                'email' => $guru->user?->email,
                'mapel' => $guru->mapel,
                'jenjang' => $guru->jenjang,
                'domisili' => $guru->domisili,
                'alamat' => $guru->alamat,
                'tanggal_bergabung' => $guru->tanggal_bergabung?->toDateString(),
                'pelatihan_suprarasional' => (bool) $guru->pelatihan_suprarasional,
                'nomor_telepon' => $guru->nomor_telepon,
                'tunjangan_khusus' => (float) $guru->tunjangan_khusus,
                'bank' => $guru->bank,
                'nomor_rekening' => $guru->nomor_rekening,
                'lama_mengajar' => $guru->lama_mengajar,
                'riwayat_pendidikan' => $guru->riwayat_pendidikan,
                'riwayat_mengajar' => $guru->riwayat_mengajar,
                'keterangan_mengajar' => $guru->keterangan_mengajar,
                'is_active_this_week' => (bool) ($guru->is_active_this_week ?? true),
                'grade' => $guru->grade ? [
                    'id' => $guru->grade->id,
                    'kode_grade' => $guru->grade->kode_grade,
                ] : null,
            ];

            $response = Http::timeout(6)
                ->withHeaders([
                    'X-API-Key' => $apiKey,
                    'Accept' => 'application/json',
                ])
                ->post("{$baseUrl}/api/v1/siguru/teachers/sync", $payload);

            if ($response->successful()) {
                Log::info("AdikSyncService: Berhasil menyinkronkan Guru #{$guru->id} ({$guru->nama}) ke SI ADIK-KK.");

                return true;
            }

            Log::warning("AdikSyncService: Gagal menyinkronkan Guru #{$guru->id} ke SI ADIK-KK [HTTP {$response->status()}]: ".$response->body());
        } catch (\Throwable $e) {
            Log::warning("AdikSyncService exception syncing Guru #{$guru->id} to SI ADIK-KK: ".$e->getMessage());
        }

        return false;
    }

    /**
     * Push TeachingSession (sesi mengajar Kelas Khusus) ke SI ADIK-KK
     */
    public static function pushScheduleToAdik(TeachingSession $session, string $action = 'upsert'): bool
    {
        $baseUrl = rtrim((string) config('services.adik.base_url', 'https://kelas-khusus.kpmacademic.io'), '/');
        $apiKey = (string) config('services.adik.api_key', 'kpm-satellite-secret-key-2026');

        if (empty($baseUrl)) {
            return false;
        }

        try {
            $session->loadMissing(['guru.user', 'program', 'material']);

            // Validasi filter program: pastikan hanya program Kelas Khusus
            $programName = strtolower((string) ($session->program?->nama ?? ''));
            $programSlug = strtolower((string) ($session->program?->slug ?? ''));
            $isKelasKhusus = str_contains($programName, 'khusus') || $programSlug === 'kelas-khusus' || str_contains(strtolower((string) $session->kelas), 'khusus');

            // Jika bukan kelas khusus dan bukan delete yang mungkin terkait, lewati
            if (! $isKelasKhusus && $action !== 'delete') {
                return false;
            }

            $jamMulai = $session->jam_mulai ? $session->jam_mulai->format('H:i') : null;
            $jamSelesai = $session->jam_selesai ? $session->jam_selesai->format('H:i') : null;
            $sessionTime = $session->session_time ?: ($jamMulai && $jamSelesai ? "{$jamMulai} - {$jamSelesai}" : null);

            $payload = [
                'action' => $action,
                'siguru_session_id' => $session->id,
                'guru_id' => $session->guru_id,
                'guru_nama' => $session->guru?->nama,
                'guru_email' => $session->guru?->user?->email,
                'kelas' => $session->kelas,
                'level' => $session->level,
                'bidang' => in_array(strtoupper((string) $session->mapel), ['IPA', 'MTK']) ? strtoupper((string) $session->mapel) : 'MTK',
                'mapel' => $session->mapel,
                'pekan' => (int) ($session->pekan ?: 1),
                'session_date' => $session->tanggal ? Carbon::parse($session->tanggal)->toDateString() : null,
                'tanggal' => $session->tanggal ? Carbon::parse($session->tanggal)->toDateString() : null,
                'session_time' => $sessionTime,
                'jam_mulai' => $jamMulai,
                'jam_selesai' => $jamSelesai,
                'bahan_ajar' => $session->material?->title ?: $session->bahan_ajar,
                'is_active' => (bool) $session->is_active,
                'notes' => $session->catatan ?: $session->bahan_ajar,
            ];

            $response = Http::timeout(6)
                ->withHeaders([
                    'X-API-Key' => $apiKey,
                    'Accept' => 'application/json',
                ])
                ->post("{$baseUrl}/api/v1/teaching-schedules/sync-from-siguru", $payload);

            if ($response->successful()) {
                Log::info("AdikSyncService: Berhasil sync sesi mengajar #{$session->id} ({$action}) ke SI ADIK-KK.");

                return true;
            }

            Log::warning("AdikSyncService: Gagal sync sesi mengajar #{$session->id} ke SI ADIK-KK [HTTP {$response->status()}]: ".$response->body());
        } catch (\Throwable $e) {
            Log::warning("AdikSyncService exception syncing TeachingSession #{$session->id} to SI ADIK-KK: ".$e->getMessage());
        }

        return false;
    }
}
