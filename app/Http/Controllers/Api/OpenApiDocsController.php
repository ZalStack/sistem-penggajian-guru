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
     */
    public function show(): View
    {
        return view('api-docs', [
            'specUrl' => route('api.spec'),
            'apiVersion' => 'v1',
            'appUrl' => config('app.url'),
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
}
