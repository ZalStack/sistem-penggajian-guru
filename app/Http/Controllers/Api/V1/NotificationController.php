<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    /**
     * List my notifications (token required, paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->when($request->filled('status'), fn ($q, $s) => $q->where('dibaca', $s === 'read'))
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('dibaca', false)
            ->count();

        $collection = NotificationResource::collection($notifications);

        return $this->paginatedResponse($collection, 'Request completed successfully.', [
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Show a notification and mark it as read (token required, own data).
     */
    public function show(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403, 'This notification does not belong to you.');
        }

        if (! $notification->dibaca) {
            $notification->markAsRead();
        }

        return $this->successResponse(new NotificationResource($notification->refresh()));
    }

    /**
     * Unread notifications count (token required).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('dibaca', false)
            ->count();

        return $this->successResponse(['count' => $count]);
    }

    /**
     * Mark all notifications as read (token required).
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $updated = Notification::where('user_id', $request->user()->id)
            ->where('dibaca', false)
            ->update(['dibaca' => true, 'dibaca_pada' => now()]);

        return $this->successResponse([
            'updated' => $updated,
        ], 'All notifications marked as read.');
    }
}
