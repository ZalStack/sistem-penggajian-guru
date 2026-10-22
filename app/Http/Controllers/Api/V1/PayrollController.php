<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SalaryResource;
use App\Models\Guru;
use App\Models\Penggajian;
use App\Models\Transport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PayrollController extends ApiController
{
    /**
     * Admin: list payroll records (token required, sensitive data).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode' => 'nullable|string|max:7',
            'filter_grade' => 'nullable|integer|exists:grades,id',
            'filter_transport' => 'nullable|integer|exists:transports,id',
        ]);

        $penggajians = Penggajian::with(['guru.grade', 'transport'])
            ->when($validated['periode'] ?? null, fn ($q, $p) => $q->where('periode', $p))
            ->when($validated['filter_grade'] ?? null, fn ($q, $g) => $q->whereHas('guru', fn ($gq) => $gq->where('grade_id', $g)))
            ->when($validated['filter_transport'] ?? null, fn ($q, $t) => $q->where('transport_id', $t))
            ->orderBy('periode', 'desc')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return $this->paginatedResponse(SalaryResource::collection($penggajians));
    }

    /**
     * Admin: lookup options for payroll forms (token required).
     */
    public function options(): JsonResponse
    {
        return $this->successResponse([
            'gurus' => Guru::with('grade')->orderBy('nama')->get()->map(fn (Guru $guru) => [
                'id' => $guru->id,
                'nama' => $guru->nama,
                'honor_per_sesi' => (float) ($guru->grade?->honor_per_sesi ?? 0),
            ]),
            'transports' => Transport::orderBy('jenis')->get(),
        ]);
    }

    /**
     * Admin: show a payroll record (token required).
     */
    public function show(Penggajian $payroll): JsonResponse
    {
        $payroll->load(['guru.grade', 'transport']);

        return $this->successResponse(new SalaryResource($payroll));
    }

    /**
     * Admin: create a payroll record (token required).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guru_id' => [
                'required',
                'exists:gurus,id',
                Rule::unique('penggajians', 'guru_id')
                    ->where('periode', $request->periode)
                    ->where('transport_id', $request->transport_id),
            ],
            'periode' => 'required|string|max:7',
            'jumlah_sesi' => 'required|integer|min:1',
            'transport_id' => 'required|exists:transports,id',
        ], [
            'guru_id.unique' => 'This teacher already has a payroll record for the selected period and transport.',
            'jumlah_sesi.min' => 'The session count must be at least 1.',
        ]);

        $guru = Guru::with('grade')->findOrFail($validated['guru_id']);
        $transport = Transport::findOrFail($validated['transport_id']);

        $honor = ($guru->grade?->honor_per_sesi ?? 0) * $validated['jumlah_sesi'];
        $totalTransport = $transport->biaya * $validated['jumlah_sesi'];

        $payroll = Penggajian::create([
            ...$validated,
            'honor' => $honor,
            'total_transport' => $totalTransport,
            'total' => $honor + $totalTransport,
        ]);

        return $this->createdResponse(
            new SalaryResource($payroll->load(['guru.grade', 'transport'])),
            'Payroll record created successfully.'
        );
    }

    /**
     * Admin: update a payroll record (token required).
     */
    public function update(Request $request, Penggajian $payroll): JsonResponse
    {
        $validated = $request->validate([
            'guru_id' => [
                'required',
                'exists:gurus,id',
                Rule::unique('penggajians', 'guru_id')
                    ->where('periode', $request->periode)
                    ->where('transport_id', $request->transport_id)
                    ->ignore($payroll->id),
            ],
            'periode' => 'required|string|max:7',
            'jumlah_sesi' => 'required|integer|min:1',
            'transport_id' => 'required|exists:transports,id',
        ], [
            'guru_id.unique' => 'This teacher already has a payroll record for the selected period and transport.',
            'jumlah_sesi.min' => 'The session count must be at least 1.',
        ]);

        $guru = Guru::with('grade')->findOrFail($validated['guru_id']);
        $transport = Transport::findOrFail($validated['transport_id']);

        $honor = ($guru->grade?->honor_per_sesi ?? 0) * $validated['jumlah_sesi'];
        $totalTransport = $transport->biaya * $validated['jumlah_sesi'];

        $payroll->update([
            ...$validated,
            'honor' => $honor,
            'total_transport' => $totalTransport,
            'total' => $honor + $totalTransport,
        ]);

        return $this->successResponse(
            new SalaryResource($payroll->refresh()->load(['guru.grade', 'transport'])),
            'Payroll record updated successfully.'
        );
    }

    /**
     * Admin: delete a payroll record (token required). Paid records are locked.
     */
    public function destroy(Penggajian $payroll): JsonResponse
    {
        if ($payroll->status_bayar === 'sudah_dibayar') {
            return $this->errorResponse('Payroll records that have already been paid cannot be deleted.', 409);
        }

        $payroll->delete();

        return $this->deletedResponse('Payroll record deleted successfully.');
    }
}
