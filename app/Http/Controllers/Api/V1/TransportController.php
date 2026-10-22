<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\TransportResource;
use App\Models\Transport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransportController extends ApiController
{
    /**
     * List all transport types (public).
     */
    public function index(): JsonResponse
    {
        $transports = Transport::withCount('penggajians')->orderBy('jenis')->get();

        return $this->successResponse(TransportResource::collection($transports)->resolve());
    }

    /**
     * Show a single transport type (public).
     */
    public function show(Transport $transport): JsonResponse
    {
        $transport->loadCount('penggajians');

        return $this->successResponse(new TransportResource($transport));
    }

    /**
     * Create a transport type (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jenis' => 'required|string|max:50|unique:transports,jenis',
            'biaya' => 'required|numeric|min:1',
        ]);

        $transport = Transport::create($validated);

        return $this->createdResponse(new TransportResource($transport), 'Transport created successfully.');
    }

    /**
     * Update a transport type (admin).
     */
    public function update(Request $request, Transport $transport): JsonResponse
    {
        $validated = $request->validate([
            'jenis' => 'required|string|max:50|unique:transports,jenis,'.$transport->id,
            'biaya' => 'required|numeric|min:1',
        ]);

        $transport->update($validated);

        return $this->successResponse(new TransportResource($transport->refresh()), 'Transport updated successfully.');
    }

    /**
     * Delete a transport type (admin). Blocked while payroll records use it.
     */
    public function destroy(Transport $transport): JsonResponse
    {
        $penggajiansCount = $transport->penggajians()->count();

        if ($penggajiansCount > 0) {
            return $this->errorResponse("Transport cannot be deleted because it is still used by {$penggajiansCount} payroll record(s).", 409);
        }

        $transport->delete();

        return $this->deletedResponse('Transport deleted successfully.');
    }
}
