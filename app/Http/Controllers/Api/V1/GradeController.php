<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\GradeResource;
use App\Models\Grade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends ApiController
{
    /**
     * List all grades (public).
     */
    public function index(): JsonResponse
    {
        $grades = Grade::withCount('gurus')->orderBy('kode_grade')->get();

        return $this->successResponse(GradeResource::collection($grades)->resolve());
    }

    /**
     * Show a single grade (public).
     */
    public function show(Grade $grade): JsonResponse
    {
        $grade->loadCount('gurus');

        return $this->successResponse(new GradeResource($grade));
    }

    /**
     * Create a grade (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode_grade' => 'required|string|max:10|unique:grades,kode_grade',
            'honor_per_sesi' => 'required|numeric|min:1',
        ]);

        $grade = Grade::create($validated);

        return $this->createdResponse(new GradeResource($grade), 'Grade created successfully.');
    }

    /**
     * Update a grade (admin).
     */
    public function update(Request $request, Grade $grade): JsonResponse
    {
        $validated = $request->validate([
            'kode_grade' => 'required|string|max:10|unique:grades,kode_grade,'.$grade->id,
            'honor_per_sesi' => 'required|numeric|min:1',
        ]);

        $grade->update($validated);

        return $this->successResponse(new GradeResource($grade->refresh()), 'Grade updated successfully.');
    }

    /**
     * Delete a grade (admin). Blocked while teachers still use it.
     */
    public function destroy(Grade $grade): JsonResponse
    {
        $gurusCount = $grade->gurus()->count();

        if ($gurusCount > 0) {
            return $this->errorResponse("Grade cannot be deleted because it is still used by {$gurusCount} teacher(s).", 409);
        }

        $grade->delete();

        return $this->deletedResponse('Grade deleted successfully.');
    }
}
