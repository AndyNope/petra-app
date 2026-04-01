using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetraApp.Api.Models;

[Table("taxis")]
public class Taxi
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required, MaxLength(20)]
    [Column("radio_id")]
    public string RadioId { get; set; } = "";

    [Required, MaxLength(5)]
    [Column("position")]
    public string Position { get; set; } = "";

    [Column("capacity")]
    public int Capacity { get; set; } = 8;

    [Column("occupied")]
    public int Occupied { get; set; } = 0;

    [Column("active")]
    public bool Active { get; set; } = true;

    [Column("last_seen")]
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Trip> Trips { get; set; } = [];
}
