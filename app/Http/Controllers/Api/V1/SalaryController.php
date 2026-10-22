<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SalaryResource;
use App\Http\Resources\TeacherResource;
use App\Models\Guru;
use App\Models\Penggajian;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends ApiController
{
    /**
     * Admin: list payroll records with filters (token required, sensitive data).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode' => 'nullable|string|max:7',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
            'status_bayar' => 'nullable|in:belum_dibayar,sudah_dibayar',
        ]);

        $penggajians = Penggajian::with(['guru.grade', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->where('periode', $p))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->when($validated['status_bayar'] ?? null, fn ($q, $s) => $q->where('status_bayar', $s))
            ->orderBy('periode', 'desc')
            ->orderBy('guru_id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return $this->paginatedResponse(SalaryResource::collection($penggajians));
    }

    /**
     * Guru: my salary history with summary (token required, own data).
     */
    public function mine(Request $request): JsonResponse
    {
        $guru = $request->user()->guru;

        if (! $guru) {
            return $this->successResponse([
                'penggajians' => [],
                'summary' => [
                    'total_gaji' => 0,
                    'total_bayar' => 0,
                    'gaji_bulan_ini' => null,
                ],
                'guru' => null,
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

        return $this->successResponse([
            'penggajians' => SalaryResource::collection($penggajians)->resolve(),
            'summary' => [
                'total_gaji' => (float) $penggajians->sum('total'),
                'total_bayar' => (float) $penggajians->where('status_bayar', 'sudah_dibayar')->sum('total'),
                'gaji_bulan_ini' => $bulanIni ? (new SalaryResource($bulanIni->load('transport')))->resolve() : null,
            ],
            'guru' => new TeacherResource($guru->load('grade')),
        ]);
    }

    /**
     * Admin: recalculate payroll for a period (token required, throttled).
     */
    public function calculate(Request $request): JsonResponse
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

        $count = Penggajian::where('periode', $validated['periode'])
            ->when($validated['guru_id'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->count();

        return $this->successResponse([
            'periode' => $validated['periode'],
            'jumlah_guru_dihitung' => $gurus->count(),
            'jumlah_rekaman_gaji' => $count,
        ], 'Salary recalculated successfully for period '.$validated['periode'].'.');
    }

    /**
     * Admin: mark a payroll record as paid (token required).
     */
    public function pay(Penggajian $salary): JsonResponse
    {
        $salary->update(['status_bayar' => 'sudah_dibayar']);

        return $this->successResponse(
            new SalaryResource($salary->refresh()->load(['guru.grade', 'transport'])),
            'Payment status updated successfully.'
        );
    }

    /**
     * Admin: download a payslip PDF (token required).
     */
    public function payslip(Penggajian $salary)
    {
        $salary->load('guru.grade', 'transport');

        $pdf = Pdf::loadView('pdf.payslip', ['penggajian' => $salary])
            ->setPaper('a5', 'portrait');

        $guruNama = preg_replace('/[^a-zA-Z0-9\s-]/', '', $salary->guru->nama ?? 'guru');
        $filename = 'slip-gaji-'.$guruNama.'-'.$salary->periode.'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Guru: download my own payslip PDF (token required, ownership enforced).
     */
    public function myPayslip(Request $request, Penggajian $salary)
    {
        $user = $request->user();

        $salary = Penggajian::where('guru_id', $user->guru_id)
            ->where('id', $salary->id)
            ->with('guru.grade', 'transport')
            ->firstOrFail();

        $pdf = Pdf::loadView('pdf.payslip', ['penggajian' => $salary])
            ->setPaper('a5', 'portrait');

        $guruNama = preg_replace('/[^a-zA-Z0-9\s-]/', '', $salary->guru->nama ?? 'guru');
        $filename = 'slip-gaji-'.$guruNama.'-'.$salary->periode.'.pdf';

        return $pdf->download($filename);
    }
}
