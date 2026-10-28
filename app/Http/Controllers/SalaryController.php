<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Notification;
use App\Models\Penggajian;
use App\Support\Tanggal;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Modul Penggajian (rekap honor).
 *
 * Rekap dihitung otomatis dari sesi mengajar yang sudah tervalidasi lewat
 * presensi, sehingga angka gaji selalu dapat ditelusuri ke data aslinya.
 * Tidak ada input manual angka gaji.
 */
class SalaryController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|date_format:Y-m',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'status_bayar' => 'nullable|in:belum_dibayar,sudah_dibayar',
        ]);

        $periodeDefault = now()->format('Y-m');

        $query = Penggajian::with(['guru.grade', 'guru.programs', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->where('periode', $p))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['status_bayar'] ?? null, fn ($q, $s) => $q->where('status_bayar', $s))
            ->orderBy('periode', 'desc')
            ->orderBy('guru_id');

        $penggajians = $query->paginate(12)->withQueryString();

        $periodeAktif = $validated['periode'] ?? $periodeDefault;

        $periodeQuery = Penggajian::where('periode', $periodeAktif);

        return Inertia::render('Admin/Salary/Index', [
            'penggajians' => $penggajians,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru', 'status_bayar']),
            'periodeDefault' => $periodeDefault,
            'periodeAktif' => $periodeAktif,
            'ringkasan' => [
                'total_guru' => (clone $periodeQuery)->count(),
                'total_honor' => (float) (clone $periodeQuery)->sum('honor'),
                'total_transport' => (float) (clone $periodeQuery)->sum('total_transport'),
                'total_tunjangan' => (float) (clone $periodeQuery)->sum('tunjangan_khusus'),
                'grand_total' => (float) (clone $periodeQuery)->sum('total'),
                'sudah_dibayar' => (clone $periodeQuery)->paid()->count(),
                'belum_dibayar' => (clone $periodeQuery)->where('status_bayar', Penggajian::STATUS_BELUM)->count(),
                'nominal_belum_dibayar' => (float) (clone $periodeQuery)->where('status_bayar', Penggajian::STATUS_BELUM)->sum('total'),
                'total_sesi' => (int) (clone $periodeQuery)->sum('jumlah_sesi'),
                'total_hadir' => (int) (clone $periodeQuery)->sum('jumlah_hadir'),
            ],
        ]);
    }

    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'required|date_format:Y-m',
            'guru_id' => 'nullable|exists:gurus,id',
        ]);

        $periode = $validated['periode'];

        $guruQuery = Guru::with('grade');

        if ($validated['guru_id'] ?? null) {
            $guruQuery->where('id', $validated['guru_id']);
        }

        $gurus = $guruQuery->get();

        foreach ($gurus as $guru) {
            Penggajian::calculateForGuru($guru, $periode);
        }

        $jumlah = Penggajian::where('periode', $periode)->count();

        Notification::sendToRole(
            'admin',
            'Perhitungan Gaji Diperbarui',
            'Rekap honor periode '.$periode.' berhasil dihitung ulang atas data '.$jumlah.' guru dari sesi mengajar yang tervalidasi.',
            'success',
            'gaji'
        );

        return back()->with('success', 'Gaji berhasil dihitung ulang untuk periode '.$periode.' atas '.$jumlah.' guru.');
    }

    public function pay(Request $request, Penggajian $penggajian)
    {
        if ($penggajian->status_bayar === Penggajian::STATUS_SUDAH) {
            return back()->with('info', 'Penggajian '.$penggajian->guru?->nama.' periode '.$penggajian->periode.' sudah pernah dibayar.');
        }

        $penggajian->update(['status_bayar' => Penggajian::STATUS_SUDAH]);

        $user = $penggajian->guru?->user;

        if ($user) {
            Notification::send(
                $user,
                'Honor Sudah Dibayar',
                'Honor periode '.$penggajian->periode.' sebesar Rp '.number_format((float) $penggajian->total, 0, ',', '.')
                    .' atas '.$penggajian->jumlah_hadir.' kehadiran telah dibayar. Slip gaji dapat diunduh melalui menu Slip Gaji.',
                'success',
                'gaji'
            );
        }

        return back()->with('success', 'Pembayaran honor '.($penggajian->guru?->nama ?? '').' periode '.$penggajian->periode.' berhasil dicatat.');
    }

    public function downloadPayslip(Penggajian $penggajian)
    {
        $user = request()->user();

        if ($user->isAdmin()) {
            $penggajian->load('guru.grade', 'transport', 'guru.programs');
        } else {
            $penggajian = Penggajian::where('guru_id', $user->guru_id)
                ->where('id', $penggajian->id)
                ->with('guru.grade', 'transport', 'guru.programs')
                ->firstOrFail();
        }

        $pdf = Pdf::loadView('pdf.payslip', ['penggajian' => $penggajian, 'tanggal' => Tanggal::class])
            ->setPaper('a5', 'portrait');

        $guruNama = preg_replace('/[^a-zA-Z0-9\s-]/', '', $penggajian->guru->nama ?? 'guru');
        $filename = 'slip-gaji-'.$guruNama.'-'.$penggajian->periode.'.pdf';

        return $pdf->download($filename);
    }

    public function guruSalary(Request $request)
    {
        $user = $request->user();
        $guru = $user->guru;

        if (! $guru) {
            return Inertia::render('Guru/Salary/Index', [
                'penggajians' => [],
                'guru' => (object) ['nama' => $user->name, 'grade' => null],
                'totalGaji' => 0,
                'totalBayar' => 0,
                'gajiBulanIni' => null,
            ]);
        }

        $penggajians = Penggajian::with(['transport', 'guru.programs'])
            ->where('guru_id', $guru->id)
            ->orderBy('periode', 'desc')
            ->get();

        $now = now();
        $bulanIni = Penggajian::where('guru_id', $guru->id)
            ->where('periode', $now->format('Y-m'))
            ->first();

        return Inertia::render('Guru/Salary/Index', [
            'penggajians' => $penggajians,
            'guru' => $guru->load(['grade', 'programs']),
            'totalGaji' => (float) $penggajians->sum('total'),
            'totalBayar' => (float) $penggajians->where('status_bayar', Penggajian::STATUS_SUDAH)->sum('total'),
            'gajiBulanIni' => $bulanIni,
        ]);
    }
}
