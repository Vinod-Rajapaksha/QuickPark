-- Seed data for the Local Performance Database

CREATE TABLE IF NOT EXISTS parking_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    has_ev_charging BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    total_slots INT NOT NULL,
    available_slots INT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES parking_facilities(id),
    user_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING'
);

INSERT INTO parking_facilities (id, name, city, latitude, longitude, has_ev_charging, hourly_rate, total_slots, available_slots)
VALUES ('11111111-1111-1111-1111-111111111111', 'Mock SLIIT Parking', 'Colombo', 6.9147, 79.9729, TRUE, 150.00, 500, 250)
ON CONFLICT DO NOTHING;
