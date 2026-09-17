<?php

namespace App\Http\Controllers;

use App\Models\Guru;
use App\Models\Location;
use App\Models\TeachingSession;
use App\Models\Transport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeachingSessionController extends Controller
{
    public function index(Request $request)
    {
        $query = TeachingSession::with(['guru.grade', 'location', 'transport'])
            ->when($request->periode, fn ($q, $p) => $q->whereMonth('tanggal', substr($p, 5, 2))->whereYear('tanggal', substr($p, 0, 4)))
            ->when($request->filter_guru, fn ($q, $g) => $q->where('guru_id', $g))
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai');

        $sessions = $query->get();

        return Inertia::render('Admin/Sessions/Index', [
            'sessions' => $sessions,
            'gurus' => Guru::with('grade')->orderBy('nama')->get(),
            'locations' => Location::orderBy('nama_lokasi')->get(),
            'transports' => Transport::orderBy('jenis')->get(),
            'filters' => $request->only(['periode', 'filter_guru']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'guru_id' => 'required|exists:gurus,id',
            'location_id' => 'required|exists:locations,id',
            'transport_id' => 'required|exists:transports,id',
            'mapel' => 'required|in:IPA,MTK',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required|after:jam_mulai',
            'jumlah_sesi' => 'required|integer|min:1|max:10',
        ]);

        TeachingSession::create($validated);

        return back()->with('success', 'Sesi mengajar berhasil ditambahkan.');
    }

    public function update(Request $request, TeachingSession $session)
    {
        $validated = $request->validate([
            'guru_id' => 'required|exists:gurus,id',
            'location_id' => 'required|exists:locations,id',
            'transport_id' => 'required|exists:transports,id',
            'mapel' => 'required|in:IPA,MTK',
            'tanggal' => 'required|date',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required|after:jam_mulai',
            'jumlah_sesi' => 'required|integer|min:1|max:10',
        ]);

        $session->update($validated);

        return back()->with('success', 'Sesi mengajar berhasil diperbarui.');
    }

    public function destroy(TeachingSession $session)
    {
        $session->delete();

        return back()->with('success', 'Sesi mengajar berhasil dihapus.');
    }
}
