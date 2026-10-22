<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Base controller for the versioned JSON API.
 *
 * Every response uses a consistent envelope:
 *   { "success": bool, "message": string, "data": mixed, "meta"?: object }
 */
abstract class ApiController extends Controller
{
    protected function successResponse(mixed $data, string $message = 'Request completed successfully.', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function createdResponse(mixed $data, string $message = 'Resource created successfully.'): JsonResponse
    {
        return $this->successResponse($data, $message, 201);
    }

    protected function deletedResponse(string $message = 'Resource deleted successfully.'): JsonResponse
    {
        return $this->successResponse(null, $message);
    }

    protected function errorResponse(string $message, int $status = 400, array|string|null $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    protected function paginatedResponse(ResourceCollection $collection, string $message = 'Request completed successfully.', array $meta = []): JsonResponse
    {
        /** @var LengthAwarePaginator $paginator */
        $paginator = $collection->resource;

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $collection->resolve(),
            'meta' => array_merge([
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ], $meta),
        ]);
    }
}
