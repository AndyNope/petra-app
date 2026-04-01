using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraApp.Api.Data;
using PetraApp.Api.Dtos;
using PetraApp.Api.Models;
using PetraApp.Api.Services;
using System.Security.Claims;

namespace PetraApp.Api.Controllers;

[ApiController]
[Route("api/trips")]
[Authorize]
public class TripsController(AppDbContext db, AlgorithmService algo) : ControllerBase
{
    private static TripResponse ToDto(Trip t) => new(
        t.Id, t.TaxiId,
        t.PickupZone, t.PickupDetail,
        t.DropoffZone, t.DropoffDetail,
        t.Passengers, t.Status, t.OverflowWarning,
        t.RequestedAt, t.AcceptedAt, t.CompletedAt,
        t.Taxi?.RadioId, t.Taxi?.Position);

    private IQueryable<Trip> TripsWithTaxi() =>
        db.Trips.Include(t => t.Taxi);

    // GET /api/trips — Auftragsliste (Taxifahrer + Disposition)
    [HttpGet]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string status = "pending",
        [FromQuery] int? taxiId  = null,
        [FromQuery] int? tripId  = null)
    {
        if (tripId.HasValue)
        {
            var single = await TripsWithTaxi()
                .FirstOrDefaultAsync(t => t.Id == tripId.Value);
            return single is null
                ? NotFound(new ErrorResponse("Auftrag nicht gefunden."))
                : Ok(ToDto(single));
        }

        var allowed = new[] { "pending", "accepted", "in_progress", "completed", "all" };
        if (!allowed.Contains(status)) status = "pending";

        IQueryable<Trip> q = TripsWithTaxi();
        if (status != "all") q = q.Where(t => t.Status == status);
        q = q.OrderBy(t => t.RequestedAt);

        var trips = await q.ToListAsync();

        // Prioritätssortierung für Taxi-Ansicht
        if (taxiId.HasValue && status == "pending")
        {
            var taxi = await db.Taxis
                .FirstOrDefaultAsync(t => t.Id == taxiId.Value && t.Active);
            if (taxi is not null)
            {
                trips = algo.SortByPriority(taxi.Position, trips, t => t.PickupZone)
                            .ToList();
            }
        }

        return Ok(trips.Select(ToDto));
    }

    // GET /api/trips/{id} — Einzelner Auftrag (Mitarbeiter-Polling)
    [HttpGet("{id}")]
    [Authorize(Policy = "Mitarbeiter")]
    public async Task<IActionResult> GetOne(int id)
    {
        var trip = await TripsWithTaxi().FirstOrDefaultAsync(t => t.Id == id);
        return trip is null
            ? NotFound(new ErrorResponse("Auftrag nicht gefunden."))
            : Ok(ToDto(trip));
    }

    // POST /api/trips — Auftrag erstellen (Mitarbeiter)
    [HttpPost]
    [Authorize(Policy = "Mitarbeiter")]
    public async Task<IActionResult> Create([FromBody] CreateTripRequest req)
    {
        if (!algo.IsValidZone(req.PickupZone))
            return BadRequest(new ErrorResponse($"Ungültige Abholposition: {req.PickupZone}"));
        if (!algo.IsValidZone(req.DropoffZone))
            return BadRequest(new ErrorResponse($"Ungültige Zielposition: {req.DropoffZone}"));
        if (req.Passengers < 1 || req.Passengers > 16)
            return BadRequest(new ErrorResponse("Anzahl Mitfahrende muss zwischen 1 und 16 liegen."));

        var oid = User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        var trip = new Trip
        {
            PickupZone   = req.PickupZone.ToUpper(),
            PickupDetail = req.PickupDetail?.Trim() is { Length: > 0 } pd ? pd : null,
            DropoffZone  = req.DropoffZone.ToUpper(),
            DropoffDetail= req.DropoffDetail?.Trim() is { Length: > 0 } dd ? dd : null,
            Passengers   = req.Passengers,
            RequesterOid = oid,
        };

        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        return Created($"/api/trips/{trip.Id}", ToDto(trip));
    }

    // PATCH /api/trips/{id}/accept — Auftrag annehmen (Taxifahrer)
    [HttpPatch("{id}/accept")]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> Accept(int id, [FromBody] AcceptTripRequest req)
    {
        var taxi = await db.Taxis
            .FirstOrDefaultAsync(t => t.Id == req.TaxiId && t.Active);
        if (taxi is null) return NotFound(new ErrorResponse("Taxi nicht gefunden."));

        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.Status == "pending");
        if (trip is null) return Conflict(new ErrorResponse("Auftrag nicht verfügbar."));

        var currentLoad = await db.Trips
            .Where(t => t.TaxiId == req.TaxiId &&
                        (t.Status == "accepted" || t.Status == "in_progress"))
            .SumAsync(t => (int?)t.Passengers) ?? 0;

        var newLoad  = currentLoad + trip.Passengers;
        var overflow = newLoad > taxi.Capacity;

        trip.TaxiId          = req.TaxiId;
        trip.Status          = "accepted";
        trip.AcceptedAt      = DateTime.UtcNow;
        trip.OverflowWarning = overflow;
        taxi.Occupied        = newLoad;
        taxi.LastSeen        = DateTime.UtcNow;

        await db.SaveChangesAsync();

        await db.Entry(trip).Reference(t => t.Taxi).LoadAsync();
        return Ok(ToDto(trip));
    }

    // PATCH /api/trips/{id}/complete — Auftrag abschliessen (Taxifahrer)
    [HttpPatch("{id}/complete")]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> Complete(int id, [FromBody] CompleteTripRequest req)
    {
        if (!string.IsNullOrEmpty(req.Position) && !algo.IsValidZone(req.Position))
            return BadRequest(new ErrorResponse($"Ungültige Position: {req.Position}"));

        var trip = await db.Trips.Include(t => t.Taxi)
            .FirstOrDefaultAsync(t => t.Id == id && t.TaxiId == req.TaxiId &&
                                      (t.Status == "accepted" || t.Status == "in_progress"));
        if (trip is null)
            return NotFound(new ErrorResponse("Auftrag nicht gefunden."));

        trip.Status      = "completed";
        trip.CompletedAt = DateTime.UtcNow;

        // Belegung neu berechnen und Standort aktualisieren
        if (trip.Taxi is not null)
        {
            var remainingLoad = await db.Trips
                .Where(t => t.TaxiId == req.TaxiId && t.Id != id &&
                            (t.Status == "accepted" || t.Status == "in_progress"))
                .SumAsync(t => (int?)t.Passengers) ?? 0;
            trip.Taxi.Occupied = remainingLoad;
            trip.Taxi.LastSeen = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(req.Position))
                trip.Taxi.Position = req.Position.ToUpper();
        }

        await db.SaveChangesAsync();
        return Ok(new { remaining_load = trip.Taxi?.Occupied ?? 0, trip = ToDto(trip) });
    }

    // PATCH /api/trips/{id}/cancel — Stornieren (Taxifahrer + Admin)
    [HttpPatch("{id}/cancel")]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> Cancel(int id)
    {
        var trip = await db.Trips.Include(t => t.Taxi)
            .FirstOrDefaultAsync(t => t.Id == id &&
                                      (t.Status == "pending" || t.Status == "accepted"));
        if (trip is null) return NotFound(new ErrorResponse("Auftrag nicht stornierbar."));

        trip.Status = "cancelled";
        if (trip.Taxi is not null && trip.Status == "accepted")
        {
            trip.Taxi.Occupied = Math.Max(0, trip.Taxi.Occupied - trip.Passengers);
        }

        await db.SaveChangesAsync();
        return Ok(ToDto(trip));
    }
}
