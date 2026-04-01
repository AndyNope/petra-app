using Microsoft.EntityFrameworkCore;
using PetraApp.Api.Models;

namespace PetraApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Taxi> Taxis => Set<Taxi>();
    public DbSet<Trip> Trips => Set<Trip>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Enums als String speichern
        modelBuilder.Entity<Trip>()
            .Property(t => t.Status)
            .HasMaxLength(20);

        // Indexes
        modelBuilder.Entity<Taxi>()
            .HasIndex(t => t.RadioId).IsUnique();

        modelBuilder.Entity<Trip>()
            .HasIndex(t => t.Status);

        modelBuilder.Entity<Trip>()
            .HasIndex(t => t.TaxiId);
    }
}
