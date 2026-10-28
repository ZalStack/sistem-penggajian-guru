<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\Location;
use App\Models\Penggajian;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\User;
use App\Support\Tanggal;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GuruController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:100',
            'filter_grade' => 'nullable|integer|exists:grades,id',
            'filter_mapel' => 'nullable|in:IPA,MTK',
            'filter_program' => 'nullable|integer|exists:programs,id',
        ]);

        $query = Guru::with(['grade', 'user', 'programs'])
            ->when($validated['search'] ?? null, function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);

                return $q->where(function ($w) use ($safe) {
                    $w->where('nama', 'like', "%{$safe}%", '\\')
                        ->orWhere('domisili', 'like', "%{$safe}%", '\\')
                        ->orWhere('alamat', 'like', "%{$safe}%", '\\')
                        ->orWhere('nomor_telepon', 'like', "%{$safe}%", '\\');
                });
            })
            ->when($validated['filter_grade'] ?? null, fn ($q, $g) => $q->where('grade_id', $g))
            ->when($validated['filter_mapel'] ?? null, fn ($q, $m) => $q->where('mapel', $m))
            ->when($validated['filter_program'] ?? null, fn ($q, $p) => $q->whereHas('programs', fn ($pq) => $pq->where('programs.id', $p)));

        return Inertia::render('Guru/Index', [
            'gurus' => $query->orderBy('nama')->paginate(10)->withQueryString(),
            'grades' => Grade::orderBy('kode_grade')->get(),
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
            'filters' => $request->only(['search', 'filter_grade', 'filter_mapel', 'filter_program']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Guru/Create', [
            'grades' => Grade::orderBy('kode_grade')->get(),
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());
        $programIds = collect($request->input('program_ids', []))->filter()->map(fn ($id) => (int) $id);

        $passwordToUse = $validated['password'] ?? Str::random(16);
        $isGenerated = ! isset($validated['password']);

        DB::transaction(function () use ($validated, $passwordToUse, $programIds, &$guru) {
            $user = User::create([
                'name' => $validated['nama'],
                'email' => $validated['email'],
                'password' => Hash::make($passwordToUse),
                'role' => 'guru',
                'email_verified_at' => now(),
            ]);

            $guru = Guru::create($this->guruPayload($validated));
            $guru->programs()->sync($programIds->all());

            $user->update(['guru_id' => $guru->id]);
        });

        $msg = $isGenerated
            ? 'Akun guru berhasil dibuat. Email: '.$validated['email'].' | Password: '.$passwordToUse
            : 'Akun guru berhasil dibuat. Email: '.$validated['email'];

        return redirect()->route('guru.index')->with('success', $msg);
    }

    public function show(Request $request, Guru $guru)
    {
        $guru->load(['grade', 'user', 'programs', 'penggajians' => fn ($q) => $q->orderByDesc('periode')]);

        $periode = $request->query('periode', now()->format('Y-m'));

        $attendances = Attendance::with('session.location', 'session.program', 'session.transport')
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', (int) substr($periode, 0, 4))
            ->whereMonth('tanggal', (int) substr($periode, 5, 2))
            ->orderByDesc('tanggal')
            ->orderBy('checkin_time')
            ->get();

        $sessions = TeachingSession::with('location', 'program', 'transport')
            ->where('guru_id', $guru->id)
            ->whereYear('tanggal', (int) substr($periode, 0, 4))
            ->whereMonth('tanggal', (int) substr($periode, 5, 2))
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->get();

        $penggajian = Penggajian::where('guru_id', $guru->id)->where('periode', $periode)->first();

        return Inertia::render('Guru/Show', [
            'guru' => $guru,
            'periode' => $periode,
            'lokasi' => Location::orderBy('nama_lokasi')->get(),
            'presensi' => [
                'total_sesi' => (int) $sessions->sum('jumlah_sesi'),
                'total_hadir' => $attendances->where('status', 'valid')->count(),
                'belum_checkin' => $attendances->where('status', 'belum_checkin')->count(),
                'belum_checkout' => $attendances->where('status', 'belum_checkout')->count(),
                'tidak_valid' => $attendances->where('status', 'tidak_valid')->count(),
                'total_jam' => round($attendances->where('status', 'valid')->sum('durasi') / 60, 2),
                'persentase' => $sessions->sum('jumlah_sesi') > 0
                    ? round($attendances->where('status', 'valid')->count() / max(1, $sessions->sum('jumlah_sesi')) * 100)
                    : 0,
            ],
            'attendances' => $attendances->take(15)->values(),
            'sessions' => $sessions->take(15)->values(),
            'penggajian' => $penggajian,
            'periodeTersedia' => Penggajian::where('guru_id', $guru->id)->pluck('periode')->unique()->sortDesc()->values(),
        ]);
    }

    public function edit(Guru $guru)
    {
        $guru->load(['user', 'programs']);

        return Inertia::render('Guru/Edit', [
            'guru' => $guru,
            'grades' => Grade::orderBy('kode_grade')->get(),
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
        ]);
    }

    public function update(Request $request, Guru $guru)
    {
        $validated = $request->validate($this->rules($guru));
        $programIds = collect($request->input('program_ids', []))->filter()->map(fn ($id) => (int) $id);

        $guru->update($this->guruPayload($validated));
        $guru->programs()->sync($programIds->all());

        if ($guru->user) {
            $guru->user->update([
                'name' => $validated['nama'],
                'email' => $validated['email'],
            ]);
        }

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil diperbarui.');
    }

    public function destroy(Guru $guru)
    {
        DB::transaction(function () use ($guru) {
            if ($guru->user) {
                $guru->user->delete();
            }
            $guru->delete();
        });

        return redirect()->route('guru.index')->with('success', 'Data guru berhasil dihapus.');
    }

    public function resetPassword(Guru $guru)
    {
        if (! $guru->user) {
            return back()->withErrors(['error' => 'Guru ini belum memiliki akun login.']);
        }

        $newPassword = Str::random(16);

        $guru->user->update(['password' => Hash::make($newPassword)]);

        return back()->with('success', 'Password berhasil direset. Password baru: '.$newPassword);
    }

    public function exportCredentialsPdf(Request $request)
    {
        $gurus = Guru::with(['grade', 'user', 'programs'])
            ->when($request->search, function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);

                return $q->where('nama', 'like', "%{$safe}%", '\\');
            })
            ->when($request->filter_grade, fn ($q, $g) => $q->where('grade_id', $g))
            ->when($request->filter_mapel, fn ($q, $m) => $q->where('mapel', $m))
            ->when($request->filter_program, fn ($q, $p) => $q->whereHas('programs', fn ($pq) => $pq->where('programs.id', $p)))
            ->orderBy('nama')
            ->get();

        $pdf = Pdf::loadView('pdf.guru-credentials', ['gurus' => $gurus, 'tanggal' => Tanggal::class])
            ->setPaper('a4', 'landscape');

        $filename = 'data-login-guru-'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Aturan validasi bersama untuk store & update.
     *
     * @return array<string, string>
     */
    private function rules(?Guru $guru = null): array
    {
        return [
            'nama' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'mapel' => 'required|in:IPA,MTK',
            'jenjang' => 'nullable|string|max:100',
            'program_ids' => 'nullable|array',
            'program_ids.*' => 'integer|exists:programs,id',
            'domisili' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:1000',
            'riwayat_pendidikan' => 'nullable|string|max:2000',
            'pendidikan_terakhir' => 'nullable|string|max:100',
            'tanggal_bergabung' => 'nullable|date',
            'lama_mengajar' => 'nullable|integer|min:0|max:60',
            'riwayat_mengajar' => 'nullable|string|max:2000',
            'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
            'tunjangan_khusus' => 'nullable|numeric|min:0|max:9999999999',
            'bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:50',
            'keterangan_mengajar' => 'nullable|string|max:1000',
            'email' => 'required|email|unique:users,email'.($guru?->user_id ? ','.$guru->user_id : ''),
            'password' => 'nullable|string|min:8|confirmed',
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function guruPayload(array $validated): array
    {
        return [
            'nama' => $validated['nama'],
            'grade_id' => $validated['grade_id'],
            'mapel' => $validated['mapel'],
            'jenjang' => $validated['jenjang'] ?? null,
            'domisili' => $validated['domisili'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'riwayat_pendidikan' => $validated['riwayat_pendidikan'] ?? null,
            'pendidikan_terakhir' => $validated['pendidikan_terakhir'] ?? null,
            'tanggal_bergabung' => $validated['tanggal_bergabung'] ?? null,
            'lama_mengajar' => $validated['lama_mengajar'] ?? null,
            'riwayat_mengajar' => $validated['riwayat_mengajar'] ?? null,
            'nomor_telepon' => $validated['nomor_telepon'] ?? null,
            'tunjangan_khusus' => $validated['tunjangan_khusus'] ?? 0,
            'bank' => $validated['bank'] ?? null,
            'nomor_rekening' => $validated['nomor_rekening'] ?? null,
            'keterangan_mengajar' => $validated['keterangan_mengajar'] ?? null,
        ];
    }
}
