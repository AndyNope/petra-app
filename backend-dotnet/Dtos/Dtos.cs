namespace PetraApp.Api.Dtos;

// ── Taxis ─────────────────────────────────────────────────────────────────────

public record RegisterTaxiRequest(string RadioId, string Position);

public record UpdatePositionRequest(string Position);

public record TaxiResponse(
    int Id, string RadioId, string Position,
    int Capacity, int Occupied, bool Active,
    DateTime LastSeen, DateTime CreatedAt);

// ── Trips ─────────────────────────────────────────────────────────────────────

public record CreateTripRequest(
    string PickupZone, string? PickupDetail,
    string DropoffZone, string? DropoffDetail,
    int Passengers);

public record AcceptTripRequest(int TaxiId);

public record CompleteTripRequest(int TaxiId, string Position);

public record CancelTripRequest(int TaxiId);

public record TripResponse(
    int Id, int? TaxiId,
    string PickupZone, string? PickupDetail,
    string DropoffZone, string? DropoffDetail,
    int Passengers, string Status, bool OverflowWarning,
    DateTime RequestedAt, DateTime? AcceptedAt, DateTime? CompletedAt,
    string? TaxiRadioId, string? TaxiPosition);

// ── Dispatch ──────────────────────────────────────────────────────────────────

public record DispatchTaxiResponse(
    int Id, string RadioId, string Position,
    int Capacity, int Occupied, DateTime LastSeen);

public record StatEntry(int Total, int Passengers);

public record DispatchResponse(
    Dictionary<string, StatEntry> Stats,
    List<DispatchTaxiResponse> Taxis,
    List<TripResponse> OpenTrips,
    List<TripResponse> Recent);

// ── Fehler ────────────────────────────────────────────────────────────────────

public record ErrorResponse(string Error);
