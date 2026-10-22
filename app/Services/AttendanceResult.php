<?php

namespace App\Services;

/**
 * Outcome of an attendance check-in / check-out attempt.
 *
 * The service returns machine-readable codes plus context so each transport
 * (web flash messages, API JSON) can render its own localized message.
 */
final readonly class AttendanceResult
{
    /**
     * @param  array<string, mixed>  $context
     */
    private function __construct(
        public bool $ok,
        public string $code,
        public array $context,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     */
    public static function success(string $code, array $context = []): self
    {
        return new self(true, $code, $context);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function failure(string $code, array $context = []): self
    {
        return new self(false, $code, $context);
    }
}
