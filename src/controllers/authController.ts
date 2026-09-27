import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { db } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_development_key';

export const authController = {
    // POST /api/auth/register
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            console.log(`REQUEST BODY: ${req.body}`);
            const { first_name, last_name, email, password } = req.body;

            // Check if user already exists
            const existingAgent = await db.query('SELECT * FROM agents WHERE email = $1', [email]);
            if (existingAgent.rows.length > 0) {
                res.status(400).json({ message: 'Email already in use.' });
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insert into the DB
            const query = `
                INSERT INTO agents (first_name, last_name, email, password_hash)
                VALUES ($1, $2, $3, $4) RETURNING id, first_name, email;
            `;
            const result = await db.query(query, [first_name, last_name, email, password_hash]);

            // Generate JWT
            const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET, { expiresIn: '1d' })

            res.status(201).json({message: 'Agent created successfully.', agent: result.rows[0]});
        } catch (error) {
            next(error);
        }
    },

    // POST /api/auth/login (Authenticates an agent and returns a JWT)
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            // Find the agent by email
            const result = await db.query('SELECT * FROM agents WHERE email = $1', [email]);
            const agent = result.rows[0];

            if (!agent || !agent.password_hash) {
                res.status(401).json({ error: 'Invalid credentials.' });
                return;
            }

            // Compare the provided password with the stored hash
            const isMatch = await bcrypt.compare(password, agent.password_hash);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid credentials.' });
                return;
            }

            // Generate the JWT (expires in 1 day)
            const token = jwt.sign(
                {id: agent.id, email: agent.email},
                JWT_SECRET,
                {expiresIn: '1d'}
            );

            // Send the token to the client
            res.status(200).json({
                message: 'Login successful',
                token,
                agent_id: agent.id
            });
        } catch (error) {
            next(error);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.status(200).json({ message: "Logged out successfully." });
    }
};