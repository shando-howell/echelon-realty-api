import express, { Request, Response,  NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import propertyRoutes from './routes/propertyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import listingsRoutes from './routes/listingsRoutes.js';

const app = express();

// Global Middleware
// CORS configuration: accept requests from client only
app.use(cors({
    origin: ['http://localhost:3001', 'https://echelon-realty-web.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json()); // Parse incoming JSON payloads
app.use(cookieParser());

// Mounted routes
app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/listings', listingsRoutes);

// Global Error (catches any errors passed to next() in the controllers)
// eslint-disable-next-line;
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
});

export default app;
