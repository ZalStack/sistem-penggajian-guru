<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function index()
    {
        $locations = Location::withCount('sessions')
            ->with(['sessions.guru.grade'])
            ->orderBy('nama_lokasi')
            ->get()
            ->map(function (Location $location) {
                $location->setAttribute(
                    'gurus',
                    $location->sessions->pluck('guru')->filter()->unique('id')->values()
                );

                return $location;
            });

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        Location::create($validated);

        return back()->with('success', 'Lokasi mengajar berhasil ditambahkan.');
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate($this->rules());

        $location->update($validated);

        return back()->with('success', 'Lokasi mengajar berhasil diperbarui.');
    }

    public function destroy(Location $location)
    {
        $sessionsCount = $location->sessions()->count();
        if ($sessionsCount > 0) {
            return back()->with('error', 'Lokasi tidak dapat dihapus karena masih digunakan oleh '.$sessionsCount.' sesi mengajar.');
        }

        $location->delete();

        return back()->with('success', 'Lokasi mengajar berhasil dihapus.');
    }

    /**
     * @return array<string, string>
     */
    private function rules(): array
    {
        return [
            'nama_lokasi' => 'required|string|max:255',
            'alamat' => 'nullable|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|integer|min:10|max:1000',
        ];
    }
}
