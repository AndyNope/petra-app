<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/helpers.php';

setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Nur GET erlaubt.', 405);
}

try {
    $pdo = db();

    // Taxi-Uebersicht
    $taxis = $pdo->query(
        "SELECT id, radio_id, position, capacity, occupied, last_seen,
                (capacity - occupied) AS free_seats
         FROM taxis WHERE active = 1 ORDER BY radio_id"
    )->fetchAll();

    // Auftraege nach Status
    $counts = $pdo->query(
        "SELECT status, COUNT(*) AS total, SUM(passengers) AS passengers
         FROM trips
         WHERE DATE(requested_at) = CURDATE()
         GROUP BY status"
    )->fetchAll();

    $statusMap = [];
    foreach ($counts as $row) {
        $statusMap[$row['status']] = [
            'total'      => (int)$row['total'],
            'passengers' => (int)$row['passengers'],
        ];
    }

    // Letzte 50 abgeschlossene Auftraege
    $recent = $pdo->query(
        "SELECT t.id, t.pickup_zone, t.pickup_detail, t.dropoff_zone, t.dropoff_detail,
                t.passengers, t.status, t.overflow_warning,
                t.requested_at, t.accepted_at, t.completed_at,
                tx.radio_id AS taxi_radio_id
         FROM trips t
         LEFT JOIN taxis tx ON tx.id = t.taxi_id
         ORDER BY t.requested_at DESC
         LIMIT 50"
    )->fetchAll();

    // Offene Auftraege mit Zuweisung
    $open = $pdo->query(
        "SELECT t.id, t.pickup_zone, t.pickup_detail, t.dropoff_zone, t.dropoff_detail,
                t.passengers, t.status, t.overflow_warning, t.requested_at,
                tx.radio_id AS taxi_radio_id
         FROM trips t
         LEFT JOIN taxis tx ON tx.id = t.taxi_id
         WHERE t.status IN ('pending','accepted','in_progress')
         ORDER BY t.requested_at ASC"
    )->fetchAll();

    jsonResponse([
        'taxis'      => $taxis,
        'stats'      => $statusMap,
        'open_trips' => $open,
        'recent'     => $recent,
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    errorResponse('Datenbankfehler.', 500);
}
