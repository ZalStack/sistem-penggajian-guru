<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Support\Tanggal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalController extends Controller
{
    /**
     * Jadwal Mengajar Guru.
     *
     * Admin: jadwal seluruh guru per hari & tanggal, single card per jadwal guru diurutkan per jam.
     * Guru : jadwalnya sendiri, dibatasi pada program penugasannya.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $validated = $request->validate([
            'minggu' => 'nullable|date',
            'tanggal' => 'nullable|date',
            'filter_hari' => 'nullable|string',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_program' => 'nullable|integer|exists:programs,id',
            'filter_status' => 'nullable|in:dijadwalkan,berlangsung,selesai,dibatalkan',
        ]);

        // Tentukan tanggal aktif
        if (! empty($validated['tanggal'])) {
            $selectedDate = Carbon::parse($validated['tanggal']);
        } elseif (! empty($validated['minggu'])) {
            $selectedDate = Carbon::parse($validated['minggu']);
        } else {
            $selectedDate = today();
        }

        // Tentukan batas mingguan berdasarkan tanggal aktif
        $referensi = $selectedDate->copy()->startOfWeek(Carbon::MONDAY);
        $mulai = $referensi->copy();
        $selesai = $referensi->copy()->endOfWeek(Carbon::SUNDAY);

        // Jika filter_hari dipilih (misal 'senin', 'selasa', dst), sesuaikan selectedDate
        $hariMap = [
            'senin' => 0,
            'selasa' => 1,
            'rabu' => 2,
            'kamis' => 3,
            'jumat' => 4,
            'sabtu' => 5,
            'minggu' => 6,
        ];
        $filterHariKey = strtolower($validated['filter_hari'] ?? '');
        if (! empty($filterHariKey) && isset($hariMap[$filterHariKey]) && empty($validated['tanggal'])) {
            $selectedDate = $mulai->copy()->addDays($hariMap[$filterHariKey]);
        }

        $guru = $user->guru;

        $query = TeachingSession::with(['guru.grade', 'location', 'transport', 'program', 'attendances'])
            ->whereBetween('tanggal', [$mulai->toDateString(), $selesai->toDateString()]);

        if (! $isAdmin) {
            $query->where('guru_id', $guru?->id ?? 0);
        } else {
            $query
                ->when($validated['filter_guru'] ?? null, fn ($q, $id) => $q->where('guru_id', $id))
                ->when($validated['filter_program'] ?? null, fn ($q, $id) => $q->where('program_id', $id))
                ->when($validated['filter_status'] ?? null, fn ($q, $status) => $q->where('status', $status));
        }

        $formatTime = function ($val, ?string $fallback = '-'): string {
            if (empty($val)) {
                return $fallback ?? '-';
            }
            if ($val instanceof \DateTimeInterface) {
                return $val->format('H:i');
            }
            $clean = trim((string) $val);
            if (str_contains($clean, ':')) {
                return substr($clean, 0, 5);
            }

            return $clean ?: ($fallback ?? '-');
        };

        $sessions = $query->orderBy('jam_mulai')->orderBy('jam_selesai')->get()->groupBy(function (TeachingSession $s) {
            if ($s->tanggal instanceof \DateTimeInterface) {
                return $s->tanggal->format('Y-m-d');
            }

            return $s->tanggal ? substr((string) $s->tanggal, 0, 10) : '';
        });

        // Jika user membuka halaman tanpa parameter spesifik, dan hari ini kosong tapi ada hari lain di pekan ini yang memiliki sesi,
        // prioritaskan hari terdekat yang ada sesinya agar user langsung melihat kartu jadwal mengajar yang aktif.
        if (empty($validated['tanggal']) && empty($validated['filter_hari']) && ! $sessions->has($selectedDate->toDateString())) {
            $firstDayWithSessions = $sessions->keys()->sort()->first();
            if ($firstDayWithSessions) {
                $selectedDate = Carbon::parse($firstDayWithSessions);
            }
        }

        $days = collect(range(0, 6))->map(function (int $offset) use ($mulai, $sessions, $isAdmin, $selectedDate) {
            $tanggal = $mulai->copy()->addDays($offset);
            $tanggalKey = $tanggal->toDateString();
            $daySessions = $sessions->get($tanggalKey, collect());

            return [
                'tanggal' => $tanggalKey,
                'hari' => Tanggal::hari($tanggal),
                'hari_singkat' => Tanggal::hariSingkat($tanggal),
                'tanggal_label' => Tanggal::format($tanggal, 'd M'),
                'tanggal_lengkap' => Tanggal::label($tanggal),
                'is_today' => $tanggal->isSameDay(today()),
                'is_selected' => $tanggal->isSameDay($selectedDate),
                'is_weekend' => $tanggal->isWeekend(),
                'total_sesi' => (int) $daySessions->sum('jumlah_sesi'),
                'jumlah_guru' => $isAdmin ? $daySessions->pluck('guru_id')->filter()->unique()->count() : null,
                'kosong' => $daySessions->isEmpty(),
                'sessions' => $daySessions->values()->map(fn (TeachingSession $s) => [
                    'id' => $s->id,
                    'jam_mulai' => $formatTime($s->jam_mulai, $s->session_time ? trim(explode('-', $s->session_time)[0]) : '08:00'),
                    'jam_selesai' => $formatTime($s->jam_selesai, $s->session_time && str_contains($s->session_time, '-') ? trim(explode('-', $s->session_time)[1]) : '09:30'),
                    'jumlah_sesi' => $s->jumlah_sesi,
                    'mapel' => $s->mapel,
                    'pekan' => $s->pekan,
                    'kelas' => $s->kelas,
                    'level' => $s->level,
                    'bahan_ajar' => $s->bahan_ajar,
                    'catatan' => $s->catatan,
                    'status' => $s->effective_status,
                    'program' => $s->program?->nama,
                    'program_id' => $s->program_id,
                    'program_slug' => $s->program?->slug,
                    'lokasi' => $s->location?->nama_lokasi ?? '-',
                    'lokasi_alamat' => $s->location?->alamat ?? null,
                    'transport' => $s->transport?->jenis ?? '-',
                    'transport_biaya' => $s->transport?->biaya ?? null,
                    'guru' => [
                        'id' => $s->guru?->id,
                        'nama' => $s->guru?->nama ?? '-',
                        'kode_grade' => $s->guru?->grade?->kode_grade ?? '-',
                        'nama_grade' => $s->guru?->grade?->nama_grade ?? '-',
                        'no_hp' => $s->guru?->no_hp ?? null,
                    ],
                    'attendances' => $s->attendances->map(fn ($a) => [
                        'id' => $a->id,
                        'checkin_time' => $a->checkin_time ? Carbon::parse($a->checkin_time)->format('H:i') : null,
                        'checkout_time' => $a->checkout_time ? Carbon::parse($a->checkout_time)->format('H:i') : null,
                        'status' => $a->status,
                    ])->all(),
                ])->all(),
            ];
        });

        $selectedTanggalKey = $selectedDate->toDateString();
        $selectedDaySessions = $sessions->get($selectedTanggalKey, collect());

        $rekapHari = [
            'tanggal' => $selectedTanggalKey,
            'hari' => strtoupper(Tanggal::hari($selectedDate)),
            'hari_singkat' => Tanggal::hariSingkat($selectedDate),
            'tanggal_label' => strtoupper(Tanggal::format($selectedDate, 'd F Y')),
            'label_lengkap' => strtoupper(Tanggal::hari($selectedDate)).' '.Tanggal::format($selectedDate, 'd F Y'),
            'is_today' => $selectedDate->isSameDay(today()),
            'total_sesi' => (int) $selectedDaySessions->sum('jumlah_sesi'),
            'total_jadwal' => $selectedDaySessions->count(),
            'total_guru' => $isAdmin ? $selectedDaySessions->pluck('guru_id')->filter()->unique()->count() : ($selectedDaySessions->isNotEmpty() ? 1 : 0),
            'total_program' => $selectedDaySessions->pluck('program_id')->filter()->unique()->count(),
            'jam_terawal' => $formatTime($selectedDaySessions->pluck('jam_mulai')->filter()->sort()->first(), '-'),
            'jam_terakhir' => $formatTime($selectedDaySessions->pluck('jam_selesai')->filter()->sort()->last(), '-'),
        ];

        return Inertia::render('Jadwal/Index', [
            'days' => $days,
            'selectedTanggal' => $selectedTanggalKey,
            'rekapHari' => $rekapHari,
            'prevTanggal' => $selectedDate->copy()->subDay()->toDateString(),
            'nextTanggal' => $selectedDate->copy()->addDay()->toDateString(),
            'minggu' => [
                'mulai' => $mulai->toDateString(),
                'selesai' => $selesai->toDateString(),
                'label' => Tanggal::format($mulai, 'd F').' – '.Tanggal::format($selesai, 'd F Y'),
            ],
            'hariIni' => today()->toDateString(),
            'rekapMinggu' => [
                'total_sesi' => (int) $days->sum('total_sesi'),
                'total_guru' => $isAdmin ? $days->pluck('jumlah_guru')->sum() : null,
                'hari_aktif' => $days->filter(fn (array $d) => $d['total_sesi'] > 0)->count(),
            ],
            'gurus' => $isAdmin ? Guru::with('grade')->orderBy('nama')->get() : null,
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
            'filters' => [
                'tanggal' => $selectedTanggalKey,
                'minggu' => $mulai->toDateString(),
                'filter_hari' => $validated['filter_hari'] ?? '',
                'filter_guru' => isset($validated['filter_guru']) ? (string) $validated['filter_guru'] : '',
                'filter_program' => isset($validated['filter_program']) ? (string) $validated['filter_program'] : '',
                'filter_status' => $validated['filter_status'] ?? '',
            ],
            'role' => $isAdmin ? 'admin' : 'guru',
        ]);
    }
}
