<?php

namespace Tests\Feature\Api;

use App\Models\Grade;
use App\Models\Guru;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GradeApiTest extends TestCase
{
    use RefreshDatabase;

    private function createGrade(array $overrides = []): Grade
    {
        return Grade::create(array_merge([
            'kode_grade' => 'A',
            'honor_per_sesi' => 60000,
        ], $overrides));
    }

    public function test_grades_can_be_listed_without_a_token(): void
    {
        $this->createGrade();

        $this->getJson('/api/v1/grades')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.kode_grade', 'A')
            ->assertJsonPath('data.0.honor_per_sesi', 60000);
    }

    public function test_grade_can_be_shown_without_a_token(): void
    {
        $grade = $this->createGrade();

        $this->getJson("/api/v1/grades/{$grade->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $grade->id);
    }

    public function test_creating_a_grade_requires_authentication(): void
    {
        $this->postJson('/api/v1/grades', [
            'kode_grade' => 'B',
            'honor_per_sesi' => 70000,
        ])->assertUnauthorized();

        $this->assertDatabaseCount('grades', 0);
    }

    public function test_creating_a_grade_is_forbidden_for_teachers(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'guru']));

        $this->postJson('/api/v1/grades', [
            'kode_grade' => 'B',
            'honor_per_sesi' => 70000,
        ])->assertForbidden();

        $this->assertDatabaseCount('grades', 0);
    }

    public function test_admin_can_create_update_and_delete_a_grade(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        // Create
        $response = $this->postJson('/api/v1/grades', [
            'kode_grade' => 'B',
            'honor_per_sesi' => 70000,
        ]);
        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kode_grade', 'B');

        $grade = Grade::first();

        // Update
        $this->putJson("/api/v1/grades/{$grade->id}", [
            'kode_grade' => 'B2',
            'honor_per_sesi' => 75000,
        ])
            ->assertOk()
            ->assertJsonPath('data.kode_grade', 'B2');

        // Delete
        $this->deleteJson("/api/v1/grades/{$grade->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('grades', 0);
    }

    public function test_grade_creation_validates_input(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/v1/grades', [
            'kode_grade' => '',
            'honor_per_sesi' => -5,
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['kode_grade', 'honor_per_sesi']]);
    }

    public function test_grade_unique_code_is_enforced(): void
    {
        $this->createGrade(['kode_grade' => 'A']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/v1/grades', [
            'kode_grade' => 'A',
            'honor_per_sesi' => 1000,
        ])->assertStatus(422);
    }

    public function test_grade_in_use_cannot_be_deleted(): void
    {
        $grade = $this->createGrade();
        Guru::create([
            'nama' => 'Budi',
            'grade_id' => $grade->id,
            'mapel' => 'IPA',
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->deleteJson("/api/v1/grades/{$grade->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('grades', 1);
    }
}
