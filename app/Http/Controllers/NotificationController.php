<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('dibaca', false)
            ->count();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }

    public function show(Notification $notification)
    {
        $user = request()->user();

        if ($notification->user_id !== $user->id) {
            abort(403);
        }

        if (! $notification->dibaca) {
            $notification->markAsRead();
        }

        return Inertia::render('Notifications/Show', [
            'notification' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('dibaca', false)
            ->update(['dibaca' => true, 'dibaca_pada' => now()]);

        return back()->with('success', 'Semua notifikasi ditandai sudah dibaca.');
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $count = Notification::where('user_id', $user->id)
            ->where('dibaca', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
