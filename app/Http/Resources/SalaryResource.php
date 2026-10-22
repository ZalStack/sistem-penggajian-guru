<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'periode' => $this->periode,
            'jumlah_sesi' => (int) $this->jumlah_sesi,
            'jumlah_hadir' => (int) $this->jumlah_hadir,
            'total_jam' => (float) $this->total_jam,
            'honor' => (float) $this->honor,
            'total_transport' => (float) $this->total_transport,
            'total' => (float) $this->total,
            'status_bayar' => $this->status_bayar,
            'guru' => new TeacherResource($this->whenLoaded('guru')),
            'transport' => new TransportResource($this->whenLoaded('transport')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
