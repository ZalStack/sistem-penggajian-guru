<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeachingSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mapel' => $this->mapel,
            'tanggal' => $this->tanggal->toDateString(),
            'jam_mulai' => $this->jam_mulai->format('H:i'),
            'jam_selesai' => $this->jam_selesai->format('H:i'),
            'jumlah_sesi' => (int) $this->jumlah_sesi,
            'guru' => new TeacherResource($this->whenLoaded('guru')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'transport' => new TransportResource($this->whenLoaded('transport')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
