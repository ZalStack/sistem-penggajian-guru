<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends ApiController
{
    /**
     * List all teaching locations (public).
     */
    public function index(): JsonResponse
    {
        $locations = Location::withCount('sessions')->orderBy('nama_lokasi')->get();

        return $this->successResponse(LocationResource::collection($locations)->resolve());
    }

    /**
     * Show a single location (public).
     */
    public function show(Location $location): JsonResponse
    {
        $location->loadCount('sessions');

        return $this->successResponse(new LocationResource($location));
    }

    /**
     * Create a location (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama_lokasi' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|integer|min:10|max:1000',
        ]);

        $location = Location::create($validated);

        return $this->createdResponse(new LocationResource($location), 'Location created successfully.');
    }

    /**
     * Update a location (admin).
     */
    public function update(Request $request, Location $location): JsonResponse
    {
        $validated = $request->validate([
            'nama_lokasi' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|integer|min:10|max:1000',
        ]);

        $location->update($validated);

        return $this->successResponse(new LocationResource($location->refresh()), 'Location updated successfully.');
    }

    /**
     * Delete a location (admin). Blocked while sessions reference it.
     */
    public function destroy(Location $location): JsonResponse
    {
        $sessionsCount = $location->sessions()->count();

        if ($sessionsCount > 0) {
            return $this->errorResponse("Location cannot be deleted because it is still used by {$sessionsCount} teaching session(s).", 409);
        }

        $location->delete();

        return $this->deletedResponse('Location deleted successfully.');
    }
}
