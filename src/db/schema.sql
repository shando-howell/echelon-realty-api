CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS agents;
DROP TYPE IF EXISTS property_status;

-- Enforce strict status tracking
CREATE TYPE property_status AS ENUM ('active', 'pending', 'sold', 'off_market');

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    bedrooms SMALLINT NOT NULL,
    bathrooms DECIMAL(3, 1) NOT NULL,
    square_feet INTEGER NOT NULL,
    location GEOMETRY(point, 4326),
    status property_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_location ON properties USING GIST (location);
CREATE INDEX idx_properties_price ON properties (price);