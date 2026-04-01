using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraApp.Api.Data;
using PetraApp.Api.Dtos;
using PetraApp.Api.Models;
using PetraApp.Api.Services;

namespace PetraApp.Api.Controllers;

[ApiController]
[Route("api/taxis")]
[Authorize] // Alle Endpunkte erfordern gültigen Entra-ID-Token
public class TaxisController(AppDbContext db, AlgorithmService algo) : ControllerBase
{
    // GET /api/taxis — Aktive Taxis (Disposition)
    [HttpGet]
    [Authorize(Policy = "Disposition")]
    public async Task<IActionResult> GetAll()
    {
        var taxis = await db.Taxis
            .Where(t => t.Active)
            .OrderBy(t => t.RadioId)
            .Select(t => new TaxiResponse(
                t.Id, t.RadioId, t.Position, t.Capacity, t.Occupied,
                t.Active, t.LastSeen, t.CreatedAt))
            .ToListAsync();

        return Ok(taxis);
    }

    // POST /api/taxis — Taxi anmelden (Taxifahrer)
    [HttpPost]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> Register([FromBody] RegisterTaxiRequest req)
    {
        if (!algo.IsValidZone(req.Position))
            return BadRequest(new ErrorResponse($"Ungültige Position: {req.Position}"));

        var position = req.Position.ToUpper();

        // Bestehenden inaktiven Eintrag reaktivieren oder neu erstellen
        var existing = await db.Taxis
            .FirstOrDefaultAsync(t => t.RadioId == req.RadioId);

        if (existing is not null)
        {
            existing.Position = position;
            existing.Active   = true;
            existing.Occupied = 0;
            existing.LastSeen = DateTime.UtcNow;
        }
        else
        {
            existing = new Taxi
            {
                RadioId  = req.RadioId.Trim(),
                Position = position,
            };
            db.Taxis.Add(existing);
        }

        await db.SaveChangesAsync();

        return Created($"/api/taxis/{existing.Id}", new TaxiResponse(
            existing.Id, existing.RadioId, existing.Position, existing.Capacity,
            existing.Occupied, existing.Active, existing.LastSeen, existing.CreatedAt));
    }

    // PATCH /api/taxis/{id}/position — Standort aktualisieren (Taxifahrer)
    [HttpPatch("{id}/position")]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> UpdatePosition(int id, [FromBody] UpdatePositionRequest req)
    {
        if (!algo.IsValidZone(req.Position))
            return BadRequest(new ErrorResponse($"Ungültige Position: {req.Position}"));

        var taxi = await db.Taxis.FindAsync(id);
        if (taxi is null || !taxi.Active)
            return NotFound(new ErrorResponse("Taxi nicht gefunden."));

        taxi.Position = req.Position.ToUpper();
        taxi.LastSeen = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new TaxiResponse(
            taxi.Id, taxi.RadioId, taxi.Position, taxi.Capacity,
            taxi.Occupied, taxi.Active, taxi.LastSeen, taxi.CreatedAt));
    }

    // PATCH /api/taxis/{id}/deactivate — Abmelden (Taxifahrer)
    [HttpPatch("{id}/deactivate")]
    [Authorize(Policy = "Taxifahrer")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var taxi = await db.Taxis.FindAsync(id);
        if (taxi is null) return NotFound(new ErrorResponse("Taxi nicht gefunden."));

        taxi.Active   = false;
        taxi.LastSeen = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Taxi abgemeldet." });
    }
}
