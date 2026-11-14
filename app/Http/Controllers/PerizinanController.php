<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Notification;
use App\Models\Perizinan;
use App\Models\TeachingSession;
use App\Support\Tanggal;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PerizinanController extends Controller
{
    private const LAMPIRAN_DISK = 'local';

    private const LAMPIRAN_DIRECTORY = 'perizinan/surat-sakit';

    public function guruIndex(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return Inertia::render('Guru/Perizinan/Index', [
                'perizinan' => [],
                'sesiTerjadwal' => [],
                'guru' => (object) ['nama' => $user->name],
            ]);
        }

        $perizinan = Perizinan::with('session.location')
            ->where('guru_id', $guru->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->each(function (Perizinan $izin) {
                $izin->setAttribute('jumlah_sesi_terdampak', $izin->jumlahSesiTerdampak());
            });

        // Daftar sesi mendatang untuk dikaitkan dengan pengajuan (opsional),
        // sehingga perizinan dapat ditelusuri sampai ke jadwal mengajar.
        $sesiTerjadwal = $guru->sessions()
            ->aktif()
            ->whereDate('tanggal', '>=', today()->toDateString())
            ->with(['location', 'program'])
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->limit(30)
            ->get();

        return Inertia::render('Guru/Perizinan/Index', [
            'perizinan' => $perizinan,
            'sesiTerjadwal' => $sesiTerjadwal,
            'guru' => $guru->load('grade', 'programs'),
        ]);
    }

    public function guruStore(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return back()->with('error', 'Akun ini belum terhubung dengan data guru, sehingga tidak dapat mengajukan perizinan.');
        }

        $validated = $request->validate([
            'jenis' => 'required|in:izin,sakit',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'session_id' => 'nullable|integer|exists:teaching_sessions,id',
            'alasan' => 'required|string|max:500',
            'lampiran_surat_sakit' => 'required_if:jenis,sakit|nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ], [
            'lampiran_surat_sakit.required_if' => 'Surat keterangan sakit wajib dilampirkan saat mengajukan sakit.',
        ]);

        $lampiranPath = null;

        if ($request->hasFile('lampiran_surat_sakit')) {
            $lampiranPath = $this->simpanSuratSakit($request, $guru->id);
        }

        unset($validated['lampiran_surat_sakit']);

        if (! empty($validated['session_id'])) {
            $session = TeachingSession::where('id', $validated['session_id'])
                ->where('guru_id', $guru->id)
                ->aktif()
                ->first();

            if (! $session) {
                return back()->withErrors(['session_id' => 'Sesi mengajar tersebut bukan milik Anda atau sudah dibatalkan.'])->withInput();
            }

            $mulai = Carbon::parse($validated['tanggal_mulai']);
            $selesai = Carbon::parse($validated['tanggal_selesai']);

            if ($session->tanggal->lt($mulai) || $session->tanggal->gt($selesai)) {
                return back()
                    ->withErrors(['session_id' => 'Tanggal sesi ('.Tanggal::format($session->tanggal, 'd M Y').') tidak berada dalam rentang tanggal perizinan.'])
                    ->withInput();
            }
        }

        $perizinan = Perizinan::create([
            'guru_id' => $guru->id,
            ...$validated,
            'lampiran_surat_sakit' => $lampiranPath,
        ]);

        $this->notifyAdminNewRequest($perizinan);

        return back()->with('success', 'Pengajuan perizinan berhasil dikirim dan menunggu tinjauan admin.');
    }

    /**
     * Unduh lampiran surat keterangan sakit — hanya pemilik pengajuan atau admin.
     */
    public function downloadSuratSakit(Request $request, Perizinan $perizinan)
    {
        $user = $request->user();

        if (! $user->isAdmin() && $perizinan->guru_id !== $user->guru_id) {
            abort(403);
        }

        if (! $perizinan->lampiran_surat_sakit) {
            abort(404);
        }

        $disk = Storage::disk(self::LAMPIRAN_DISK);
        $path = $perizinan->lampiran_surat_sakit;

        abort_unless($disk->exists($path), 404);

        return $disk->download($path, basename($path));
    }

    public function adminIndex(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,disetujui,ditolak',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'filter_jenis' => 'nullable|in:izin,sakit,cuti',
        ]);

        $query = Perizinan::with(['guru.grade', 'guru.programs', 'session.location'])
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['filter_jenis'] ?? null, fn ($q, $j) => $q->where('jenis', $j))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $query->getCollection()->transform(function (Perizinan $perizinan) {
            $perizinan->setAttribute('jumlah_sesi_terdampak', $perizinan->jumlahSesiTerdampak());

            return $perizinan;
        });

        return Inertia::render('Admin/Perizinan/Index', [
            'perizinan' => $query,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['status', 'filter_guru', 'filter_jenis']),
            'ringkasan' => [
                'pending' => Perizinan::where('status', Perizinan::STATUS_PENDING)->count(),
                'disetujui' => Perizinan::where('status', Perizinan::STATUS_DISETUJUI)->count(),
                'ditolak' => Perizinan::where('status', Perizinan::STATUS_DITOLAK)->count(),
            ],
        ]);
    }

    public function adminUpdate(Request $request, Perizinan $perizinan)
    {
        $validated = $request->validate([
            'status' => 'required|in:disetujui,ditolak',
            'catatan_admin' => 'required|string|max:500',
        ]);

        $perizinan->update($validated);

        $this->notifyGuruAboutDecision($perizinan->fresh(), $validated['status'], $validated['catatan_admin']);

        return back()->with('success', 'Status perizinan '.($validated['status'] === Perizinan::STATUS_DISETUJUI ? 'disetujui' : 'ditolak').'. Guru telah diberi notifikasi.');
    }

    /**
     * Simpan lampiran surat keterangan sakit pada disk privat.
     */
    private function simpanSuratSakit(Request $request, int $guruId): string
    {
        $file = $request->file('lampiran_surat_sakit');
        $filename = 'surat-sakit-'.$guruId.'-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6)).'.'.$file->extension();

        return $file->storeAs(self::LAMPIRAN_DIRECTORY, $filename, self::LAMPIRAN_DISK);
    }

    private function notifyAdminNewRequest(Perizinan $perizinan): void
    {
        $perizinan->load('guru.grade');

        Notification::sendToRole(
            'admin',
            'Pengajuan Perizinan Baru',
            ($perizinan->guru?->nama ?? 'Seorang guru').' mengajukan '.$perizinan->labelJenis()
                .' pada '.Tanggal::format($perizinan->tanggal_mulai, 'd F Y')
                .($perizinan->tanggal_mulai->isSameDay($perizinan->tanggal_selesai) ? '' : ' – '.Tanggal::format($perizinan->tanggal_selesai, 'd F Y'))
                .'. Alasan: '.$perizinan->alasan,
            'warning',
            'perizinan'
        );
    }

    private function notifyGuruAboutDecision(Perizinan $perizinan, string $status, string $catatan): void
    {
        $user = $perizinan->guru?->user;

        if (! $user) {
            return;
        }

        $disetujui = $status === Perizinan::STATUS_DISETUJUI;

        Notification::send(
            $user,
            $disetujui ? 'Perizinan Disetujui' : 'Perizinan Ditolak',
            'Pengajuan '.$perizinan->labelJenis().' Anda pada '.Tanggal::format($perizinan->tanggal_mulai, 'd F Y')
                .($disetujui ? ' telah disetujui' : ' ditolak').' oleh admin. Catatan admin: '.$catatan,
            $disetujui ? 'success' : 'error',
            'perizinan'
        );
    }
}
