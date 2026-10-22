<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tanggal' => $this->tanggal->toDateString(),
            'status' => $this->status,
            'checkin_time' => $this->checkin_time?->toIso8601String(),
            'checkin_lat' => $this->checkin_lat !== null ? (float) $this->checkin_lat : null,
            'checkin_lng' => $this->checkin_lng !== null ? (float) $this->checkin_lng : null,
            'checkin_accuracy' => $this->checkin_accuracy !== null ? (float) $this->checkin_accuracy : null,
            'checkout_time' => $this->checkout_time?->toIso8601String(),
            'checkout_lat' => $this->checkout_lat !== null ? (float) $this->checkout_lat : null,
            'checkout_lng' => $this->checkout_lng !== null ? (float) $this->checkout_lng : null,
            'checkout_accuracy' => $this->checkout_accuracy !== null ? (float) $this->checkout_accuracy : null,
            'durasi' => (int) $this->durasi,
            'guru' => new TeacherResource($this->whenLoaded('guru')),
            'session' => new TeachingSessionResource($this->whenLoaded('session')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
