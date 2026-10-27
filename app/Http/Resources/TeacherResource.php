<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = ($request->user() ?? auth('sanctum')->user())?->isAdmin();

        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'mapel' => $this->mapel,
            'jenjang' => $this->jenjang,
            'domisili' => $this->domisili,
            'tanggal_bergabung' => $this->tanggal_bergabung?->toDateString(),
            'keterangan_mengajar' => $this->keterangan_mengajar,
            'grade' => new GradeResource($this->whenLoaded('grade')),
            // Sensitive fields are only exposed to admin accounts.
            $this->mergeWhen($isAdmin, [
                'user_id' => $this->user_id,
                'email' => $this->whenLoaded('user', fn () => $this->user?->email),
                'nomor_telepon' => $this->nomor_telepon,
                'alamat' => $this->alamat,
                'riwayat_pendidikan' => $this->riwayat_pendidikan,
                'tunjangan_khusus' => (float) $this->tunjangan_khusus,
                'bank' => $this->bank,
                'nomor_rekening' => $this->nomor_rekening,
                'user' => new UserResource($this->whenLoaded('user')),
                'created_at' => $this->created_at?->toIso8601String(),
                'updated_at' => $this->updated_at?->toIso8601String(),
            ]),
        ];
    }
}
