<?php
declare(strict_types=1);

require_once __DIR__ . '/middleware/helpers.php';

setCorsHeaders();
handlePreflight();

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$parts  = explode('/', ltrim($uri, '/'));

// Routing: /api/{resource}/...
$apiIndex = array_search('api', $parts, true);
$resource = $parts[$apiIndex + 1] ?? '';

match($resource) {
    'taxis'    => require __DIR__ . '/api/taxis.php',
    'trips'    => require __DIR__ . '/api/trips.php',
    'dispatch' => require __DIR__ . '/api/dispatch.php',
    default    => errorResponse('Unbekannter Endpunkt.', 404),
};
