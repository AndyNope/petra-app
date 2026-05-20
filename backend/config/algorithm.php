<?php
declare(strict_types=1);

/**
 * Standort-Algorithmus fuer ZRH Vorfeld-Taxis.
 *
 * Geordnete Positionen-Liste: E-Seite links, A als Zentrum, W-Seite rechts.
 * Index 0 = E (aeusserstes Ende), Index 11 = W (aeusserstes Ende).
 */

const POSITIONS = ['E', 'F', 'H', 'I', 'A', 'B', 'C', 'D', 'T', 'G', 'P', 'W'];

/**
 * Gibt den numerischen Index einer Position zurueck.
 */
function positionIndex(string $zone): int
{
    $idx = array_search(strtoupper($zone), POSITIONS, true);
    if ($idx === false) {
        throw new InvalidArgumentException("Unbekannte Position: {$zone}");
    }
    return (int)$idx;
}

/**
 * Berechnet die "Distanz" zwischen zwei Positionen als Index-Abstand.
 */
function positionDistance(string $from, string $to): int
{
    return abs(positionIndex($from) - positionIndex($to));
}

/**
 * Berechnet einen Prioritaets-Score fuer einen Auftrag relativ zum Taxi-Standort.
 *
 * Niedrigerer Score = hoehere Prioritaet.
 *
 * Logik:
 *  - Basis: Distanz vom Taxi zum Abholort
 *  - Bonus (Malus reduzieren): Auftraege, deren Abholort nahe dem Rand liegt (E oder W),
 *    erhalten einen Abzug, damit das Taxi die Aussenbereiche bevorzugt mitnimmt
 *    und die Strecke effizient nutzt.
 *  - Wert am Rand: Index 0 (E) oder Index 11 (W) => Edge-Score = 0
 *    Wert in Mitte (A, Index 4) => Edge-Score = 4
 */
function tripPriorityScore(string $taxiZone, array $trip): float
{
    $pickupIdx  = positionIndex($trip['pickup_zone']);
    $dropoffIdx = positionIndex($trip['dropoff_zone']);
    $taxiIdx    = positionIndex($taxiZone);

    $centerIdx = positionIndex('A'); // Index 4

    // Distanz Taxi -> Abholort
    $distToPickup = abs($taxiIdx - $pickupIdx);

    // Wie weit liegt der Abholort vom Rand entfernt? Je naeher am Rand, desto besser.
    $edgePenalty = min($pickupIdx, count(POSITIONS) - 1 - $pickupIdx);

    // Ist der Auftrag auf der gleichen Seite wie das Taxi? Bonus geben.
    $sameSide = (
        ($taxiIdx <= $centerIdx && $pickupIdx <= $centerIdx) ||
        ($taxiIdx >  $centerIdx && $pickupIdx >  $centerIdx)
    ) ? 0 : 2;

    return $distToPickup + $edgePenalty * 0.5 + $sameSide;
}

/**
 * Sortiert eine Liste offener Auftraege nach Prioritaet fuer ein bestimmtes Taxi.
 *
 * @param string $taxiZone  Aktueller Standort des Taxis
 * @param array  $trips     Liste von Trip-Arrays aus der Datenbank
 * @return array Sortierte Trips (hoechste Prioritaet zuerst)
 */
function sortTripsByPriority(string $taxiZone, array $trips): array
{
    usort($trips, function (array $a, array $b) use ($taxiZone): int {
        $scoreA = tripPriorityScore($taxiZone, $a);
        $scoreB = tripPriorityScore($taxiZone, $b);
        return $scoreA <=> $scoreB;
    });
    return $trips;
}

/**
 * Gibt alle gueltigen Positionsbuchstaben zurueck.
 */
function validZones(): array
{
    return POSITIONS;
}
