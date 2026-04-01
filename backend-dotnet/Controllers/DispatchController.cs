using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraApp.Api.Data;
using PetraApp.Api.Dtos;

namespace PetraApp.Api.Controllers;

[ApiController]
[Route("api/dispatch")]
[Authorize(Policy = "Disposition")]
public class DispatchController(AppDbContext db) : ControllerBase
{
    private static TripResponse ToDto(Trip t) => new(
        t.Id, t.TaxiId,
        t.PickupZone, t.PickupDetail,
        t.DropoffZone, t.DropoffDetail,
        t.Passengers, t.Status, t.OverflowWarning,
        t.RequestedAt, t.AcceptedAt, t.CompletedAt,
        t.Taxi?.RadioId, t.Taxi?.Position);

    // GET /api/dispatch — Übersicht für Disposition
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var taxis = await db.Taxis
            .Where(t => t.Active)
            .OrderBy(t => t.RadioId)
            .Select(t => new DispatchTaxiResponse(
                t.Id, t.RadioId, t.Position, t.Capacity, t.Occupied, t.LastSeen))
            .ToListAsync();

        var openTrips = await db.Trips
            .Include(t => t.Taxi)
            .Where(t => t.Status == "pending" || t.Status == "accepted" || t.Status == "in_progress")
            .OrderBy(t => t.RequestedAt)
            .ToListAsync();

        var recent = await db.Trips
            .Include(t => t.Taxi)
            .OrderByDescending(t => t.RequestedAt)
            .Take(50)
            .ToListAsync();

        // Tagesstatistik heute (UTC)
        var today = DateTime.UtcNow.Date;
        var todayTrips = await db.Trips
            .Where(t => t.RequestedAt >= today)
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Total = g.Count(), Passengers = g.Sum(t => t.Passengers) })
            .ToListAsync();

        var stats = todayTrips.ToDictionary(
            g => g.Status,
            g => new StatEntry(g.Total, g.Passengers));

        return Ok(new DispatchResponse(
            stats,
            taxis,
            openTrips.Select(ToDto).ToList(),
            recent.Select(ToDto).ToList()));
    }
}
