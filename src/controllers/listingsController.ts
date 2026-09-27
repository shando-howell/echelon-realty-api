import { db } from '../db/index.js'

export const listingsController = {
    // GET /api/my-listings
    // @ts-expect-error (implicit any types)
    async getListings(req, res, next): Promise<void> {
        try {
            // Listings service (need the req object so it was integrated in the controller)
            const query = `
                SELECT id, title, price, created_at
                FROM properties
                WHERE agent_id = $1
                ORDER BY created_at DESC
            `;
            const result = await db.query(query, [req.user.id])
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
            res.status(500).json({ message: 'Failed to fetch listings' });
        }
    },

    // @ts-expect-error (Implicit any type)
    async updateListing(req, res, next) {
        const propertyId = req.params.id;
        const agentId = req.user.id;

        console.log("The agent ID from the controller => ", agentId);

        const { title, price, bedrooms, description } = req.body;

        try {
            // Ownership check
            const checkQuery = 'SELECT agent_id, images FROM properties WHERE id = $1';
            const checkResult = await db.query(checkQuery, [propertyId]);

            if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            if (checkResult.rows[0].agent_id !== agentId) return res.status(403).json({ error: 'Forbidden' });

            // Handle Images (Keep old ones, append new ones)
            const existingImages = checkResult.rows[0].images || [];
            // @ts-expect-error (no implicit any type)
            const newImageUrls = req.files ? req.files.map(file => file.path) : [];
            const updatedImages = [...existingImages, ...newImageUrls];

            // Update the Database
            const updateQuery = `
                UPDATE properties
                SET title = $1, price = $2, bedrooms = $3, description = $4, images = $5
                WHERE id = $6 RETURNING *
            `;
            const values = [title, price, bedrooms, description, JSON.stringify(updatedImages), propertyId];

            const updatedProperty = await db.query(updateQuery, values);
            res.json({ message: 'Property updated successfully.', property: updatedProperty.rows[0] });
        } catch (error) {
            console.error("Update error:", error);
            res.status(500).json({ error: 'Failed to update property.' });
        }
    },

    // @ts-expect-error (implicitly any types)
    async deleteListing(req, res, next) {
        const propertyId = req.params.id;
        const agentId = req.user.id; 

        try {
            // This query only deletes the row if BOTH the property ID and the Agent ID match.
            const deleteQuery = 'DELETE FROM properties WHERE id = $1 AND agent_id = $2 RETURNING *';
            const result = await db.query(deleteQuery, [propertyId, agentId]);

            if (result.rowCount === 0) {
                // If rowCount is 0, the property doesn't exist OR the agent doesn't own it
                return res.status(403).json({ error: 'Forbidden or property not found.' });
            }

            res.json({ message: 'Listing deleted successfully.' });
        } catch (error) {
            console.error("Delete error:", error);
            res.status(500).json({ error: "Failed to delete listing." });
        }
    }
}