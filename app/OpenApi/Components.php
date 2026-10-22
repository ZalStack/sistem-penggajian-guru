<?php

namespace App\OpenApi;

/**
 * Shared OpenAPI components: reusable parameters and error responses.
 */
class Components
{
    /**
     * @return array<string, array>
     */
    public static function parameters(): array
    {
        return [
            'page' => [
                'name' => 'page',
                'in' => 'query',
                'description' => 'Page number for paginated collections.',
                'required' => false,
                'schema' => ['type' => 'integer', 'minimum' => 1, 'default' => 1],
                'example' => 1,
            ],
            'per_page' => [
                'name' => 'per_page',
                'in' => 'query',
                'description' => 'Number of items per page (1–100).',
                'required' => false,
                'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 15],
                'example' => 15,
            ],
        ];
    }

    /**
     * @return array<string, array>
     */
    public static function responses(): array
    {
        return [
            'Unauthorized' => self::errorResponse(
                401,
                'Unauthenticated',
                'Unauthenticated. Provide a valid API token via the Authorization header.',
                'Missing, malformed, expired, or revoked bearer token.'
            ),
            'Forbidden' => self::errorResponse(
                403,
                'Forbidden',
                'This action is unauthorized.',
                'The token is valid but the account role is not allowed to perform this action.'
            ),
            'NotFound' => self::errorResponse(
                404,
                'Not Found',
                'Resource not found.',
                'The requested resource does not exist or is not accessible.'
            ),
            'Unprocessable' => self::errorResponse(
                422,
                'Unprocessable Entity',
                'The given data was invalid.',
                'Validation failed. The `errors` object lists each invalid field.',
                [
                    'errors' => [
                        'type' => 'object',
                        'additionalProperties' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                        ],
                        'example' => ['email' => ['The provided credentials are incorrect.']],
                    ],
                ]
            ),
            'Conflict' => self::errorResponse(
                409,
                'Conflict',
                'The resource cannot be deleted because it is still in use.',
                'The request conflicts with the current state of the resource (e.g. deleting a grade that still has teachers).'
            ),
            'TooManyRequests' => self::errorResponse(
                429,
                'Too Many Requests',
                'Too many requests. Please slow down and try again later.',
                'Rate limit exceeded. Check the `Retry-After` response header.'
            ),
        ];
    }

    /**
     * @param  array<string, array>  $extraProperties
     */
    private static function errorResponse(int $status, string $title, string $exampleMessage, string $description, array $extraProperties = []): array
    {
        return [
            'description' => $description,
            'content' => [
                'application/json' => [
                    'schema' => ['$ref' => '#/components/schemas/Error'],
                    'example' => array_merge([
                        'success' => false,
                        'message' => $exampleMessage,
                    ], $extraProperties),
                ],
            ],
            'headers' => [
                'X-RateLimit-Limit' => [
                    'description' => 'Requests allowed per rate limit window.',
                    'schema' => ['type' => 'integer'],
                ],
                'X-RateLimit-Remaining' => [
                    'description' => 'Requests remaining in the current window.',
                    'schema' => ['type' => 'integer'],
                ],
            ] + ($status === 429 ? [
                'Retry-After' => [
                    'description' => 'Seconds to wait before retrying.',
                    'schema' => ['type' => 'integer'],
                ],
            ] : []),
        ];
    }
}
