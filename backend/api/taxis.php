<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/algorithm.php';
require_once __DIR__ . '/../middleware/helpers.php';

setCorsHeaders();
handlePreflight();

$method = $_SERVER['REQUEST_METHOD'];

// POST /api/taxis - Taxi registrieren / anmelden
// GET  /api/taxis - Alle aktiven Taxis auflisten
// PATCH /api/taxis/{id}/position - Standort aktualisieren
// PATCH /api/taxis/{id}/deactivate - Taxi abmelden

$pathParts = array_values(array_filter(
    explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))
));

// Letztes Segment pruefen ob Aktion oder ID
$action = null;
$taxiId = null;
if (count($pathParts) >= 3) {
    $segment = $pathParts[count($pathParts) - 1];
    if (in_array($segment, ['position', 'deactivate'], true)) {
        $action = $segment;
        $taxiId = (int) $pathParts[count($pathParts) - 2];
    } elseif (is_numeric($segment)) {
        $taxiId = (int) $segment;
    }
}

try {
    $pdo = db();

    if ($method === 'GET' && $taxiId === null) {
        // Alle aktiven Taxis
        $stmt = $pdo->query(
            "SELECT id, radio_id, position, capacity, occupied, last_seen
             FROM taxis WHERE active = 1 ORDER BY radio_id"
        );
        jsonResponse($stmt->fetchAll());
    }

    if ($method === 'POST' && $taxiId === null) {
        $body = requestBody();
        requireFields($body, ['radio_id', 'position']);

        $radioId  = trim((string)$body['radio_id']);
        $position = strtoupper(trim((string)$body['position']));

        if (!in_array($position, validZones(), true)) {
            errorResponse('Ungueltige Position. Erlaubt: ' . implode(', ', validZones()));
        }

        // Bereits vorhandenes Taxi reaktivieren oder neu anlegen
        $stmt = $pdo->prepare(
            "INSERT INTO taxis (radio_id, position, active)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE position = VALUES(position), active = 1, last_seen = NOW()"
        );
        $stmt->execute([$radioId, $position]);

        $id = $pdo->lastInsertId() ?: $pdo->query(
            "SELECT id FROM taxis WHERE radio_id = " . $pdo->quote($radioId)
        )->fetchColumn();

        $taxi = $pdo->query("SELECT id, radio_id, position, capacity, occupied FROM taxis WHERE id = {$id}")->fetch();
        jsonResponse($taxi, 201);
    }

    if ($method === 'PATCH' && $taxiId && $action === 'position') {
        $body     = requestBody();
        $position = strtoupper(trim((string)($body['position'] ?? '')));
        if (!in_array($position, validZones(), true)) {
            errorResponse('Ungueltige Position.');
        }
        $stmt = $pdo->prepare("UPDATE taxis SET position = ? WHERE id = ? AND active = 1");
        $stmt->execute([$position, $taxiId]);
        if ($stmt->rowCount() === 0) {
            errorResponse('Taxi nicht gefunden.', 404);
        }
        jsonResponse(['ok' => true, 'position' => $position]);
    }

    if ($method === 'PATCH' && $taxiId && $action === 'deactivate') {
        $stmt = $pdo->prepare("UPDATE taxis SET active = 0 WHERE id = ?");
        $stmt->execute([$taxiId]);
        jsonResponse(['ok' => true]);
    }

    errorResponse('Endpunkt nicht gefunden.', 404);
} catch (InvalidArgumentException $e) {
    errorResponse($e->getMessage(), 422);
} catch (PDOException $e) {
    errorResponse('Datenbankfehler.', 500);
}
