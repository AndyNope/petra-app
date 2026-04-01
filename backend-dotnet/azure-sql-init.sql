-- Azure SQL Database Schema für Petra App
-- Ausführen nach Datenbankerstellt, ODER via EF Core Migrations: dotnet ef database update

CREATE TABLE taxis (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    radio_id    NVARCHAR(20)  NOT NULL,
    position    NVARCHAR(5)   NOT NULL,
    capacity    INT           NOT NULL DEFAULT 8,
    occupied    INT           NOT NULL DEFAULT 0,
    active      BIT           NOT NULL DEFAULT 1,
    last_seen   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_taxis_radio_id UNIQUE (radio_id)
);

CREATE TABLE trips (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    taxi_id          INT          NULL  REFERENCES taxis(id),
    pickup_zone      NVARCHAR(5)  NOT NULL,
    pickup_detail    NVARCHAR(20) NULL,
    dropoff_zone     NVARCHAR(5)  NOT NULL,
    dropoff_detail   NVARCHAR(20) NULL,
    passengers       INT          NOT NULL DEFAULT 1,
    status           NVARCHAR(20) NOT NULL DEFAULT 'pending',
    overflow_warning BIT          NOT NULL DEFAULT 0,
    requested_at     DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    accepted_at      DATETIME2    NULL,
    completed_at     DATETIME2    NULL,
    requester_oid    NVARCHAR(50) NULL    -- Entra ID Object ID des Anforderers
);

CREATE INDEX IX_trips_status  ON trips(status);
CREATE INDEX IX_trips_taxi_id ON trips(taxi_id);
CREATE INDEX IX_taxis_radio   ON taxis(radio_id);
