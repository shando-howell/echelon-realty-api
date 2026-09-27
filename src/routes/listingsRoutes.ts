import { Router } from 'express';

import authenticateToken from '../middleware/authenticateToken.js';
import { listingsController } from '../controllers/listingsController.js';
import { upload } from '../utils/uploadConfig.js';

// Initialize router
const router = Router();

// Retrieve agent's listings
router.get('/my-listings', authenticateToken, listingsController.getListings);

// Update agent's listing
router.put('/my-listings/:id', authenticateToken, upload.array('newImages', 5), listingsController.updateListing);

// Delete agent's listing
router.delete('/my-listings/:id', authenticateToken, listingsController.deleteListing);

export default router