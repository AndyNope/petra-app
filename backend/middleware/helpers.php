<?php
declare(strict_types=1);

/**
 * Gemeinsame Hilfsfunktionen: CORS, JSON-Response, Input-Validierung.
 */

function setCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 3600');
}

function handlePreflight(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function errorResponse(string $message, int $status = 400): never
{
    jsonResponse(['error' => $message], $status);
}

function requestBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

function requireFields(array $body, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($body[$field]) || $body[$field] === '') {
            errorResponse("Pflichtfeld fehlt: {$field}", 422);
        }
    }
}
