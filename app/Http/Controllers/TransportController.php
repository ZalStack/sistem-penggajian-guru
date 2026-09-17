<?php

namespace App\Http\Controllers;

use App\Models\Transport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransportController extends Controller
{
    public function index()
    {
        return Inertia::render('Transport/Index', [
            'transports' => Transport::withCount('penggajians')->orderBy('jenis')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jenis' => 'required|string|max:50|unique:transports,jenis',
            'biaya' => 'required|numeric|min:0',
        ]);

        Transport::create($validated);

        return redirect()->route('transport.index')->with('success', 'Transport berhasil ditambahkan.');
    }

    public function update(Request $request, Transport $transport)
    {
        $validated = $request->validate([
            'jenis' => 'required|string|max:50|unique:transports,jenis,'.$transport->id,
            'biaya' => 'required|numeric|min:0',
        ]);

        $transport->update($validated);

        return redirect()->route('transport.index')->with('success', 'Transport berhasil diperbarui.');
    }

    public function destroy(Transport $transport)
    {
        if ($transport->penggajians()->exists()) {
            return redirect()->route('transport.index')->with('error', 'Transport tidak dapat dihapus karena masih digunakan pada '.$transport->penggajians()->count().' riwayat penggajian.');
        }

        $transport->delete();

        return redirect()->route('transport.index')->with('success', 'Transport berhasil dihapus.');
    }
}
