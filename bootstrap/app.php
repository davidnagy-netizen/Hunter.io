<?php

/**
 * Modern Laravel Application Bootstrap Configuration.
 *
 * This file configures the foundational routing paths, global/group middleware,
 * health check endpoints, and exception handling for the application.
 */

use App\Http\Middleware\SetLocale;
use App\Services\Api\ApiError;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [SetLocale::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport([ApiError::class]);
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            if ($e instanceof ApiError) {
                return response()->json(['error' => $e->getMessage(), 'code' => $e->errorCode], $e->status);
            }
            if ($e instanceof ValidationException) {
                return response()->json(['error' => 'Érvénytelen adatok.', 'code' => 'INVALID_REQUEST', 'fields' => $e->errors()], 400);
            }
            if ($e instanceof UniqueConstraintViolationException) {
                return response()->json(['error' => 'Az adat már létezik.', 'code' => 'INVALID_REQUEST'], 409);
            }
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;

            return response()->json(['error' => 'A kérés nem teljesíthető.', 'code' => $status >= 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST'], $status);
        });
    })->create();
