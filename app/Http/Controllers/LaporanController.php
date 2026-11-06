<?php

namespace App\Http\Controllers;

use App\Exports\PenggajianExport;
use App\Models\Grade;
use App\Models\Penggajian;
use App\Models\Program;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class LaporanController extends Controller
{
    private function buildQuery(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|string|max:7',
            'filter_grade' => 'nullable|integer|exists:grades,id',
            'filter_mapel' => 'nullable|in:IPA,MTK',
            'filter_program' => 'nullable|integer|exists:programs,id',
            'search' => 'nullable|string|max:100',
        ]);

        return Penggajian::with(['guru.grade', 'guru.programs', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->where('periode', $p))
            ->when($validated['filter_grade'] ?? null, fn ($q, $g) => $q->whereHas('guru', fn ($gq) => $gq->where('grade_id', $g)))
            ->when($validated['filter_mapel'] ?? null, fn ($q, $m) => $q->whereHas('guru', fn ($gq) => $gq->where('mapel', $m)))
            ->when($validated['filter_program'] ?? null, function ($q, $p) {
                // Guard: whereJsonContains hanya dijalankan jika kolom detail ada isinya.
                try {
                    $q->whereJsonContains('detail', ['program_id' => (int) $p]);
                } catch (\Throwable) {
                    // Kolom detail tidak valid JSON di baris tertentu — lewati filter.
                }
            })
            ->when($validated['search'] ?? null, function ($q, $s) {
                $safe = addcslashes($s, '%_\\');
                $q->whereHas('guru', fn ($gq) => $gq->where('nama', 'like', "%{$safe}%"));
            });
    }

    public function index(Request $request)
    {
        $baseQuery = $this->buildQuery($request);

        // Hitung totals via SQL aggregate (aman untuk dataset besar).
        $totals = (clone $baseQuery)->selectRaw('SUM(total) as grand_total, SUM(jumlah_sesi) as total_sesi, COUNT(DISTINCT guru_id) as jumlah_guru')->first();

        $penggajians = $baseQuery->get();

        return Inertia::render('Laporan/Index', [
            'penggajians' => $penggajians,
            'grandTotal' => (float) ($totals->grand_total ?? 0),
            'totalSesi' => (int) ($totals->total_sesi ?? 0),
            'grades' => Grade::orderBy('kode_grade')->get(),
            'programs' => Program::orderBy('urutan')->orderBy('nama')->get(),
            'filters' => $request->only(['periode', 'filter_grade', 'filter_mapel', 'filter_program', 'search']),
        ]);
    }

    public function exportPdf(Request $request)
    {
        $penggajians = $this->buildQuery($request)->get();
        $periode = $request->periode ?? now()->format('Y-m');

        $pdf = Pdf::loadView('pdf.laporan', [
            'penggajians' => $penggajians,
            'periode' => $periode,
            'grandTotal' => $penggajians->sum('total'),
            'totalSesi' => $penggajians->sum('jumlah_sesi'),
        ]);

        return $pdf->download("rekap-penggajian-{$periode}.pdf");
    }

    public function exportExcel(Request $request)
    {
        $penggajians = $this->buildQuery($request)->get();
        $periode = $request->periode ?? now()->format('Y-m');

        return Excel::download(new PenggajianExport($penggajians), "rekap-penggajian-{$periode}.xlsx");
    }
}
