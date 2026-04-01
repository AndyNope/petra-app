<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/algorithm.php';
require_once __DIR__ . '/../middleware/helpers.php';

setCorsHeaders();
handlePreflight();

$method = $_SERVER['REQUEST_METHOD'];

$pathParts = array_values(array_filter(
    explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))
));

$action = null;
$tripId = null;
if (count($pathParts) >= 3) {
    $last = $pathParts[count($pathParts) - 1];
    if (in_array($last, ['accept', 'complete', 'cancel'], true)) {
        $action = $last;
        $tripId = (int) $pathParts[count($pathParts) - 2];
    } elseif (is_numeric($last)) {
        $tripId = (int) $last;
    }
}

try {
    $pdo = db();

    // GET /api/trips - Offene Auftraege (optional ?taxi_id=X fuer Prio-Sortierung)
    if ($method === 'GET' && $tripId === null) {
        $statusFilter = $_GET['status'] ?? 'pending';
        $taxiId       = isset($_GET['taxi_id']) ? (int)$_GET['taxi_id'] : null;
        $tripIdFilter = isset($_GET['trip_id']) ? (int)$_GET['trip_id'] : null;

        if ($tripIdFilter) {
            $stmt = $pdo->prepare(
                "SELECT t.*, tx.radio_id AS taxi_radio_id
                 FROM trips t LEFT JOIN taxis tx ON tx.id = t.taxi_id
                 WHERE t.id = ?"
            );
            $stmt->execute([$tripIdFilter]);
            $trip = $stmt->fetch();
            jsonResponse($trip ?: []);
        }

        $allowedStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'all'];
        if (!in_array($statusFilter, $allowedStatuses, true)) {
            $statusFilter = 'pending';
        }

        if ($statusFilter === 'all') {
            $stmt = $pdo->query(
                "SELECT t.*, tx.radio_id AS taxi_radio_id, tx.position AS taxi_position
                 FROM trips t LEFT JOIN taxis tx ON tx.id = t.taxi_id
                 ORDER BY t.requested_at DESC LIMIT 200"
            );
        } else {
            $stmt = $pdo->prepare(
                "SELECT t.*, tx.radio_id AS taxi_radio_id, tx.position AS taxi_position
                 FROM trips t LEFT JOIN taxis tx ON tx.id = t.taxi_id
                 WHERE t.status = ?
                 ORDER BY t.requested_at ASC"
            );
            $stmt->execute([$statusFilter]);
        }
        $trips = $stmt->fetchAll();

        // Prio-Sortierung fuer Taxi-Ansicht
        if ($taxiId && $statusFilter === 'pending') {
            $taxiStmt = $pdo->prepare("SELECT position FROM taxis WHERE id = ? AND active = 1");
            $taxiStmt->execute([$taxiId]);
            $taxiPos = $taxiStmt->fetchColumn();
            if ($taxiPos) {
                $trips = sortTripsByPriority($taxiPos, $trips);
            }
        }

        jsonResponse($trips);
    }

    // GET /api/trips/{id} - Einzelnen Auftrag abrufen
    if ($method === 'GET' && $tripId && $action === null) {
        $stmt = $pdo->prepare(
            "SELECT t.*, tx.radio_id AS taxi_radio_id
             FROM trips t LEFT JOIN taxis tx ON tx.id = t.taxi_id
             WHERE t.id = ?"
        );
        $stmt->execute([$tripId]);
        $trip = $stmt->fetch();
        if (!$trip) {
            errorResponse('Auftrag nicht gefunden.', 404);
        }
        jsonResponse($trip);
    }

    // POST /api/trips - Neuen Auftrag erstellen (Mitarbeiter)
    if ($method === 'POST' && $tripId === null) {
        $body = requestBody();
        requireFields($body, ['pickup_zone', 'dropoff_zone', 'passengers']);

        $pickupZone   = strtoupper(trim((string)$body['pickup_zone']));
        $dropoffZone  = strtoupper(trim((string)$body['dropoff_zone']));
        $pickupDetail = trim((string)($body['pickup_detail'] ?? '')) ?: null;
        $dropoffDetail= trim((string)($body['dropoff_detail'] ?? '')) ?: null;
        $passengers   = max(1, (int)$body['passengers']);

        if (!in_array($pickupZone, validZones(), true)) {
            errorResponse('Ungueltige Abholposition: ' . $pickupZone);
        }
        if (!in_array($dropoffZone, validZones(), true)) {
            errorResponse('Ungueltige Zielposition: ' . $dropoffZone);
        }
        if ($passengers < 1 || $passengers > 16) {
            errorResponse('Anzahl Mitfahrende muss zwischen 1 und 16 liegen.');
        }

        $stmt = $pdo->prepare(
            "INSERT INTO trips (pickup_zone, pickup_detail, dropoff_zone, dropoff_detail, passengers)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$pickupZone, $pickupDetail, $dropoffZone, $dropoffDetail, $passengers]);
        $newId = (int)$pdo->lastInsertId();

        $trip = $pdo->query("SELECT * FROM trips WHERE id = {$newId}")->fetch();
        jsonResponse($trip, 201);
    }

    // PATCH /api/trips/{id}/accept - Auftrag annehmen (Taxi)
    if ($method === 'PATCH' && $tripId && $action === 'accept') {
        $body   = requestBody();
        $taxiId = isset($body['taxi_id']) ? (int)$body['taxi_id'] : 0;
        if (!$taxiId) {
            errorResponse('taxi_id fehlt.');
        }

        // Taxi-Kapazitaet pruefen
        $taxi = $pdo->query("SELECT * FROM taxis WHERE id = {$taxiId} AND active = 1")->fetch();
        if (!$taxi) {
            errorResponse('Taxi nicht gefunden.', 404);
        }

        $trip = $pdo->query("SELECT * FROM trips WHERE id = {$tripId} AND status = 'pending'")->fetch();
        if (!$trip) {
            errorResponse('Auftrag nicht verfuegbar.', 409);
        }

        // Aktuelle Last des Taxis ermitteln
        $loadStmt = $pdo->prepare(
            "SELECT COALESCE(SUM(passengers), 0)
             FROM trips WHERE taxi_id = ? AND status IN ('accepted', 'in_progress')"
        );
        $loadStmt->execute([$taxiId]);
        $currentLoad = (int)$loadStmt->fetchColumn();
        $newLoad     = $currentLoad + (int)$trip['passengers'];
        $overflow    = $newLoad > (int)$taxi['capacity'] ? 1 : 0;

        $updateStmt = $pdo->prepare(
            "UPDATE trips
             SET taxi_id = ?, status = 'accepted', accepted_at = NOW(), overflow_warning = ?
             WHERE id = ? AND status = 'pending'"
        );
        $updateStmt->execute([$taxiId, $overflow, $tripId]);

        if ($updateStmt->rowCount() === 0) {
            errorResponse('Auftrag konnte nicht angenommen werden.', 409);
        }

        // Belegte Plaetze im Taxi aktualisieren
        $pdo->prepare("UPDATE taxis SET occupied = ? WHERE id = ?")->execute([$newLoad, $taxiId]);

        $trip = $pdo->query("SELECT * FROM trips WHERE id = {$tripId}")->fetch();
        jsonResponse($trip);
    }

    // PATCH /api/trips/{id}/complete - Auftrag abschliessen (Taxi)
    if ($method === 'PATCH' && $tripId && $action === 'complete') {
        $body      = requestBody();
        $taxiId    = isset($body['taxi_id']) ? (int)$body['taxi_id'] : 0;
        $newZone   = strtoupper(trim((string)($body['position'] ?? '')));

        if (!$taxiId) {
            errorResponse('taxi_id fehlt.');
        }

        $trip = $pdo->query(
            "SELECT * FROM trips WHERE id = {$tripId} AND taxi_id = {$taxiId} AND status IN ('accepted','in_progress')"
        )->fetch();
        if (!$trip) {
            errorResponse('Auftrag nicht gefunden oder nicht zugewiesen.', 404);
        }

        $pdo->prepare(
            "UPDATE trips SET status = 'completed', completed_at = NOW() WHERE id = ?"
        )->execute([$tripId]);

        // Standort aktualisieren und Belegung neu berechnen
        if ($newZone && in_array($newZone, validZones(), true)) {
            $pdo->prepare("UPDATE taxis SET position = ? WHERE id = ?")->execute([$newZone, $taxiId]);
        }

        $loadStmt = $pdo->prepare(
            "SELECT COALESCE(SUM(passengers), 0)
             FROM trips WHERE taxi_id = ? AND status IN ('accepted', 'in_progress')"
        );
        $loadStmt->execute([$taxiId]);
        $currentLoad = (int)$loadStmt->fetchColumn();
        $pdo->prepare("UPDATE taxis SET occupied = ? WHERE id = ?")->execute([$currentLoad, $taxiId]);

        jsonResponse(['ok' => true, 'remaining_load' => $currentLoad]);
    }

    // PATCH /api/trips/{id}/cancel - Auftrag stornieren
    if ($method === 'PATCH' && $tripId && $action === 'cancel') {
        $body   = requestBody();
        $taxiId = isset($body['taxi_id']) ? (int)$body['taxi_id'] : null;

        $trip = $pdo->query("SELECT * FROM trips WHERE id = {$tripId}")->fetch();
        if (!$trip || in_array($trip['status'], ['completed', 'cancelled'], true)) {
            errorResponse('Auftrag kann nicht storniert werden.', 409);
        }

        $pdo->prepare("UPDATE trips SET status = 'cancelled' WHERE id = ?")->execute([$tripId]);

        if ($taxiId) {
            $loadStmt = $pdo->prepare(
                "SELECT COALESCE(SUM(passengers), 0)
                 FROM trips WHERE taxi_id = ? AND status IN ('accepted', 'in_progress')"
            );
            $loadStmt->execute([$taxiId]);
            $currentLoad = (int)$loadStmt->fetchColumn();
            $pdo->prepare("UPDATE taxis SET occupied = ? WHERE id = ?")->execute([$currentLoad, $taxiId]);
        }

        jsonResponse(['ok' => true]);
    }

    errorResponse('Endpunkt nicht gefunden.', 404);
} catch (InvalidArgumentException $e) {
    errorResponse($e->getMessage(), 422);
} catch (PDOException $e) {
    error_log($e->getMessage());
    errorResponse('Datenbankfehler.', 500);
}
