import { Router } from 'express';
import { propertyController } from '../controllers/propertyController.js';
import { upload } from '../utils/uploadConfig.js';

// Initialize the Express router
const router = Router();

// POST /api/properties (create a new real estate property)
router.post('/', propertyController.create);

// POST /api/properties/:id/images (Add up to 5 images to listing)
router.post('/:id/images', upload.array('images', 5), propertyController.uploadImages);

// GET /api/properties (fetch all property listings)
router.get('/', propertyController.getAll);

// GET /api/properties/search (find properties within a specific radius of a coordinate)
// Example: /api/properties/search?lng=-77.0364&lat=38.8951&radius=5
router.get('/search', propertyController.searchByRadius);

// GET /api/properties/:id (fetch a single property by its UUID)
router.get('/:id', propertyController.getById);

export default router;