<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\OpenApi\OpenApiSpec;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class OpenApiDocsController extends Controller
{
    /**
     * Render the interactive API documentation page (HTML).
     *
     * The page loads a self-hosted Scalar bundle (with a CDN fallback) and
     * always ships a complete server-rendered static reference that is shown
     * whenever the interactive bundle cannot be loaded.
     */
    public function show(): View
    {
        $spec = OpenApiSpec::build();
        $groups = $this->groupOperations($spec);

        return view('api-docs', [
            'specUrl' => route('api.spec'),
            'apiVersion' => 'v1',
            'appUrl' => rtrim(config('app.url'), '/'),
            'baseUrl' => rtrim(config('app.url'), '/').'/api/v1',
            'groups' => $groups,
            'stats' => [
                'endpoints' => array_sum(array_map(fn (array $group) => count($group['operations']), $groups)),
                'schemas' => count($spec['components']['schemas'] ?? []),
                'version' => $spec['info']['version'],
            ],
            'localBundleUrl' => asset('vendor/scalar/standalone.js'),
            'cdnBundleUrl' => 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.75.1/dist/browser/standalone.js',
        ]);
    }

    /**
     * Serve the OpenAPI 3.1 document (JSON).
     */
    public function spec(): JsonResponse
    {
        return response()
            ->json(OpenApiSpec::build())
            ->setEncodingOptions(JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    /**
     * Group every path operation by its first tag, ready for rendering.
     *
     * @return array<string, array{description: string, operations: array<int, array>}>
     */
    private function groupOperations(array $spec): array
    {
        $componentParameters = $spec['components']['parameters'] ?? [];
        $componentSchemas = $spec['components']['schemas'] ?? [];
        $componentResponses = $spec['components']['responses'] ?? [];

        $priority = ['GET' => 0, 'POST' => 1, 'PUT' => 2, 'PATCH' => 3, 'DELETE' => 4];
        $grouped = [];

        foreach ($spec['paths'] as $path => $operations) {
            foreach ($operations as $method => $operation) {
                if (! is_array($operation)) {
                    continue;
                }

                $method = strtoupper($method);
                $tag = $operation['tags'][0] ?? 'Other';

                $grouped[$tag][] = [
                    'method' => $method,
                    'path' => $path,
                    'summary' => $operation['summary'] ?? '',
                    'description' => $operation['description'] ?? '',
                    'isPublic' => ($operation['security'] ?? null) === [],
                    'parameters' => $this->resolveParameters($operation['parameters'] ?? [], $componentParameters),
                    'requestExample' => $this->bodyExample($operation['requestBody'] ?? null, $componentSchemas),
                    'responseExample' => $this->successExample($operation['responses'] ?? [], $componentSchemas),
                    'responses' => $this->responseRows($operation['responses'] ?? [], $componentResponses),
                ];
            }
        }

        foreach ($grouped as &$operations) {
            usort($operations, fn (array $a, array $b) => ($priority[$a['method']] ?? 9) <=> ($priority[$b['method']] ?? 9)
                ?: strcmp($a['path'], $b['path']));
        }
        unset($operations);

        // Keep the documented tag order from the spec, then append any extra tags.
        $ordered = [];

        foreach ($spec['tags'] ?? [] as $tag) {
            if (isset($grouped[$tag['name']])) {
                $ordered[$tag['name']] = [
                    'description' => $tag['description'] ?? '',
                    'operations' => $grouped[$tag['name']],
                ];
                unset($grouped[$tag['name']]);
            }
        }

        foreach ($grouped as $name => $group) {
            $ordered[$name] = ['description' => '', 'operations' => $group];
        }

        return $ordered;
    }

    /**
     * Resolve local parameter definitions and $ref pointers.
     */
    private function resolveParameters(array $parameters, array $components): array
    {
        return array_values(array_map(function (array $parameter) use ($components) {
            if (isset($parameter['$ref'])) {
                $name = substr($parameter['$ref'], strrpos($parameter['$ref'], '/') + 1);

                return $components[$name] ?? $parameter;
            }

            return $parameter;
        }, array_filter($parameters, 'is_array')));
    }

    /**
     * Build a JSON example for the request body, if the operation has one.
     */
    private function bodyExample(?array $requestBody, array $schemas): ?string
    {
        $schema = $requestBody['content']['application/json']['schema'] ?? null;

        if (! is_array($schema)) {
            return null;
        }

        return $this->encodeExample($this->exampleFromSchema($schema, $schemas));
    }

    /**
     * Build a JSON example for the first successful (2xx) response.
     */
    private function successExample(array $responses, array $schemas): ?string
    {
        foreach (['200', '201'] as $status) {
            $response = $responses[$status] ?? null;

            if (! is_array($response)) {
                continue;
            }

            $json = $response['content']['application/json'] ?? null;

            if (! is_array($json)) {
                continue;
            }

            if (array_key_exists('example', $json)) {
                return $this->encodeExample($json['example']);
            }

            if (isset($json['schema'])) {
                return $this->encodeExample($this->exampleFromSchema($json['schema'], $schemas));
            }
        }

        return null;
    }

    /**
     * Flatten the response map into status / description rows (resolving $refs).
     */
    private function responseRows(array $responses, array $components): array
    {
        $rows = [];

        foreach ($responses as $status => $response) {
            $description = is_array($response) ? ($response['description'] ?? '') : '';

            if (is_array($response) && isset($response['$ref'])) {
                $name = substr($response['$ref'], strrpos($response['$ref'], '/') + 1);
                $description = $components[$name]['description'] ?? $description;
            }

            $rows[] = [
                'status' => (string) $status,
                'description' => $description,
                'isSuccess' => str_starts_with((string) $status, '2'),
            ];
        }

        return $rows;
    }

    /**
     * Recursively generate a representative example from a JSON schema.
     */
    private function exampleFromSchema(array $schema, array $schemas, int $depth = 0): mixed
    {
        if ($depth > 6) {
            return null;
        }

        if (isset($schema['$ref'])) {
            $name = substr($schema['$ref'], strrpos($schema['$ref'], '/') + 1);
            $schema = $schemas[$name] ?? [];
        }

        if (array_key_exists('example', $schema)) {
            return $schema['example'];
        }

        if (! empty($schema['nullable'])) {
            return null;
        }

        if (! empty($schema['enum'])) {
            return $schema['enum'][0];
        }

        if (($schema['type'] ?? null) === 'array') {
            return [$this->exampleFromSchema($schema['items'] ?? [], $schemas, $depth + 1)];
        }

        if (isset($schema['properties'])) {
            $required = $schema['required'] ?? array_keys($schema['properties']);
            $example = [];

            foreach ($schema['properties'] as $key => $property) {
                if (! in_array($key, $required, true)) {
                    continue;
                }

                $example[$key] = $this->exampleFromSchema(is_array($property) ? $property : [], $schemas, $depth + 1);
            }

            return $example;
        }

        return match ($schema['type'] ?? null) {
            'string' => match ($schema['format'] ?? null) {
                'date-time' => '2026-01-15T08:00:00+07:00',
                'date' => '2026-01-15',
                default => 'string',
            },
            'integer' => 1,
            'number' => 0,
            'boolean' => true,
            default => null,
        };
    }

    private function encodeExample(mixed $value): string
    {
        return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: 'null';
    }
}
