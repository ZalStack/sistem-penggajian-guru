<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\LeaveRequestResource;
use App\Models\Perizinan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveRequestController extends ApiController
{
    /**
     * Admin: list all leave requests with filters (token required).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,disetujui,ditolak',
            'filter_guru' => 'nullable|integer|exists:gurus,id',
        ]);

        $perizinan = Perizinan::with('guru.grade')
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($validated['filter_guru'] ?? null, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return $this->paginatedResponse(LeaveRequestResource::collection($perizinan));
    }

    /**
     * Guru: my leave requests (token required).
     */
    public function mine(Request $request): JsonResponse
    {
        $guru = $request->user()->guru;

        if (! $guru) {
            return $this->successResponse([
                'perizinan' => [],
                'guru' => null,
            ]);
        }

        $perizinan = Perizinan::where('guru_id', $guru->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse([
            'perizinan' => LeaveRequestResource::collection($perizinan)->resolve(),
        ]);
    }

    /**
     * Guru: submit a new leave request (token required).
     */
    public function store(Request $request): JsonResponse
    {
        $guru = $request->user()->guru;

        if (! $guru) {
            return $this->errorResponse('This account is not linked to a teacher profile.', 422);
        }

        $validated = $request->validate([
            'jenis' => 'required|in:izin,sakit,cuti',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string|max:500',
        ]);

        $perizinan = Perizinan::create([
            'guru_id' => $guru->id,
            ...$validated,
        ]);

        return $this->createdResponse(
            new LeaveRequestResource($perizinan->load('guru.grade')),
            'Leave request submitted successfully.'
        );
    }

    /**
     * Admin: approve or reject a leave request (token required).
     */
    public function update(Request $request, Perizinan $perizinan): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:disetujui,ditolak',
            'catatan_admin' => 'required|string|max:500',
        ]);

        $perizinan->update($validated);

        return $this->successResponse(
            new LeaveRequestResource($perizinan->refresh()->load('guru.grade')),
            'Leave request status updated successfully.'
        );
    }
}
