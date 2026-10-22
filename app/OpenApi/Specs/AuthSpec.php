<?php

namespace App\OpenApi\Specs;

use App\OpenApi\SpecModule;

class AuthSpec extends SpecModule
{
    public function paths(): array
    {
        return [
            '/auth/login' => [
                'post' => array_merge($this->public(), [
                    'tags' => ['Authentication'],
                    'summary' => 'Authenticate and obtain an API token',
                    'description' => 'Validates the credentials and issues a Sanctum personal access token. Send the token in the `Authorization: Bearer {token}` header on every protected request. The endpoint is rate limited to 5 attempts per email + IP per minute.',
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'required' => ['email', 'password'],
                                    'properties' => [
                                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'admin@siguru.com'],
                                        'password' => ['type' => 'string', 'format' => 'password', 'example' => 'password'],
                                        'device_name' => ['type' => 'string', 'maxLength' => 255, 'description' => 'Optional label for the token (e.g. device or app name).', 'example' => 'iPhone 15'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Authentication succeeded. Store the `token` value securely.', $this->ref('LoginResponse'), 'Authenticated successfully.'),
                    ], [
                        '422' => 'Unprocessable',
                        '429' => 'TooManyRequests',
                    ]),
                ]),
            ],
            '/auth/logout' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Authentication'],
                    'summary' => 'Revoke the current token',
                    'description' => 'Deletes the personal access token used for this request. The token is invalid immediately after this call.',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Token revoked.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Logged out successfully. Token revoked.'),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
            '/auth/me' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Authentication'],
                    'summary' => 'Get the authenticated user',
                    'description' => 'Returns the account behind the current token together with its linked teacher profile (`guru` is null for admin accounts).',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The current user.', $this->ref('MeResponse')),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
            '/dashboard' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Dashboard'],
                    'summary' => 'Get dashboard statistics',
                    'description' => 'Role-aware dashboard. Admins receive school-wide statistics plus the latest sessions and payroll; teachers receive their own monthly stats, upcoming sessions, and today\'s attendance.',
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'Dashboard payload for the current role.',
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'success' => ['type' => 'boolean', 'example' => true],
                                            'message' => ['type' => 'string', 'example' => 'Request completed successfully.'],
                                            'data' => [
                                                'oneOf' => [
                                                    ['$ref' => '#/components/schemas/DashboardAdmin'],
                                                    ['$ref' => '#/components/schemas/DashboardGuru'],
                                                ],
                                                'description' => 'Admin accounts receive DashboardAdmin; teacher accounts receive DashboardGuru.',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
            '/profile' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Profile'],
                    'summary' => 'Get my profile',
                    'description' => 'Same data as `GET /auth/me`.',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The current user profile.', $this->ref('MeResponse')),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Profile'],
                    'summary' => 'Update my profile',
                    'description' => 'Updates the authenticated user\'s name, email, and optionally the password. The current password is always required. When the account is linked to a teacher profile, the teacher\'s name is kept in sync.',
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'required' => ['name', 'email', 'current_password'],
                                    'properties' => [
                                        'name' => ['type' => 'string', 'example' => 'Admin Siguru'],
                                        'email' => ['type' => 'string', 'format' => 'email', 'example' => 'admin@siguru.com'],
                                        'current_password' => ['type' => 'string', 'format' => 'password', 'description' => 'Required to confirm the change.'],
                                        'password' => ['type' => 'string', 'format' => 'password', 'minLength' => 8, 'nullable' => true, 'description' => 'New password. Must match `password_confirmation` when provided.'],
                                        'password_confirmation' => ['type' => 'string', 'format' => 'password', 'nullable' => true],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Profile updated.', $this->ref('User'), 'Profile updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Profile'],
                    'summary' => 'Delete my account',
                    'description' => 'Permanently deletes the authenticated user and revokes all of its tokens. This action cannot be undone.',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Account deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Account deleted successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
        ];
    }
}
