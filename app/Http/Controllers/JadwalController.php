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
     * Jadwal Mingguan.
     *
     * Admin: jadwal seluruh guru + rekap jumlah guru & sesi per tanggal.
     * Guru : jadwalnya sendiri, dibatasi pada program yang menjadi penugasannya.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $validated = $request->validate([
            'minggu' => 'nullable|date',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_program' => 'nullable|integer|exists:programs,id',
            'filter_status' => 'nullable|in:dijadwalkan,selesai,dibatalkan',
        ]);

        $referensi = Carbon::parse($validated['minggu'] ?? today())->startOfWeek(Carbon::MONDAY);
        $mulai = $referensi->copy();
        $selesai = $referensi->copy()->endOfWeek(Carbon::SUNDAY);

        $guru = $user->guru;

        $query = TeachingSession::with(['guru.grade', 'location', 'transport', 'program'])
            ->whereBetween('tanggal', [$mulai->toDateString(), $selesai->toDateString()]);

        if (! $isAdmin) {
            $query->where('guru_id', $guru?->id ?? 0);
        } else {
            $query
                ->when($validated['filter_guru'] ?? null, fn ($q, $id) => $q->where('guru_id', $id))
                ->when($validated['filter_program'] ?? null, fn ($q, $id) => $q->where('program_id', $id))
                ->when($validated['filter_status'] ?? null, fn ($q, $status) => $q->where('status', $status));
        }

        $sessions = $query->orderBy('jam_mulai')->get()->groupBy(fn (TeachingSession $s) => $s->tanggal->format('Y-m-d'));

        $days = collect(range(0, 6))->map(function (int $offset) use ($mulai, $sessions, $isAdmin) {
            $tanggal = $mulai->copy()->addDays($offset);
            $tanggalKey = $tanggal->toDateString();
            $daySessions = $sessions->get($tanggalKey, collect());

            return [
                'tanggal' => $tanggalKey,
                'hari' => Tanggal::hari($tanggal),
                'hari_singkat' => Tanggal::hariSingkat($tanggal),
                'tanggal_label' => Tanggal::format($tanggal, 'd M'),
                'is_today' => $tanggal->isSameDay(today()),
                'is_weekend' => $tanggal->isWeekend(),
                'total_sesi' => (int) $daySessions->sum('jumlah_sesi'),
                'jumlah_guru' => $isAdmin ? $daySessions->pluck('guru_id')->filter()->unique()->count() : null,
                'kosong' => $daySessions->isEmpty(),
                'sessions' => $daySessions->values()->map(fn (TeachingSession $s) => [
                    'id' => $s->id,
                    'jam_mulai' => $s->jam_mulai->format('H:i'),
                    'jam_selesai' => $s->jam_selesai->format('H:i'),
                    'jumlah_sesi' => $s->jumlah_sesi,
                    'mapel' => $s->mapel,
                    'status' => $s->effective_status,
                    'program' => $s->program?->nama,
                    'lokasi' => $s->location?->nama_lokasi ?? '-',
                    'transport' => $s->transport?->jenis ?? '-',
                    'guru' => [
                        'nama' => $s->guru?->nama ?? '-',
                        'kode_grade' => $s->guru?->grade?->kode_grade ?? '-',
                    ],
                ])->all(),
            ];
        });

        return Inertia::render('Jadwal/Index', [
            'days' => $days,
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
            'filters' => $request->only(['filter_guru', 'filter_program', 'filter_status']),
            'role' => $isAdmin ? 'admin' : 'guru',
        ]);
    }
}
