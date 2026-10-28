<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Location;
use App\Models\Notification;
use App\Models\Program;
use App\Models\TeachingSession;
use App\Models\Transport;
use App\Support\Tanggal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeachingSessionController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_program' => 'nullable|integer|exists:programs,id',
            'filter_status' => 'nullable|in:dijadwalkan,selesai,dibatalkan',
            'search' => 'nullable|string|max:100',
        ]);

        $query = TeachingSession::with(['guru.grade', 'guru.programs', 'location', 'transport', 'program'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['filter_program'] ?? null, fn ($q, $p) => $q->where('program_id', $p))
            ->when($validated['filter_status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['search'] ?? null, function ($q, $search) {
                $escaped = addcslashes($search, '%_\\');

                $q->where(function ($sub) use ($escaped) {
                    $sub->whereHas('guru', fn ($gq) => $gq->where('nama', 'like', "%{$escaped}%"))
                        ->orWhereHas('location', fn ($lq) => $lq->where('nama_lokasi', 'like', "%{$escaped}%"));
                });
            })
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai');

        $sessions = $query->paginate(12)->withQueryString();

        return Inertia::render('Admin/Sessions/Index', [
            'sessions' => $sessions,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'locations' => Location::orderBy('nama_lokasi')->get(),
            'transports' => Transport::orderBy('jenis')->get(),
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru', 'filter_program', 'filter_status', 'search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        if ($this->hasOverlap($validated['guru_id'], $validated['tanggal'], $validated['jam_mulai'], $validated['jam_selesai'])) {
            return back()->withErrors(['jam_mulai' => 'Guru sudah memiliki sesi di rentang waktu yang sama. Silakan pilih jadwal lain.'])->withInput();
        }

        $session = TeachingSession::create($validated);

        $this->notifyGuruAboutSession($session, 'ditugaskan');

        return back()->with('success', 'Sesi mengajar berhasil ditambahkan dan guru telah diberi notifikasi.');
    }

    public function update(Request $request, TeachingSession $session)
    {
        $validated = $request->validate($this->rules($session));

        if ($this->hasOverlap($validated['guru_id'], $validated['tanggal'], $validated['jam_mulai'], $validated['jam_selesai'], $session->id)) {
            return back()->withErrors(['jam_mulai' => 'Guru sudah memiliki sesi di rentang waktu yang sama. Silakan pilih jadwal lain.'])->withInput();
        }

        $guruBerubah = $session->guru_id !== (int) $validated['guru_id'];
        $session->update($validated);

        $this->notifyGuruAboutSession($session->fresh(), 'diperbarui', $guruBerubah);

        return back()->with('success', 'Sesi mengajar berhasil diperbarui.');
    }

    public function destroy(TeachingSession $session)
    {
        $attendanceCount = $session->attendances()->count();

        if ($attendanceCount > 0) {
            return back()->with('error', 'Sesi tidak dapat dihapus karena masih memiliki '.$attendanceCount.' data presensi. Gunakan status "Dibatalkan" bila sesi memang dibatalkan.');
        }

        if ($session->guru?->user) {
            Notification::send(
                $session->guru->user,
                'Sesi Mengajar Dihapus',
                'Sesi mengajar pada '.Tanggal::tanggalPanjang($session->tanggal).' pukul '.$session->jam_mulai->format('H:i').' telah dihapus oleh admin.',
                'warning',
                'sesi'
            );
        }

        $session->delete();

        return back()->with('success', 'Sesi mengajar berhasil dihapus.');
    }

    /**
     * @return array<string, string>
     */
    private function rules(?TeachingSession $session = null): array
    {
        return [
            'guru_id' => 'required|exists:gurus,id',
            'location_id' => 'required|exists:locations,id',
            'transport_id' => 'required|exists:transports,id',
            'program_id' => 'nullable|exists:programs,id',
            'mapel' => 'required|in:IPA,MTK',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'jumlah_sesi' => 'required|integer|min:1|max:10',
            'status' => 'required|in:dijadwalkan,selesai,dibatalkan',
            'catatan' => 'nullable|string|max:500',
        ];
    }

    private function hasOverlap(int $guruId, string $tanggal, string $jamMulai, string $jamSelesai, ?int $exceptId = null): bool
    {
        return TeachingSession::where('guru_id', $guruId)
            ->whereDate('tanggal', $tanggal)
            ->when($exceptId, fn ($q, $id) => $q->where('id', '!=', $id))
            ->where('status', '!=', TeachingSession::STATUS_DIBATALKAN)
            ->where('jam_mulai', '<', $jamSelesai)
            ->where('jam_selesai', '>', $jamMulai)
            ->exists();
    }

    private function notifyGuruAboutSession(TeachingSession $session, string $aksi, bool $guruBerubah = false): void
    {
        $session->load(['guru.user', 'location', 'program']);

        $user = $session->guru?->user;

        if (! $user) {
            return;
        }

        $judul = match ($aksi) {
            'diperbarui' => $guruBerubah ? 'Penugasan Sesi Mengajar Baru' : 'Jadwal Sesi Mengajar Diperbarui',
            default => 'Penugasan Sesi Mengajar Baru',
        };

        $pesan = 'Anda '.$aksi.' sesi mengajar '.Tanggal::tanggalPanjang($session->tanggal)
            .' pukul '.$session->jam_mulai->format('H:i').'-'.$session->jam_selesai->format('H:i')
            .' di '.$session->location?->nama_lokasi
            .($session->program ? ' — '.$session->program->nama : '')
            .'. Status: '.ucfirst($session->status).'.'.($session->catatan ? ' Catatan: '.$session->catatan : '');

        Notification::send($user, $judul, $pesan, 'info', 'sesi');
    }
}
