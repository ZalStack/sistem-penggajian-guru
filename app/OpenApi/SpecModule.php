<?php

namespace App\OpenApi;

/**
 * Base helper for building OpenAPI path operations with consistent
 * envelopes, security markers, and error responses.
 */
abstract class SpecModule
{
    abstract public function paths(): array;

    /**
     * Mark the operation as public (no bearer token required).
     */
    protected function public(): array
    {
        return ['security' => []];
    }

    /**
     * Mark the operation as requiring a Sanctum bearer token.
     */
    protected function secured(): array
    {
        return ['security' => [['bearerAuth' => []]]];
    }

    /**
     * JSON response for a single-resource envelope: { success, message, data }.
     */
    protected function objectResponse(string $description, array $schema, string $exampleMessage = 'Request completed successfully.'): array
    {
        return [
            'description' => $description,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['success', 'message', 'data'],
                        'properties' => [
                            'success' => ['type' => 'boolean', 'example' => true],
                            'message' => ['type' => 'string', 'example' => $exampleMessage],
                            'data' => $schema,
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * JSON response for a list envelope including pagination meta.
     */
    protected function listResponse(string $description, array $itemSchema): array
    {
        return [
            'description' => $description,
            'content' => [
                'application/json' => [
                    'schema' => [
                        'type' => 'object',
                        'required' => ['success', 'message', 'data', 'meta'],
                        'properties' => [
                            'success' => ['type' => 'boolean', 'example' => true],
                            'message' => ['type' => 'string', 'example' => 'Request completed successfully.'],
                            'data' => [
                                'type' => 'array',
                                'items' => $itemSchema,
                            ],
                            'meta' => ['$ref' => '#/components/schemas/PaginationMeta'],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Standard error responses for an operation.
     *
     * @param  array<string, string>  $map  HTTP status => component response name
     */
    protected function errors(array $map): array
    {
        $responses = [];

        foreach ($map as $status => $component) {
            $responses[$status] = ['$ref' => '#/components/responses/'.$component];
        }

        return $responses;
    }

    /**
     * Merge standard error responses into a response map.
     *
     * @param  array<string, array>  $responses
     * @param  array<string, string>  $errors
     * @return array<string, array>
     */
    protected function withErrors(array $responses, array $errors): array
    {
        return array_merge($responses, $this->errors($errors));
    }

    protected function ref(string $schema): array
    {
        return ['$ref' => '#/components/schemas/'.$schema];
    }

    protected function refParam(string $name): array
    {
        return ['$ref' => '#/components/parameters/'.$name];
    }

    protected function jsonBody(array $schema): array
    {
        return [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => $schema,
                ],
            ],
        ];
    }

    protected function integerParam(string $name, string $description, int $default = 1): array
    {
        return [
            'name' => $name,
            'in' => 'query',
            'description' => $description,
            'required' => false,
            'schema' => ['type' => 'integer', 'minimum' => 1, 'default' => $default],
        ];
    }

    protected function stringParam(string $name, string $description, ?string $example = null): array
    {
        $schema = ['type' => 'string'];

        if ($example !== null) {
            $schema['example'] = $example;
        }

        return [
            'name' => $name,
            'in' => 'query',
            'description' => $description,
            'required' => false,
            'schema' => $schema,
        ];
    }

    protected function enumParam(string $name, string $description, array $options): array
    {
        return [
            'name' => $name,
            'in' => 'query',
            'description' => $description,
            'required' => false,
            'schema' => ['type' => 'string', 'enum' => $options],
        ];
    }

    protected function idParam(string $name, string $description): array
    {
        return [
            'name' => $name,
            'in' => 'path',
            'description' => $description,
            'required' => true,
            'schema' => ['type' => 'integer', 'example' => 1],
        ];
    }
}
