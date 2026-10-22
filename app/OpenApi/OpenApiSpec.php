<?php

namespace App\OpenApi;

use App\OpenApi\Specs\AuthSpec;
use App\OpenApi\Specs\ContentSpec;
use App\OpenApi\Specs\MasterDataSpec;
use App\OpenApi\Specs\OperationsSpec;
use App\OpenApi\Specs\PayrollSpec;

/**
 * Builds the OpenAPI 3.1 document served at /api/openapi.json.
 */
class OpenApiSpec
{
    public static function build(): array
    {
        return [
            'openapi' => '3.1.0',
            'info' => [
                'title' => 'Sistem Penggajian Guru — REST API',
                'version' => '1.0.0',
                'summary' => 'Teacher payroll & teaching management API for the Sistem Penggajian Guru application.',
                'description' => str_replace('{BASE_URL}', self::baseUrl(), self::description()),
                'contact' => [
                    'name' => 'Sistem Penggajian Guru',
                    'url' => 'http://localhost:8000',
                ],
                'license' => [
                    'name' => 'Proprietary',
                ],
            ],
            'servers' => [
                [
                    'url' => rtrim(config('app.url'), '/').'/api/v1',
                    'description' => 'Local development server (all endpoints are prefixed with /api/v1)',
                ],
            ],
            'security' => [['bearerAuth' => []]],
            'tags' => self::tags(),
            'paths' => self::paths(),
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'description' => 'Sanctum personal access token. Obtain one via `POST /auth/login`, then send it on every request as `Authorization: Bearer {token}`.',
                    ],
                ],
                'parameters' => Components::parameters(),
                'responses' => Components::responses(),
                'schemas' => Schemas::all(),
            ],
        ];
    }

    /**
     * @return array<string, array>
     */
    private static function paths(): array
    {
        return array_merge(
            (new AuthSpec)->paths(),
            (new MasterDataSpec)->paths(),
            (new OperationsSpec)->paths(),
            (new PayrollSpec)->paths(),
            (new ContentSpec)->paths(),
        );
    }

    private static function baseUrl(): string
    {
        return rtrim(config('app.url'), '/').'/api/v1';
    }

    /**
     * @return array<int, array>
     */
    private static function tags(): array
    {
        return [
            ['name' => 'Authentication', 'description' => 'Login, logout, and the current user.'],
            ['name' => 'Dashboard', 'description' => 'Role-aware dashboard statistics.'],
            ['name' => 'Profile', 'description' => 'Manage the authenticated account.'],
            ['name' => 'Grades', 'description' => 'Salary grades (honor per teaching session).'],
            ['name' => 'Transports', 'description' => 'Transport fee types.'],
            ['name' => 'Locations', 'description' => 'GPS check-in locations and their allowed radius.'],
            ['name' => 'Teachers', 'description' => 'Teacher (guru) records and their login accounts.'],
            ['name' => 'Teaching Sessions', 'description' => 'Teaching schedule per teacher.'],
            ['name' => 'Teaching Materials', 'description' => 'Upload and download teaching material files.'],
            ['name' => 'Attendance', 'description' => 'GPS check-in / check-out and attendance recap.'],
            ['name' => 'Leave Requests', 'description' => 'Teacher leave requests (izin / sakit / cuti) and approvals.'],
            ['name' => 'Schedules', 'description' => 'Monthly schedule grouped by day.'],
            ['name' => 'Salaries', 'description' => 'Salary calculation, payment status, and payslips.'],
            ['name' => 'Payroll', 'description' => 'Manual payroll record management.'],
            ['name' => 'Reports', 'description' => 'Payroll reports with PDF / Excel export.'],
            ['name' => 'Notifications', 'description' => 'In-app notifications for the current user.'],
        ];
    }

    private static function description(): string
    {
        return <<<'MARKDOWN'
        # Sistem Penggajian Guru — REST API

        A versioned JSON REST API for the teacher payroll & teaching management application.
        Every endpoint lives under the base URL:

        ```
        {BASE_URL}
        ```

        ---

        ## Quick start

        **1. Authenticate** (only needed for protected endpoints):

        ```bash
        curl -X POST {BASE_URL}/auth/login \
          -H "Accept: application/json" \
          -H "Content-Type: application/json" \
          -d '{"email": "admin@siguru.com", "password": "your-password"}'
        ```

        The response contains a token:

        ```json
        {
          "success": true,
          "message": "Authenticated successfully.",
          "data": {
            "token": "1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz",
            "token_type": "Bearer",
            "user": { "id": 1, "name": "Admin", "email": "admin@siguru.com", "role": "admin" }
          }
        }
        ```

        **2. Call any protected endpoint:**

        ```bash
        curl {BASE_URL}/dashboard \
          -H "Accept: application/json" \
          -H "Authorization: Bearer 1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz"
        ```

        **3. Revoke the token** when you are done:

        ```bash
        curl -X POST {BASE_URL}/auth/logout \
          -H "Authorization: Bearer 1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz"
        ```

        ---

        ## Authentication rules

        | HTTP method | Authentication |
        | ----------- | -------------- |
        | `GET` | **Public** for catalogue data (grades, transports, locations, teachers, teaching sessions, teaching material metadata). A token is **required** for endpoints that depend on the caller's identity (dashboard, schedules, profile, notifications, `mine` endpoints) or that expose sensitive data (attendance recap, salaries, payroll, reports, exports). Protected GET operations are marked **"auth: bearer"** in this documentation. |
        | `POST`, `PUT`, `PATCH`, `DELETE` | **Always require** a bearer token, plus the `admin` or `guru` role as documented per endpoint. |

        Tokens are Sanctum personal access tokens and do not expire by default. Keep them secret and revoke them via `POST /auth/logout`.

        ---

        ## Response envelope

        Every JSON response uses the same envelope:

        ```json
        {
          "success": true,
          "message": "Request completed successfully.",
          "data": { }
        }
        ```

        Paginated collections add a `meta` object:

        ```json
        {
          "success": true,
          "message": "Request completed successfully.",
          "data": [ ],
          "meta": { "current_page": 1, "per_page": 15, "total": 42, "last_page": 3 }
        }
        ```

        Errors always use `success: false`:

        ```json
        {
          "success": false,
          "message": "The given data was invalid.",
          "errors": { "email": ["The provided credentials are incorrect."] }
        }
        ```

        ---

        ## Pagination

        Paginated endpoints accept `page` and `per_page` query parameters (default `per_page` is 15, maximum 100).

        ---

        ## HTTP status codes

        | Code | Meaning |
        | ---- | ------- |
        | `200` | OK — success (including updates and deletes). |
        | `201` | Created — a new resource was created. |
        | `401` | Unauthenticated — missing, invalid, or revoked token. |
        | `403` | Forbidden — valid token but insufficient role, or ownership violation. |
        | `404` | Not Found — the resource does not exist. |
        | `409` | Conflict — the request conflicts with the current state (e.g. deleting data that is still in use). |
        | `422` | Validation error — see the `errors` object. |
        | `429` | Too many requests — slow down and retry later. |

        ---

        ## Rate limits

        - General API: **60 requests per minute** per user (or per IP for guests).
        - `POST /auth/login`: **5 attempts per minute** per email + IP.
        - `POST /attendances/check-in` and `POST /attendances/check-out`: **10 requests per minute**.
        - `POST /salaries/calculate`: **1 request per minute**.

        ---

        ## Conventions

        - All timestamps are ISO 8601 (`2026-10-22T08:00:00+07:00`), dates use `YYYY-MM`, and times use 24h `HH:mm`.
        - Money values are plain numbers in IDR (e.g. `60000` = Rp 60.000).
        - Send `Accept: application/json` on every request to receive JSON errors.
        MARKDOWN;
    }
}
