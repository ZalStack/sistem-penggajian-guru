<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\PenggajianExport;
use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SalaryResource;
use App\Models\Grade;
use App\Models\Penggajian;
use App\Models\Transport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends ApiController
{
    private function buildQuery(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'nullable|string|max:7',
            'filter_grade' => 'nullable|integer|exists:grades,id',
            'filter_mapel' => 'nullable|in:IPA,MTK',
            'filter_transport' => 'nullable|integer|exists:transports,id',
        ]);

        return Penggajian::with(['guru.grade', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->where('periode', $p))
            ->when($validated['filter_grade'] ?? null, fn ($q, $g) => $q->whereHas('guru', fn ($gq) => $gq->where('grade_id', $g)))
            ->when($validated['filter_mapel'] ?? null, fn ($q, $m) => $q->whereHas('guru', fn ($gq) => $gq->where('mapel', $m)))
            ->when($validated['filter_transport'] ?? null, fn ($q, $t) => $q->where('transport_id', $t));
    }

    /**
     * Admin: payroll report summary with filters (token required).
     */
    public function index(Request $request): JsonResponse
    {
        $penggajians = $this->buildQuery($request)->get();

        return $this->successResponse([
            'penggajians' => SalaryResource::collection($penggajians)->resolve(),
            'summary' => [
                'grand_total' => (float) $penggajians->sum('total'),
                'total_sesi' => (int) $penggajians->sum('jumlah_sesi'),
                'jumlah_rekaman' => $penggajians->count(),
            ],
            'filters' => $request->only(['periode', 'filter_grade', 'filter_mapel', 'filter_transport']),
            'options' => [
                'grades' => Grade::orderBy('kode_grade')->get(),
                'transports' => Transport::orderBy('jenis')->get(),
            ],
        ]);
    }

    /**
     * Admin: export the payroll report as PDF (token required).
     */
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

    /**
     * Admin: export the payroll report as Excel (token required).
     */
    public function exportExcel(Request $request)
    {
        $penggajians = $this->buildQuery($request)->get();
        $periode = $request->periode ?? now()->format('Y-m');

        return Excel::download(new PenggajianExport($penggajians), "rekap-penggajian-{$periode}.xlsx");
    }
}
