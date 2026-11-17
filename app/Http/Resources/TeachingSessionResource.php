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
            'program' => $this->program?->nama ?? 'Kelas Khusus',
            'program_slug' => $this->program?->slug ?? 'kelas-khusus',
            'kelas' => $this->kelas,
            'level' => $this->level,
            'tanggal' => $this->tanggal->toDateString(),
            'pekan' => (int) $this->pekan,
            'bahan_ajar' => $this->bahan_ajar,
            'jam_mulai' => $this->jam_mulai->format('H:i'),
            'jam_selesai' => $this->jam_selesai->format('H:i'),
            'session_time' => $this->session_time ?: ($this->jam_mulai->format('H:i').' - '.$this->jam_selesai->format('H:i')),
            'jumlah_sesi' => (int) $this->jumlah_sesi,
            'status' => $this->effective_status,
            'guru' => new TeacherResource($this->whenLoaded('guru')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'transport' => new TransportResource($this->whenLoaded('transport')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
