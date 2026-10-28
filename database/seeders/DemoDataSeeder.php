<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Notification;
use App\Models\Penggajian;
use App\Models\Perizinan;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Support\Tanggal;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Data dummy lintas modul untuk preview & pengujian:
 * sesi mengajar (lintas minggu), presensi, perizinan, notifikasi,
 * dan rekap penggajian konsolidasi per guru per periode.
 *
 * Jalankan setelah DatabaseSeeder: php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (TeachingSession::count() > 0) {
            $this->command?->info('Sesi mengajar sudah ada — data demo tidak dibuat ulang.');

            return;
        }

        $gurus = Guru::with('grade', 'programs')->get();
        $locations = Location::all();
        $transports = Transport::all();
        $programs = Program::orderBy('urutan')->get();

        if ($gurus->isEmpty() || $locations->isEmpty() || $transports->isEmpty() || $programs->isEmpty()) {
            $this->command?->warn('Jalankan DatabaseSeeder terlebih dahulu.');

            return;
        }

        $today = Carbon::today();
        // 4 minggu lalu (agar periode sebelumnya ikut terisi) + 2 minggu ke depan.
        $startOfWeek = $today->copy()->startOfWeek()->subWeeks(4);
        $slots = [
            ['08:00', '09:30'],
            ['09:45', '11:15'],
            ['13:00', '14:30'],
            ['15:00', '16:30'],
        ];

        // Buat sesi selama 6 minggu: 4 minggu lalu sampai 2 minggu depan.
        for ($dayOffset = 0; $dayOffset < 42; $dayOffset++) {
            $tanggal = $startOfWeek->copy()->addDays($dayOffset);
            $hari = $tanggal->dayOfWeek; // 0 Minggu ... 6 Sabtu

            // Hanya hari kerja (Senin–Jumat).
            if ($hari < 1 || $hari > 5) {
                continue;
            }

            foreach ($gurus as $index => $guru) {
                // Rotasi: tiap guru mengajar 3 hari kerja dari 5 hari kerja per minggu.
                if ((($hari + $index) % 5) >= 3) {
                    continue;
                }

                $program = $guru->programs->count() > 0
                    ? $guru->programs[($dayOffset + $index) % $guru->programs->count()]
                    : $programs->first();

                [$jamMulai, $jamSelesai] = $slots[($dayOffset + $index) % count($slots)];

                $status = TeachingSession::STATUS_DIJADWALKAN;
                if ($tanggal->isBefore($today)) {
                    // Jumat pertama: guru pertama dibatalkan — memperlihatkan status "Dibatalkan".
                    $dibatalkan = $tanggal->isFriday() && $index === 0 && (int) $tanggal->format('W') % 2 === 1;
                    $status = $dibatalkan
                        ? TeachingSession::STATUS_DIBATALKAN
                        : TeachingSession::STATUS_SELESAI;
                }

                $session = TeachingSession::create([
                    'guru_id' => $guru->id,
                    'location_id' => $locations[$index % $locations->count()]->id,
                    'transport_id' => $transports[$guru->id % $transports->count()]->id,
                    'program_id' => $program->id,
                    'mapel' => $guru->mapel,
                    'tanggal' => $tanggal,
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'jumlah_sesi' => 2,
                    'status' => $status,
                ]);

                // Presensi hanya untuk sesi terjadwal yang sudah lewat & tidak dibatalkan.
                if ($status === TeachingSession::STATUS_SELESAI && $tanggal->isBefore($today)) {
                    $checkin = Carbon::parse($tanggal->toDateString().' '.$jamMulai)->subMinutes(rand(0, 10));
                    $checkout = Carbon::parse($tanggal->toDateString().' '.$jamSelesai)->addMinutes(rand(0, 15));
                    $hadir = ($dayOffset + $index) % 7 !== 0; // sesekali tidak hadir

                    Attendance::create([
                        'guru_id' => $guru->id,
                        'session_id' => $session->id,
                        'checkin_time' => $hadir ? $checkin : null,
                        'checkin_lat' => $hadir ? $locations[$index % $locations->count()]->latitude : null,
                        'checkin_lng' => $hadir ? $locations[$index % $locations->count()]->longitude : null,
                        'checkout_time' => $hadir ? $checkout : null,
                        'checkout_lat' => $hadir ? $locations[$index % $locations->count()]->latitude : null,
                        'checkout_lng' => $hadir ? $locations[$index % $locations->count()]->longitude : null,
                        'durasi' => $hadir ? (int) $checkin->diffInMinutes($checkout) : 0,
                        'status' => $hadir ? 'valid' : 'belum_checkin',
                        'tanggal' => $tanggal,
                    ]);
                }
            }
        }

        // Perizinan contoh.
        Perizinan::create([
            'guru_id' => $gurus[0]->id,
            'jenis' => 'sakit',
            'tanggal_mulai' => $today->copy()->addDays(2),
            'tanggal_selesai' => $today->copy()->addDays(3),
            'alasan' => 'Demam dan perlu istirahat sesuai anjuran dokter.',
            'status' => Perizinan::STATUS_PENDING,
        ]);

        Perizinan::create([
            'guru_id' => $gurus[1]->id,
            'jenis' => 'izin',
            'tanggal_mulai' => $today->copy()->subDays(5),
            'tanggal_selesai' => $today->copy()->subDays(5),
            'alasan' => 'Mengurus administrasi keluarga.',
            'status' => Perizinan::STATUS_DISETUJUI,
            'catatan_admin' => 'Disetujui, sesi hari itu dialihkan.',
        ]);

        Perizinan::create([
            'guru_id' => $gurus[2]->id,
            'jenis' => 'cuti',
            'tanggal_mulai' => $today->copy()->addWeek(),
            'tanggal_selesai' => $today->copy()->addWeek()->addDays(4),
            'alasan' => 'Cuti tahunan keluarga.',
            'status' => Perizinan::STATUS_DITOLAK,
            'catatan_admin' => 'Bertabrakan dengan jadwal ujian, mohon pilih minggu lain.',
        ]);

        // Perizinan disetujui yang berlaku hari ini: rekap presensi hari ini
        // menampilkannya sebagai status "Izin" dan check-in guru dinonaktifkan.
        $sesiTertutupIzin = TeachingSession::query()
            ->aktif()
            ->whereDate('tanggal', $today)
            ->orderBy('jam_mulai')
            ->first();

        if ($sesiTertutupIzin) {
            Perizinan::create([
                'guru_id' => $sesiTertutupIzin->guru_id,
                'session_id' => $sesiTertutupIzin->id,
                'jenis' => 'sakit',
                'tanggal_mulai' => $today,
                'tanggal_selesai' => $today,
                'alasan' => 'Sakit dan dianjurkan istirahat oleh dokter.',
                'status' => Perizinan::STATUS_DISETUJUI,
                'catatan_admin' => 'Disetujui, sesi hari ini tidak perlu di-check-in.',
            ]);
        }

        // Tidak boleh ada presensi pada tanggal yang tertutup perizinan disetujui:
        // rekap admin akan menampilkan status "Izin" untuk sesi-sesi tersebut.
        Perizinan::where('status', Perizinan::STATUS_DISETUJUI)->get()->each(function (Perizinan $izin) {
            $dihapus = Attendance::where('guru_id', $izin->guru_id)
                ->whereBetween('tanggal', [
                    $izin->tanggal_mulai->toDateString(),
                    $izin->tanggal_selesai->toDateString(),
                ])
                ->delete();

            if ($dihapus > 0) {
                $this->command?->info('Presensi pada tanggal izin disetujui ('.$izin->rentangTanggal().') dihapus: '.$dihapus.' baris.');
            }
        });

        // Hitung rekap penggajian untuk periode berjalan & periode sebelumnya.
        $periodeBerjalan = $today->format('Y-m');
        $periodeLalu = $today->copy()->subMonth()->format('Y-m');

        foreach ([$periodeBerjalan, $periodeLalu] as $periode) {
            foreach ($gurus as $guru) {
                Penggajian::calculateForGuru($guru, $periode);
            }
        }

        // Tandai separuh rekap periode lalu sebagai sudah dibayar agar alur bayar bisa dipreview.
        $sudahDibayar = Penggajian::where('periode', $periodeLalu)
            ->pluck('id')
            ->take((int) ceil(Penggajian::where('periode', $periodeLalu)->count() / 2));

        Penggajian::whereIn('id', $sudahDibayar)->update(['status_bayar' => Penggajian::STATUS_SUDAH]);

        // Notifikasi contoh untuk admin & guru.
        Notification::sendToRole(
            'admin',
            'Pengajuan izin menunggu tinjauan',
            $gurus[0]->nama.' mengajukan sakit untuk 2 hari ke depan.',
            'warning',
            'perizinan'
        );

        Notification::sendToRole(
            'admin',
            'Rekap penggajian siap ditinjau',
            'Rekap honor periode '.Tanggal::format($periodeLalu.'-01', 'F Y').' sudah dihitung otomatis dari presensi valid.',
            'info',
            'gaji'
        );

        if ($gurus[0]->user) {
            Notification::send(
                $gurus[0]->user,
                'Pengingat presensi hari ini',
                'Jangan lupa melakukan check-in pada sesi mengajar hari ini.',
                'info',
                'absensi'
            );
        }

        $this->command?->info('Data demo dibuat: '.TeachingSession::count().' sesi, '
            .Attendance::count().' presensi, '.Penggajian::count().' rekap penggajian.');
    }
}
