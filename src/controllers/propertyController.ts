import { Request, Response, NextFunction } from 'express';
import { propertyService, CreatePropertyDTO } from '../services/propertyService.js';

export const propertyController = {
    // POST /api/properties
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate the shape of req.body before proceeding (consider using Zod in production environment)
            const data: CreatePropertyDTO = req.body;

            // Basic manual validation
            if (!data.title || !data.price || !data.longitude || !data.latitude) {
                res.status(400).json({
                    error: 'Missing required fields: title, price, longitude and latitude are mandatory.'
                });
                return;
            }

            const newProperty = await propertyService.createProperty(data);

            res.status(201).json(newProperty);
        } catch (error) {
            // Trgger the global Express error handler by passing error to the next()
            next(error);
        }
    },

    // GET /api/properties
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        const { q, page = 1, limit = 3 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        try {
            const propertiesObj = await propertyService.getAllProperties(q, offset, page, limit);

            res.status(200).json(propertiesObj);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/properties/:id
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id  = req.params.id as string;

            if (!id || id === 'undefined') {
                res.status(400).json({ error: 'Property ID is missing or invalid.'});
                return;
            }

            // Validate that the string is a proper formatted UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                res.status(400).json({ error: 'Invalid property ID format.' });
                return;
            }

            const property = await propertyService.getPropertyById(id);

            if (!property) {
                res.status(404).json({ error: 'Property was not found.' });
                return;
            }

            res.status(200).json(property);
        } catch (error) {
            next(error);
        }
    },

    // GET /api/properties/search?lat=...&lng=...&radius=...
    async searchByRadius(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const lat = parseFloat(req.query.lat as string);
            const lng = parseFloat(req.query.lng as string);
            // Default to a 10-mile radius if the user doesn't provide one
            const radius = parseFloat(req.query.radius as string) || 10;

            if (isNaN(lat) || isNaN(lng)) {
                res.status(400).json({ error: 'Valid lat and lng query paramters are required.' });
                return;
            }

            console.log(`[API] Searching within ${radius} miles of (${lat}, ${lng})`);

            const properties = await propertyService.getPropertiesInRadius(lat, lng, radius);

            res.status(200).json(properties);
        } catch (error) {
            next(error);
        }
    },

    async uploadImages(req: Request, res: Response, next: NextFunction) {
        try {
            const propertyId = req.params.id as string;

            const files = req.files as Express.Multer.File[];

            // Extract the secure URLs Cloudinary generated (TO FIX)
            const imageUrls = files.map((file) => file.path);

            const propertyImages = await propertyService.uploadImages(propertyId, imageUrls)

            res.status(200).json({ message: 'Images uploaded', property: propertyImages[0] });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({ message: 'Failed to upload images.' });
        }
    }
};