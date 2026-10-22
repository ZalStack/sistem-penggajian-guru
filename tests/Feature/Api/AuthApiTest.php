<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@siguru.com',
            'password' => 'secret-password',
        ]);
        $user->forceFill(['role' => 'admin'])->save();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@siguru.com',
            'password' => 'secret-password',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.email', 'admin@siguru.com')
            ->assertJsonStructure(['data' => ['token', 'token_type', 'user']]);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'admin@siguru.com',
            'password' => 'secret-password',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@siguru.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_me_requires_a_token(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_me_returns_the_authenticated_user(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role', 'admin');
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create(['role' => 'guru']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // The auth guard caches the resolved user between requests within a
        // single test run, so flush it before asserting the revoked token.
        app('auth')->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_profile_can_be_updated_with_correct_current_password(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'password' => 'current-password',
            'role' => 'admin',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/profile', [
            'name' => 'New Name',
            'email' => $user->email,
            'current_password' => 'current-password',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');
    }

    public function test_profile_update_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'current-password',
            'role' => 'admin',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/profile', [
            'name' => 'New Name',
            'email' => $user->email,
            'current_password' => 'wrong-password',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
