<?php

namespace App\Http\Controllers;

use App\Exports\PenggajianExport;
use App\Models\Grade;
use App\Models\Penggajian;
use App\Models\Transport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class LaporanController extends Controller
{
    private function buildQuery(Request $request)
    {
        return Penggajian::with(['guru.grade', 'transport'])
            ->when($request->periode, fn ($q, $p) => $q->where('periode', $p))
            ->when($request->filter_grade, fn ($q, $g) => $q->whereHas('guru', fn ($gq) => $gq->where('grade_id', $g)))
            ->when($request->filter_mapel, fn ($q, $m) => $q->whereHas('guru', fn ($gq) => $gq->where('mapel', $m)))
            ->when($request->filter_transport, fn ($q, $t) => $q->where('transport_id', $t));
    }

    public function index(Request $request)
    {
        $penggajians = $this->buildQuery($request)->get();

        return Inertia::render('Laporan/Index', [
            'penggajians' => $penggajians,
            'grandTotal' => (float) $penggajians->sum('total'),
            'totalSesi' => $penggajians->sum('jumlah_sesi'),
            'grades' => Grade::orderBy('kode_grade')->get(),
            'transports' => Transport::orderBy('jenis')->get(),
            'filters' => $request->only(['periode', 'filter_grade', 'filter_mapel', 'filter_transport']),
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
