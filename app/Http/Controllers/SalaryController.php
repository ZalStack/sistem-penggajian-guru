<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Penggajian;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|string|max:7',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'status_bayar' => 'nullable|in:belum_dibayar,sudah_dibayar',
        ]);

        $query = Penggajian::with(['guru.grade', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->where('periode', $p))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['status_bayar'] ?? null, fn ($q, $s) => $q->where('status_bayar', $s))
            ->orderBy('periode', 'desc')
            ->orderBy('guru_id');

        $penggajians = $query->get();

        $periodeDefault = now()->format('Y-m');

        return Inertia::render('Admin/Salary/Index', [
            'penggajians' => $penggajians,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_guru', 'status_bayar']),
            'periodeDefault' => $periodeDefault,
        ]);
    }

    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'required|string|size:7',
            'guru_id' => 'nullable|exists:gurus,id',
        ]);

        $guruQuery = Guru::with('grade');
        if ($validated['guru_id'] ?? null) {
            $guruQuery->where('id', $validated['guru_id']);
        }
        $gurus = $guruQuery->get();

        foreach ($gurus as $guru) {
            Penggajian::calculateForGuru($guru, $validated['periode']);
        }

        return back()->with('success', 'Gaji berhasil dihitung untuk periode '.$validated['periode']);
    }

    public function pay(Request $request, Penggajian $penggajian)
    {
        $penggajian->update(['status_bayar' => 'sudah_dibayar']);

        return back()->with('success', 'Status pembayaran berhasil diperbarui.');
    }

    public function downloadPayslip(Penggajian $penggajian)
    {
        $user = request()->user();

        if ($user->isAdmin()) {
            $penggajian->load('guru.grade', 'transport');
        } else {
            $penggajian = Penggajian::where('guru_id', $user->guru_id)
                ->where('id', $penggajian->id)
                ->with('guru.grade', 'transport')
                ->firstOrFail();
        }

        $pdf = Pdf::loadView('pdf.payslip', ['penggajian' => $penggajian])
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
                'guru' => (object) ['nama' => $user->name],
                'totalGaji' => 0,
                'totalBayar' => 0,
                'gajiBulanIni' => null,
            ]);
        }

        $penggajians = Penggajian::with('transport')
            ->where('guru_id', $guru->id)
            ->orderBy('periode', 'desc')
            ->get();

        $now = now();
        $bulanIni = Penggajian::where('guru_id', $guru->id)
            ->where('periode', $now->format('Y-m'))
            ->first();

        $totalGaji = $penggajians->sum('total');
        $totalBayar = $penggajians->where('status_bayar', 'sudah_dibayar')->sum('total');

        return Inertia::render('Guru/Salary/Index', [
            'penggajians' => $penggajians,
            'guru' => $guru,
            'totalGaji' => $totalGaji,
            'totalBayar' => $totalBayar,
            'gajiBulanIni' => $bulanIni,
        ]);
    }
}
