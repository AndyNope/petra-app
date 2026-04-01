namespace PetraApp.Api.Services;

/// <summary>
/// Port des PHP-Algorithmus für die ZRH-Vorfeld-Taxipriorität.
/// Positionen: E-F-H-I-A-B-C-D-T-G-P-W (Index 0–11).
/// Niedrigerer Score = höhere Priorität.
/// </summary>
public class AlgorithmService
{
    private static readonly string[] Positions =
        ["E", "F", "H", "I", "A", "B", "C", "D", "T", "G", "P", "W"];

    public static IReadOnlyList<string> ValidZones => Positions;

    public bool IsValidZone(string zone) =>
        Array.Exists(Positions, p => p == zone.ToUpper());

    private static int PositionIndex(string zone)
    {
        var idx = Array.IndexOf(Positions, zone.ToUpper());
        if (idx < 0) throw new ArgumentException($"Unbekannte Position: {zone}");
        return idx;
    }

    /// <summary>
    /// Berechnet den Prioritäts-Score eines Auftrags relativ zum Taxi-Standort.
    /// </summary>
    public float TripPriorityScore(string taxiZone, string pickupZone)
    {
        int taxiIdx   = PositionIndex(taxiZone);
        int pickupIdx = PositionIndex(pickupZone);
        int centerIdx = PositionIndex("A"); // Index 4

        float distToPickup = Math.Abs(taxiIdx - pickupIdx);
        float edgePenalty  = Math.Min(pickupIdx, Positions.Length - 1 - pickupIdx);
        float sameSide     =
            (taxiIdx <= centerIdx && pickupIdx <= centerIdx) ||
            (taxiIdx >  centerIdx && pickupIdx >  centerIdx) ? 0f : 2f;

        return distToPickup + edgePenalty * 0.5f + sameSide;
    }

    /// <summary>
    /// Sortiert Trips nach Priorität für ein bestimmtes Taxi.
    /// </summary>
    public IEnumerable<T> SortByPriority<T>(string taxiZone, IEnumerable<T> trips,
        Func<T, string> getPickupZone) =>
        trips.OrderBy(t => TripPriorityScore(taxiZone, getPickupZone(t)));
}
