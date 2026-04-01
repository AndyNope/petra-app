using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetraApp.Api.Models;

[Table("trips")]
public class Trip
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("taxi_id")]
    public int? TaxiId { get; set; }

    [Required, MaxLength(5)]
    [Column("pickup_zone")]
    public string PickupZone { get; set; } = "";

    [MaxLength(20)]
    [Column("pickup_detail")]
    public string? PickupDetail { get; set; }

    [Required, MaxLength(5)]
    [Column("dropoff_zone")]
    public string DropoffZone { get; set; } = "";

    [MaxLength(20)]
    [Column("dropoff_detail")]
    public string? DropoffDetail { get; set; }

    [Column("passengers")]
    public int Passengers { get; set; } = 1;

    [Required, MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("overflow_warning")]
    public bool OverflowWarning { get; set; } = false;

    [Column("requested_at")]
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    [Column("accepted_at")]
    public DateTime? AcceptedAt { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    // Navigation
    [ForeignKey(nameof(TaxiId))]
    public Taxi? Taxi { get; set; }

    // Requester identity (Entra ID Object ID)
    [MaxLength(50)]
    [Column("requester_oid")]
    public string? RequesterOid { get; set; }
}
