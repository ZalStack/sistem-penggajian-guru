<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\TeacherResource;
use App\Models\Grade;
use App\Models\Guru;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TeacherController extends ApiController
{
    /**
     * List teachers (public; sensitive fields only for admins).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'filter_grade' => 'nullable|integer|exists:grades,id',
            'filter_mapel' => 'nullable|in:IPA,MTK',
        ]);

        $query = Guru::with(['grade', 'user'])
            ->when($validated['search'] ?? null, function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);

                return $q->where(function ($w) use ($safe) {
                    $w->where('nama', 'like', "%{$safe}%", '\\')
                        ->orWhere('domisili', 'like', "%{$safe}%", '\\')
                        ->orWhere('alamat', 'like', "%{$safe}%", '\\')
                        ->orWhere('nomor_telepon', 'like', "%{$safe}%", '\\');
                });
            })
            ->when($validated['filter_grade'] ?? null, fn ($q, $g) => $q->where('grade_id', $g))
            ->when($validated['filter_mapel'] ?? null, fn ($q, $m) => $q->where('mapel', $m));

        $gurus = $query->orderBy('nama')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return $this->paginatedResponse(TeacherResource::collection($gurus));
    }

    /**
     * Show a single teacher (public; sensitive fields only for admins).
     */
    public function show(Guru $teacher): JsonResponse
    {
        $teacher->load(['grade', 'user', 'penggajians.transport']);

        return $this->successResponse(new TeacherResource($teacher));
    }

    /**
     * Grades lookup for forms (public).
     */
    public function options(): JsonResponse
    {
        return $this->successResponse([
            'grades' => Grade::orderBy('kode_grade')->get(),
        ]);
    }

    /**
     * Create a teacher together with its login account (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'mapel' => 'required|in:IPA,MTK',
            'jenjang' => 'nullable|string|max:100',
            'domisili' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:1000',
            'riwayat_pendidikan' => 'nullable|string|max:2000',
            'tanggal_bergabung' => 'nullable|date',
            'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
            'tunjangan_khusus' => 'nullable|numeric|min:0|max:9999999999',
            'bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:50',
            'keterangan_mengajar' => 'nullable|string|max:1000',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $passwordToUse = $validated['password'] ?? Str::random(16);
        $isGenerated = ! isset($validated['password']);

        DB::transaction(function () use ($validated, $passwordToUse, &$guru) {
            $user = User::create([
                'name' => $validated['nama'],
                'email' => $validated['email'],
                'password' => Hash::make($passwordToUse),
            ]);

            $user->forceFill(['role' => 'guru'])->save();

            $guru = Guru::create([
                'nama' => $validated['nama'],
                'grade_id' => $validated['grade_id'],
                'mapel' => $validated['mapel'],
                'jenjang' => $validated['jenjang'] ?? null,
                'domisili' => $validated['domisili'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
                'riwayat_pendidikan' => $validated['riwayat_pendidikan'] ?? null,
                'tanggal_bergabung' => $validated['tanggal_bergabung'] ?? null,
                'nomor_telepon' => $validated['nomor_telepon'] ?? null,
                'tunjangan_khusus' => $validated['tunjangan_khusus'] ?? 0,
                'bank' => $validated['bank'] ?? null,
                'nomor_rekening' => $validated['nomor_rekening'] ?? null,
                'keterangan_mengajar' => $validated['keterangan_mengajar'] ?? null,
                'user_id' => $user->id,
            ]);

            $user->forceFill(['guru_id' => $guru->id])->save();
        });

        $guru->load(['grade', 'user']);

        return $this->createdResponse([
            'guru' => new TeacherResource($guru),
            'credentials' => [
                'email' => $validated['email'],
                'password' => $passwordToUse,
                'password_generated' => $isGenerated,
            ],
        ], 'Teacher created successfully.');
    }

    /**
     * Update a teacher (admin).
     */
    public function update(Request $request, Guru $teacher): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'grade_id' => 'required|exists:grades,id',
            'mapel' => 'required|in:IPA,MTK',
            'jenjang' => 'nullable|string|max:100',
            'domisili' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:1000',
            'riwayat_pendidikan' => 'nullable|string|max:2000',
            'tanggal_bergabung' => 'nullable|date',
            'nomor_telepon' => 'nullable|string|max:20|regex:/^[0-9+\-\s\(\)]+$/',
            'tunjangan_khusus' => 'nullable|numeric|min:0|max:9999999999',
            'bank' => 'nullable|string|max:50',
            'nomor_rekening' => 'nullable|string|max:50',
            'keterangan_mengajar' => 'nullable|string|max:1000',
            'email' => 'required|email|unique:users,email,'.$teacher->user_id,
        ]);

        $teacher->update([
            'nama' => $validated['nama'],
            'grade_id' => $validated['grade_id'],
            'mapel' => $validated['mapel'],
            'jenjang' => $validated['jenjang'] ?? null,
            'domisili' => $validated['domisili'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'riwayat_pendidikan' => $validated['riwayat_pendidikan'] ?? null,
            'tanggal_bergabung' => $validated['tanggal_bergabung'] ?? null,
            'nomor_telepon' => $validated['nomor_telepon'] ?? null,
            'tunjangan_khusus' => $validated['tunjangan_khusus'] ?? 0,
            'bank' => $validated['bank'] ?? null,
            'nomor_rekening' => $validated['nomor_rekening'] ?? null,
            'keterangan_mengajar' => $validated['keterangan_mengajar'] ?? null,
        ]);

        if ($teacher->user) {
            $teacher->user->update([
                'name' => $validated['nama'],
                'email' => $validated['email'],
            ]);
        }

        return $this->successResponse(
            new TeacherResource($teacher->refresh()->load(['grade', 'user'])),
            'Teacher updated successfully.'
        );
    }

    /**
     * Delete a teacher and its login account (admin).
     */
    public function destroy(Guru $teacher): JsonResponse
    {
        DB::transaction(function () use ($teacher) {
            if ($teacher->user) {
                $teacher->user->tokens()->delete();
                $teacher->user->delete();
            }
            $teacher->delete();
        });

        return $this->deletedResponse('Teacher deleted successfully.');
    }

    /**
     * Reset a teacher's account password (admin). Returns the new password.
     */
    public function resetPassword(Guru $teacher): JsonResponse
    {
        if (! $teacher->user) {
            return $this->errorResponse('This teacher does not have a login account yet.', 422);
        }

        $newPassword = Str::random(16);

        $teacher->user->update(['password' => Hash::make($newPassword)]);

        return $this->successResponse([
            'email' => $teacher->user->email,
            'password' => $newPassword,
        ], 'Password reset successfully.');
    }

    /**
     * Export teacher login credentials as a PDF document (admin).
     */
    public function exportCredentials(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'filter_grade' => 'nullable|integer|exists:grades,id',
        ]);

        $gurus = Guru::with(['grade', 'user'])
            ->when($validated['search'] ?? null, function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);

                return $q->where('nama', 'like', "%{$safe}%", '\\');
            })
            ->when($validated['filter_grade'] ?? null, fn ($q, $g) => $q->where('grade_id', $g))
            ->orderBy('nama')
            ->get();

        $pdf = Pdf::loadView('pdf.guru-credentials', ['gurus' => $gurus])
            ->setPaper('a4', 'landscape');

        $filename = 'data-login-guru-'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($filename);
    }
}
