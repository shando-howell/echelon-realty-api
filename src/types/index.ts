export enum PropertyStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    SOLD = 'sold',
    OFF_MARKET = 'off_market',
}

export interface Agent {
    id: string; // UUID
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    created_at: Date;
}

export interface Property {
    id: string; // UUID
    agent_id: string | null;
    title: string;
    description: string | null;
    price: string;
    bedrooms: number;
    bathrooms: string | number;
    square_feet: number;
    location: string | null;
    status: PropertyStatus;
    
    created_at: Date;
    updated_at: Date;
}