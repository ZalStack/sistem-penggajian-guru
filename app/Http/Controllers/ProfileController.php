<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load('guru.grade');

        return Inertia::render('Profile/Edit', [
            'user' => $user,
            'guru' => $user->guru,
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Jika role guru, update data guru terkait (tunjangan_khusus TIDAK boleh diubah guru)
        if ($user->isGuru() && $user->guru) {
            $guruData = $request->validate([
                'domisili' => 'nullable|string|max:255',
                'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
                'bank' => 'nullable|string|max:50',
                'nomor_rekening' => 'nullable|string|max:50',
                'keterangan_mengajar' => 'nullable|string|max:1000',
            ]);

            // Sinkronkan nama guru dengan name user
            $guruData['nama'] = $user->name;

            $user->guru->update($guruData);
        }

        // Admin tidak memiliki data guru, jadi tidak perlu update tambahan

        return Redirect::route('profile.edit')->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
