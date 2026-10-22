<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\TeacherResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends ApiController
{
    /**
     * Show my profile (token required).
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('guru.grade');

        return $this->successResponse([
            'user' => new UserResource($user),
            'guru' => $user->guru ? new TeacherResource($user->guru) : null,
        ]);
    }

    /**
     * Update my profile (token required).
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => 'required|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('The current password is incorrect.', 422, [
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            ...(($validated['password'] ?? null) ? ['password' => Hash::make($validated['password'])] : []),
        ]);

        if ($user->guru && $user->guru->nama !== $validated['name']) {
            $user->guru->update(['nama' => $validated['name']]);
        }

        return $this->successResponse(
            new UserResource($user->refresh()->load('guru.grade')),
            'Profile updated successfully.'
        );
    }

    /**
     * Delete my account (token required).
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->tokens()->delete();
        $user->delete();

        return $this->deletedResponse('Account deleted successfully.');
    }
}
