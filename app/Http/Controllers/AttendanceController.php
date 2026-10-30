<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Guru;
use App\Models\Perizinan;
use App\Models\TeachingSession;
use App\Services\AttendanceService;
use App\Support\Tanggal;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendanceService) {}

    public function checkin(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'required|numeric|min:0|max:300',
        ]);

        $result = $this->attendanceService->checkIn($request->user(), $validated);

        $message = match ($result->code) {
            AttendanceService::NO_TEACHER_LINK => 'Akun ini tidak terhubung dengan data guru.',
            AttendanceService::NOT_SESSION_OWNER => 'Sesi ini bukan milik Anda.',
            AttendanceService::WRONG_DATE => 'Check-in hanya dapat dilakukan pada tanggal jadwal sesi ('.Tanggal::tanggalPanjang($result->context['session_date']).').',
            AttendanceService::OUTSIDE_TIME_WINDOW => 'Check-in hanya dapat dilakukan dalam rentang waktu 30 menit sebelum jam mulai hingga jam selesai sesi ('.$result->context['window_start'].' - '.$result->context['window_end'].').',
            AttendanceService::ALREADY_CHECKED_IN => 'Anda sudah melakukan check-in untuk sesi ini hari ini.',
            AttendanceService::APPROVED_LEAVE => 'Check-in tidak dapat dilakukan karena Anda memiliki '
                .$this->izinLabel($result->context['izin'] ?? null)
                .' yang disetujui admin. Kehadiran pada sesi ini akan tercatat sebagai izin di rekap presensi.',
            AttendanceService::OUTSIDE_RADIUS => $this->radiusErrorMessage('Check-in', $result->context),
            default => 'Check-in berhasil! Jarak: '.number_format($result->context['distance'], 0).'m dari lokasi'.$this->accuracyLabel($result->context['accuracy']).'.',
        };

        return $result->ok
            ? back()->with('success', $message)
            : back()->with('error', $message);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:teaching_sessions,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'required|numeric|min:0|max:300',
        ]);

        $result = $this->attendanceService->checkOut($request->user(), $validated);

        $message = match ($result->code) {
            AttendanceService::NO_TEACHER_LINK => 'Akun ini tidak terhubung dengan data guru.',
            AttendanceService::NOT_CHECKED_IN => 'Anda belum melakukan check-in untuk sesi ini.',
            AttendanceService::ALREADY_CHECKED_OUT => 'Anda sudah melakukan check-out untuk sesi ini.',
            AttendanceService::MIN_DURATION_NOT_MET => 'Durasi mengajar minimal 15 menit. Silakan check-out setelah minimal 15 menit check-in.',
            AttendanceService::OUTSIDE_RADIUS => $this->radiusErrorMessage('Check-out', $result->context),
            default => 'Check-out berhasil! Jarak: '.number_format($result->context['distance'], 0).'m'.$this->accuracyLabel($result->context['accuracy']).'. Durasi mengajar: '.$result->context['duration'].' menit. Gaji sudah dihitung otomatis.',
        };

        return $result->ok
            ? back()->with('success', $message)
            : back()->with('error', $message);
    }

    public function guruAttendance(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;
        $now  = now();
        $periode = $now->format('Y-m');

        if (! $guru) {
            return Inertia::render('Guru/Attendance/Index', [
                'attendances'       => [],
                'totalHadir'        => 0,
                'totalJam'          => 0,
                'guru'              => (object) ['nama' => $user->name],
                'filters'           => $request->only(['bulan']),
                'upcomingSessions'  => [],
                'todayAttendances'  => (object) [],
                'izinHariIni'       => null,
                'stats'             => [
                    'total_sesi_bulan' => 0,
                    'total_hadir'      => 0,
                    'gaji_bulan'       => 0,
                    'potensi_gaji'     => 0,
                    'status_bayar'     => 'belum_dibayar',
                ],
            ]);
        }

        $guru->load(['grade', 'programs']);

        $attendances = Attendance::with('session.location', 'session.transport')
            ->where('guru_id', $guru->id)
            ->when($request->bulan, fn ($q, $b) => $q->whereMonth('tanggal', substr($b, 5, 2))->whereYear('tanggal', substr($b, 0, 4)))
            ->orderBy('tanggal', 'desc')
            ->get();

        $totalHadir = $attendances->where('status', 'valid')->count();
        $totalJam   = $attendances->where('status', 'valid')->sum('durasi');

        // ── Jadwal mendatang (sama seperti di GuruDashboard) ──────────────────
        $upcomingSessions = TeachingSession::with(['location', 'transport', 'program'])
            ->aktif()
            ->where('guru_id', $guru->id)
            ->whereDate('tanggal', '>=', $now->toDateString())
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->limit(6)
            ->get()
            ->map(fn ($s) => [
                'id'          => $s->id,
                'tanggal'     => $s->tanggal->format('Y-m-d'),
                'is_today'    => $s->tanggal->isSameDay($now),
                'jam_mulai'   => $s->jam_mulai->format('H:i'),
                'jam_selesai' => $s->jam_selesai->format('H:i'),
                'mapel'       => $s->mapel,
                'jumlah_sesi' => $s->jumlah_sesi,
                'program'     => $s->program?->nama,
                'location'    => [
                    'nama_lokasi' => $s->location->nama_lokasi,
                    'latitude'    => $s->location->latitude,
                    'longitude'   => $s->location->longitude,
                    'radius'      => $s->location->radius,
                ],
                'transport'   => $s->transport ? ['jenis' => $s->transport->jenis] : null,
            ]);

        // ── Presensi hari ini (untuk status check-in/out pada SessionCard) ────
        $todayAttendances = Attendance::where('guru_id', $guru->id)
            ->whereDate('tanggal', $now->toDateString())
            ->get()
            ->keyBy('session_id');

        // ── Izin yang sedang berlaku hari ini ─────────────────────────────────
        $izinHariIni = Perizinan::where('guru_id', $guru->id)
            ->where('status', Perizinan::STATUS_DISETUJUI)
            ->whereDate('tanggal_mulai', '<=', $now->toDateString())
            ->whereDate('tanggal_selesai', '>=', $now->toDateString())
            ->orderByDesc('tanggal_mulai')
            ->first();

        // ── Statistik gaji bulan berjalan ────────────────────────────────────
        $totalHadirBulan = Attendance::where('guru_id', $guru->id)
            ->whereYear('tanggal', $now->year)
            ->whereMonth('tanggal', $now->month)
            ->where('status', 'valid')
            ->count();

        $totalSesiBulan = (int) TeachingSession::aktif()
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', $now->year)
            ->whereMonth('tanggal', $now->month)
            ->sum('jumlah_sesi');

        $honorPerSesi = (float) ($guru->grade?->honor_per_sesi ?? 0);
        $potensiGaji  = ($totalHadirBulan * $honorPerSesi) + (float) $guru->tunjangan_khusus;
        $penggajian   = \App\Models\Penggajian::where('guru_id', $guru->id)->where('periode', $periode)->first();

        return Inertia::render('Guru/Attendance/Index', [
            'attendances'      => $attendances,
            'totalHadir'       => $totalHadir,
            'totalJam'         => $totalJam,
            'guru'             => $guru,
            'filters'          => $request->only(['bulan']),
            'upcomingSessions' => $upcomingSessions,
            'todayAttendances' => $todayAttendances,
            'izinHariIni'      => $izinHariIni ? [
                'jenis'   => $izinHariIni->labelJenis(),
                'rentang' => $izinHariIni->rentangTanggal(),
                'alasan'  => $izinHariIni->alasan,
            ] : null,
            'stats' => [
                'total_sesi_bulan' => $totalSesiBulan,
                'total_hadir'      => $totalHadirBulan,
                'gaji_bulan'       => (float) ($penggajian?->total ?? 0),
                'potensi_gaji'     => $potensiGaji,
                'status_bayar'     => $penggajian?->status_bayar ?? 'belum_dibayar',
            ],
        ]);
    }

    public function adminRecap(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_status' => 'nullable|in:valid,tidak_valid,belum_checkin,belum_checkout,izin,menunggu',
            'tanggal' => 'nullable|date',
        ]);

        // Sumber rekap adalah sesi mengajar, bukan sekadar baris presensi, supaya
        // sesi yang tidak pernah di-check-in tetap terlihat oleh admin sebagai
        // "Belum Check-in", atau "Izin" bila ada perizinan yang sudah disetujui.
        $sessions = $this->recapQuery($validated)
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai')
            ->paginate(25)
            ->withQueryString();

        $izinBerlaku = $this->izinBerlaku($sessions->getCollection());

        $sessions->setCollection(
            $sessions->getCollection()->map(fn (TeachingSession $session) => $this->barisPresensi($session, $izinBerlaku))
        );

        $guruTerpilih = ($validated['filter_guru'] ?? null)
            ? Guru::with('grade')->find($validated['filter_guru'])
            : null;

        return Inertia::render('Admin/Attendance/Index', [
            'attendances' => $sessions,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru', 'filter_status', 'tanggal']),
            'recap' => $this->buildRecap($validated),
            'guruTerpilih' => $guruTerpilih,
        ]);
    }

    /**
     * Kueri dasar rekap presensi: sesi mengajar yang waktunya sudah tiba.
     *
     * @param  array<string, mixed>  $validated
     */
    private function recapQuery(array $validated): Builder
    {
        return TeachingSession::query()
            ->with(['guru.grade', 'guru.programs', 'location', 'transport', 'program', 'attendances'])
            ->whereDate('tanggal', '<=', today()->toDateString())
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['tanggal'] ?? null, fn ($q, $t) => $q->whereDate('tanggal', $t))
            // Sesi dibatalkan tanpa presensi tidak ikut rekap, tetapi sesi yang
            // sudah pernah di-check-in tetap tampil agar jejak presensinya tidak hilang.
            ->where(function ($q) {
                $q->whereHas('attendances')
                    ->orWhere('status', '!=', TeachingSession::STATUS_DIBATALKAN);
            })
            ->when($validated['filter_status'] ?? null, fn ($q, $s) => $this->filterStatusPresensi($q, $s));
    }

    /**
     * Rekap kehadiran yang bisa dipakai sebagai referensi administrasi honor.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, int|float>
     */
    private function buildRecap(array $validated): array
    {
        $base = $this->recapQuery($validated);

        return [
            'total' => (clone $base)->count(),
            'valid' => (clone $base)->whereHas('attendances', fn ($a) => $a->where('status', 'valid'))->count(),
            'belum_checkout' => (clone $base)->whereHas('attendances', fn ($a) => $a->where('status', 'belum_checkout'))->count(),
            'tidak_valid' => (clone $base)->whereHas('attendances', fn ($a) => $a->where('status', 'tidak_valid'))->count(),
            'belum_checkin' => (clone $base)->where($this->tanpaCheckin())->where($this->izinTidakTercakup())->where($this->waktuTerlewat())->count(),
            'izin' => (clone $base)->where($this->tanpaCheckin())->where($this->izinTercakup())->count(),
            'menunggu' => (clone $base)->where($this->tanpaCheckin())->where($this->izinTidakTercakup())->where($this->waktuBelumTerjadi())->count(),
            'total_jam' => round($this->presensiValid($validated)->sum('durasi') / 60, 2),
            'guru_hadir' => (clone $base)
                ->whereHas('attendances', fn ($a) => $a->whereIn('status', ['valid', 'belum_checkout']))
                ->distinct()
                ->count('teaching_sessions.guru_id'),
        ];
    }

    /**
     * Rekap total jam tetap dihitung dari baris presensi valid (data yang
     * benar-benar tercatat), dengan filter yang sama seperti daftar di atas.
     *
     * @param  array<string, mixed>  $validated
     */
    private function presensiValid(array $validated): Builder
    {
        return Attendance::query()
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['tanggal'] ?? null, fn ($q, $t) => $q->whereDate('tanggal', $t))
            ->where('status', 'valid');
    }

    /**
     * Terapkan filter status presensi pada kueri sesi.
     */
    private function filterStatusPresensi(Builder $query, string $status): Builder
    {
        return match ($status) {
            'valid' => $query->whereHas('attendances', fn ($a) => $a->where('status', 'valid')),
            'belum_checkout' => $query->whereHas('attendances', fn ($a) => $a->where('status', 'belum_checkout')),
            'tidak_valid' => $query->whereHas('attendances', fn ($a) => $a->where('status', 'tidak_valid')),
            'izin' => $query->where($this->tanpaCheckin())->where($this->izinTercakup()),
            'belum_checkin' => $query->where($this->tanpaCheckin())->where($this->izinTidakTercakup())->where($this->waktuTerlewat()),
            'menunggu' => $query->where($this->tanpaCheckin())->where($this->izinTidakTercakup())->where($this->waktuBelumTerjadi()),
            default => $query,
        };
    }

    /**
     * Sesi yang belum memiliki catatan check-in sama sekali.
     */
    private function tanpaCheckin(): Closure
    {
        return fn ($q) => $q->whereNotExists(function ($sub) {
            $sub->selectRaw('1')
                ->from('attendances')
                ->whereColumn('attendances.session_id', 'teaching_sessions.id')
                ->whereNotNull('attendances.checkin_time');
        });
    }

    /**
     * Tanggal sesi berada dalam rentang perizinan yang sudah disetujui.
     */
    private function izinTercakup(): Closure
    {
        return fn ($q) => $q->whereExists(function ($sub) {
            $sub->selectRaw('1')
                ->from('perizinan')
                ->whereColumn('perizinan.guru_id', 'teaching_sessions.guru_id')
                ->where('perizinan.status', Perizinan::STATUS_DISETUJUI)
                ->whereColumn('perizinan.tanggal_mulai', '<=', 'teaching_sessions.tanggal')
                ->whereColumn('perizinan.tanggal_selesai', '>=', 'teaching_sessions.tanggal');
        });
    }

    private function izinTidakTercakup(): Closure
    {
        return fn ($q) => $q->whereNotExists(function ($sub) {
            $sub->selectRaw('1')
                ->from('perizinan')
                ->whereColumn('perizinan.guru_id', 'teaching_sessions.guru_id')
                ->where('perizinan.status', Perizinan::STATUS_DISETUJUI)
                ->whereColumn('perizinan.tanggal_mulai', '<=', 'teaching_sessions.tanggal')
                ->whereColumn('perizinan.tanggal_selesai', '>=', 'teaching_sessions.tanggal');
        });
    }

    /**
     * Waktu sesi sudah lewat sehingga tidak adanya check-in adalah pelanggaran.
     */
    private function waktuTerlewat(): Closure
    {
        return fn ($q) => $q->where(function ($sub) {
            $sub->whereDate('tanggal', '<', today()->toDateString())
                ->orWhere(function ($hariIni) {
                    $hariIni->whereDate('tanggal', today()->toDateString())
                        ->where('jam_selesai', '<=', now()->format('H:i'));
                });
        });
    }

    /**
     * Sesi hari ini yang waktunya belum tiba — presensinya masih menunggu.
     */
    private function waktuBelumTerjadi(): Closure
    {
        return fn ($q) => $q->where(function ($sub) {
            $sub->whereDate('tanggal', '>', today()->toDateString())
                ->orWhere(function ($hariIni) {
                    $hariIni->whereDate('tanggal', today()->toDateString())
                        ->where('jam_selesai', '>', now()->format('H:i'));
                });
        });
    }

    /**
     * Perizinan disetujui yang berlaku untuk halaman rekap yang sedang dibuka.
     *
     * @param  Collection<int, TeachingSession>  $sessions
     * @return Collection<int, Collection<int, Perizinan>>
     */
    private function izinBerlaku(Collection $sessions): Collection
    {
        if ($sessions->isEmpty()) {
            return collect();
        }

        $mulai = $sessions->min(fn (TeachingSession $session) => $session->tanggal->toDateString());
        $selesai = $sessions->max(fn (TeachingSession $session) => $session->tanggal->toDateString());

        return Perizinan::where('status', Perizinan::STATUS_DISETUJUI)
            ->whereIn('guru_id', $sessions->pluck('guru_id')->unique()->all())
            ->whereDate('tanggal_mulai', '<=', $selesai)
            ->whereDate('tanggal_selesai', '>=', $mulai)
            ->get()
            ->groupBy('guru_id');
    }

    /**
     * Susun satu baris rekap: memakai baris presensi bila ada check-in,
     * kalau tidak dibuat sintetis dari sesinya sendiri.
     *
     * @param  Collection<int, Collection<int, Perizinan>>  $izinBerlaku
     */
    private function barisPresensi(TeachingSession $session, Collection $izinBerlaku): Attendance|\stdClass
    {
        $presensi = $session->attendances
            ->filter(fn (Attendance $attendance) => $attendance->checkin_time !== null)
            ->sortByDesc('checkin_time')
            ->first();

        if ($presensi) {
            return $presensi;
        }

        // Id negatif dipakai agar kunci baris sintetis tidak pernah bertabrakan
        // dengan id presensi asli saat dirender di tabel.
        return (object) [
            'id' => -$session->id,
            'guru_id' => $session->guru_id,
            'session_id' => $session->id,
            'tanggal' => $session->tanggal,
            'checkin_time' => null,
            'checkin_lat' => null,
            'checkin_lng' => null,
            'checkin_accuracy' => null,
            'checkout_time' => null,
            'checkout_lat' => null,
            'checkout_lng' => null,
            'checkout_accuracy' => null,
            'durasi' => 0,
            'status' => $this->statusTanpaCheckin($session, $izinBerlaku),
            'guru' => $session->guru,
            'session' => $session,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        ];
    }

    /**
     * @param  Collection<int, Collection<int, Perizinan>>  $izinBerlaku
     */
    private function statusTanpaCheckin(TeachingSession $session, Collection $izinBerlaku): string
    {
        $izin = ($izinBerlaku->get($session->guru_id) ?? collect())
            ->first(fn (Perizinan $izin) => $izin->tanggal_mulai->lte($session->tanggal)
                && $izin->tanggal_selesai->gte($session->tanggal));

        if ($izin) {
            return 'izin';
        }

        return $this->sesiSudahLewatWaktunya($session) ? 'belum_checkin' : 'menunggu';
    }

    private function sesiSudahLewatWaktunya(TeachingSession $session): bool
    {
        if ($session->tanggal->lt(today())) {
            return true;
        }

        if ($session->tanggal->gt(today())) {
            return false;
        }

        return $session->jam_selesai->lte(now());
    }

    /**
     * Susun label izin yang sedang berlaku untuk pesan error check-in.
     *
     * @param  Perizinan|null  $izin
     */
    private function izinLabel($izin): string
    {
        if (! $izin) {
            return 'izin';
        }

        return mb_strtolower($izin->labelJenis()).' "'.($izin->rentangTanggal() ?? '').'"';
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function radiusErrorMessage(string $verb, array $context): string
    {
        $msg = $verb.' gagal! Anda berada di luar radius lokasi.';
        $msg .= ' Jarak: '.number_format($context['distance'], 0).'m.';
        $msg .= ' Radius yang diizinkan: '.$context['radius'].'m.';

        if ($context['accuracy'] > 50) {
            $msg .= ' (Akurasi lokasi: ±'.number_format($context['accuracy'], 0).'m — disarankan di area terbuka untuk hasil lebih akurat).';
        }

        return $msg;
    }

    private function accuracyLabel(float $accuracy): string
    {
        return $accuracy <= 50 ? ' (GPS akurat)' : ' (WiFi/Jaringan)';
    }
}
