<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\TeachingMaterialResource;
use App\Models\BahanAjar;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TeachingMaterialController extends ApiController
{
    private const DISK = 'local';

    private const DIRECTORY = 'bahan-ajar';

    /**
     * List teaching materials (public, searchable).
     */
    public function index(Request $request): JsonResponse
    {
        $query = BahanAjar::with('uploader')
            ->when($request->filled('search'), function ($q, $s) {
                $safe = str_replace(['%', '_'], ['\\%', '\\_'], $s);

                $q->where(function ($w) use ($safe) {
                    $w->where('judul', 'like', "%{$safe}%", '\\')
                        ->orWhere('deskripsi', 'like', "%{$safe}%", '\\');
                });
            })
            ->when($request->filled('filter_mapel'), fn ($q, $m) => $q->where('mapel', $m));

        $materials = $query->latest()
            ->paginate($request->integer('per_page', 12))
            ->withQueryString();

        return $this->paginatedResponse(TeachingMaterialResource::collection($materials));
    }

    /**
     * Show a single teaching material (public).
     */
    public function show(BahanAjar $material): JsonResponse
    {
        $material->load('uploader');

        return $this->successResponse(new TeachingMaterialResource($material));
    }

    /**
     * Download the material file (token required).
     */
    public function download(BahanAjar $material)
    {
        abort_unless(
            Storage::disk(self::DISK)->exists($material->file_path),
            404,
            'The teaching material file was not found.'
        );

        return Storage::disk(self::DISK)->download($material->file_path, $material->file_name);
    }

    /**
     * Upload a new teaching material and notify all teachers (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'mapel' => 'required|in:IPA,MTK,umum',
            'file' => 'required|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,webp,zip|max:10240',
        ], [
            'file.required' => 'A material file is required.',
            'file.mimes' => 'The file must be a PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, WEBP, or ZIP.',
            'file.max' => 'The file size may not exceed 10 MB.',
        ]);

        $file = $request->file('file');
        $filename = Str::slug($validated['judul']).'-'.Str::lower(Str::random(8)).'.'.$file->extension();
        $path = $file->storeAs(self::DIRECTORY, $filename, self::DISK);

        $material = BahanAjar::create([
            'user_id' => $request->user()->id,
            'judul' => $validated['judul'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'mapel' => $validated['mapel'],
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        $notified = $this->notifyGuru($material);

        return $this->createdResponse(
            (new TeachingMaterialResource($material->load('uploader')))->resolve() + ['notified_teachers' => $notified],
            'Teaching material uploaded successfully.'
        );
    }

    /**
     * Update metadata and optionally replace the file (admin).
     */
    public function update(Request $request, BahanAjar $material): JsonResponse
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'mapel' => 'required|in:IPA,MTK,umum',
            'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,webp,zip|max:10240',
        ], [
            'file.mimes' => 'The file must be a PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, WEBP, or ZIP.',
            'file.max' => 'The file size may not exceed 10 MB.',
        ]);

        $attributes = [
            'judul' => $validated['judul'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'mapel' => $validated['mapel'],
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = Str::slug($validated['judul']).'-'.Str::lower(Str::random(8)).'.'.$file->extension();
            $path = $file->storeAs(self::DIRECTORY, $filename, self::DISK);

            if ($material->file_path && Storage::disk(self::DISK)->exists($material->file_path)) {
                Storage::disk(self::DISK)->delete($material->file_path);
            }

            $attributes['file_path'] = $path;
            $attributes['file_name'] = $file->getClientOriginalName();
            $attributes['file_mime'] = $file->getMimeType();
            $attributes['file_size'] = $file->getSize();
        }

        $material->update($attributes);

        return $this->successResponse(
            new TeachingMaterialResource($material->refresh()->load('uploader')),
            'Teaching material updated successfully.'
        );
    }

    /**
     * Delete a teaching material and its physical file (admin).
     */
    public function destroy(BahanAjar $material): JsonResponse
    {
        if ($material->file_path && Storage::disk(self::DISK)->exists($material->file_path)) {
            Storage::disk(self::DISK)->delete($material->file_path);
        }

        $material->delete();

        return $this->deletedResponse('Teaching material deleted successfully.');
    }

    /**
     * Send an in-app notification to every teacher account.
     */
    private function notifyGuru(BahanAjar $material): int
    {
        $guruUserIds = User::where('role', 'guru')->pluck('id');

        if ($guruUserIds->isEmpty()) {
            return 0;
        }

        $now = now();
        $rows = $guruUserIds->map(fn ($userId) => [
            'user_id' => $userId,
            'judul' => 'New Teaching Material: '.$material->judul,
            'pesan' => 'An admin uploaded new teaching material'.($material->mapel !== 'umum' ? ' for the '.$material->mapel.' subject' : '').'. Open the Teaching Material menu to download it.',
            'tipe' => 'info',
            'kategori' => 'sistem',
            'dibaca' => false,
            'dibaca_pada' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        Notification::insert($rows);

        return count($rows);
    }
}
