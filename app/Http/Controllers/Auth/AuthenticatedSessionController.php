<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $teachers = User::with(['guru.grade', 'guru.programs'])
            ->orderBy('name')
            ->get()
            // Hanya sisakan 1 akun admin utama yaitu 'Administrator' (admin@siguru.com), abaikan admin cadangan/duplikat lainnya
            ->filter(function (User $u) {
                if ($u->role === 'admin') {
                    return $u->email === 'admin@siguru.com' || $u->id === 1;
                }
                return true;
            })
            ->map(function (User $u) {
                $isAdmin = $u->role === 'admin';
                $guru = $u->guru;
                $mapel = $guru ? trim(($guru->mapel ?? '').($guru->bidang_2 ? ' & '.$guru->bidang_2 : '')) : '-';
                $gradeKode = $guru?->grade?->kode_grade ?: '-';
                $jenjang = $guru?->jenjang ?: '-';
                $domisili = $guru?->domisili ?: ($guru?->alamat ?: '-');

                return [
                    'id' => $u->id,
                    'name' => $isAdmin ? 'Administrator' : $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'is_admin' => $isAdmin,
                    'mapel' => $isAdmin ? 'Administrator' : ($mapel ?: 'MTK / IPA'),
                    'grade' => $isAdmin ? 'Admin Sistem' : $gradeKode,
                    'jenjang' => $isAdmin ? '-' : $jenjang,
                    'domisili' => $isAdmin ? '-' : $domisili,
                    'avatar' => $isAdmin ? '🛡️' : '👨‍🏫',
                ];
            })
            ->values();

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'teachers' => $teachers,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
