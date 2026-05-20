-- Petra Airport Taxi Dispatch System
-- Database schema for ZRH apron positions

SET NAMES utf8mb4;
SET time_zone = '+01:00';

CREATE TABLE IF NOT EXISTS taxis (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    radio_id    VARCHAR(20) NOT NULL UNIQUE COMMENT 'Funknummer des Fahrers',
    position    VARCHAR(5)  NOT NULL COMMENT 'Aktueller Standort (Platz-Buchstabe)',
    capacity    INT         NOT NULL DEFAULT 8,
    occupied    INT         NOT NULL DEFAULT 0,
    active      TINYINT(1)  NOT NULL DEFAULT 1,
    last_seen   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trips (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    taxi_id         INT          NULL REFERENCES taxis(id),
    pickup_zone     VARCHAR(5)   NOT NULL COMMENT 'Abholplatz (z.B. A, B, C)',
    pickup_detail   VARCHAR(20)  NULL COMMENT 'Optionale Platznummer',
    dropoff_zone    VARCHAR(5)   NOT NULL COMMENT 'Zielplatz',
    dropoff_detail  VARCHAR(20)  NULL COMMENT 'Optionale Zielnummer',
    passengers      INT          NOT NULL DEFAULT 1,
    status          ENUM(
                        'pending',
                        'accepted',
                        'in_progress',
                        'completed',
                        'cancelled'
                    ) NOT NULL DEFAULT 'pending',
    overflow_warning TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Kapazitaet ueberschritten',
    requested_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at     TIMESTAMP   NULL,
    completed_at    TIMESTAMP   NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indizes fuer haeufige Abfragen
CREATE INDEX idx_trips_status     ON trips(status);
CREATE INDEX idx_trips_taxi_id    ON trips(taxi_id);
CREATE INDEX idx_taxis_radio_id   ON taxis(radio_id);
