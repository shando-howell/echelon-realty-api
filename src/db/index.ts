import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
});

export const db = {
    /**
     * Executes a DB query and returns strongly-typed results.
     */
    query: async <T extends QueryResultRow = any>(
        text: string,
        params?: any[]
    ): Promise<QueryResult<T>> => {
        const start = Date.now();
        const result = await pool.query<T>(text, params);
        const duration = Date.now() - start;

        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    },

    getClient: () => pool.connect(),
};