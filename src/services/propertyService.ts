import { db } from "../db/index.js";
import { Property } from "../types/index.js";

// A Data Transfer Object (DTO) for creating a property.
export interface CreatePropertyDTO {
    agent_id: string;
    title: string;
    description: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    square_feet: number;
    longitude: number;
    latitude: number;
}

export const propertyService = {
    // Insert a new property into the database.
    async createProperty(data: CreatePropertyDTO): Promise<Property> {
        // Use ST_SetSRID and ST_MakePoint to convert raw coordinates into a PostGIS Geometry object
        const query = `
            INSERT INTO properties (
                agent_id, title, description, price, bedrooms, bathrooms, square_feet, location
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326)
            ) RETURNING *;
        `;

        const values = [
            data.agent_id, data.title, data.description, data.price,
            data.bedrooms, data.bathrooms, data.square_feet,
            data.longitude, data.latitude
        ];

        const result = await db.query<Property>(query, values);

        if (!result.rows[0]) {
            throw new Error('Database failed to return the created property.');
        }

        return result.rows[0];
    },

    // Fetches properties within a specific radius of a given coordinate.
    async getPropertiesInRadius(lat: number, lng: number, radiusInMiles: number): Promise<Property[]> {
        // 1 mile = 1609.34 metres
        // PostGIS calculates geography distance in meters
        const radiusInMeters = radiusInMiles * 1609.34;

        // Ensure that the distance is calculated accurately over the Earth's curve using ::geography cast
        const query = `
            SELECT
                id, agent_id, title, description, price, bedrooms, bathrooms, square_feet, status,
                ST_X(location::geometry) AS longitude,
                ST_Y(location::geometry) AS latitude
            FROM properties
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
            ORDER BY created_at DESC;
        `;

        const values = [lng, lat, radiusInMeters];
        const result = await db.query<Property>(query, values);
        return result.rows;
    },

    // Get all property listings for public page
    // @ts-expect-error "implicit any type"
    async getAllProperties(q, offset, page, limit): Promise<{}> {
        let queryText = 'SELECT *, COUNT(*) OVER() as total_count FROM properties';
        let queryParams = [];
        let paramIndex = 1;

        // If a search term exists, filter the results
        if (q) {
            // Search against the title or the address
            queryText += ` WHERE title ILIKE $${paramIndex}`;
            queryParams.push(`%${q}%`);
            paramIndex++;
        }

        // Handle Pagination Order, Limit and Offset
        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await db.query(queryText, queryParams);

        // Calculate the pagination metadata
        // If the array has items, grab the total_count from the first row. Otherwise, 0.
        const totalItems = result.rows.length > 0 ? parseInt(result.rows[0]?.total_count) : 0;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            properties: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems
            }
        }
    },

    // Get a single property
    async getPropertyById(id: string): Promise<Property | null> {
        const query = `SELECT * FROM properties WHERE id = $1;`;
        const result = await db.query<Property>(query, [id]);

        // Return the property if found, otherwise return null
        return result.rows[0] || null;
    },

    // Find properties within a specific radius using PostGIS spatial indexing
    async findPropertiesWithinRadius(lng: number, lat: number, radiusInMiles: number): Promise<Property[]> {
        // 1 mile = 1609.34 meters. PostGIS geography functions default to meters.
        const radiusInMeters = radiusInMiles * 1609.34;

        const query = `
            WITH target_point AS (
                SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography AS geom
            )
            SELECT
                id,
                title,
                price,
                bedrooms,
                ST_Y(location::geometry) as latitude,
                ST_X(location::geometry) as longitude,
                (ST_Distance(location::geography, target_point.geom) / 1609.34) AS distance_miles
            FROM properties, target_point
            WHERE ST_DWithin(location::geography, target_point.geom, $3)
            ORDER BY distance_miles ASC;
        `;

        // Order for coordinates is: $1 - longitude, $2 latitude
        const values = [lng, lat, radiusInMeters];

        const result = await db.query(query, values);
        return result.rows;
    },

    async uploadImages(propertyId: string, imageUrls: string[]) {
        // Update the DB by appending the new URLs to the existing array
        const updateQuery = `
            UPDATE properties
            SET image_urls = array_cat(image_urls, $1)
            WHERE id = $2
            RETURNING *;
        `;

        const result = await db.query(updateQuery, [imageUrls, propertyId]);
        return result.rows
    }
};