const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


// 1. Optimized Connection Pool Configuration (Adjusted for real-world network latency)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                       // Reduced slightly to protect free tier caps
    idleTimeoutMillis: 30000,      // Keep clients open longer (30s) to avoid reconnecting
    connectionTimeoutMillis: 10000, // Increased to 10 seconds to allow for network lag
    ssl: { rejectUnauthorized: false }
});
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET'],
    allowedHeaders: ['Content-Type']
}));

// Main Endpoint: High-Speed Browsing API
app.get('/api/products', async (req, res) => {
    // 2. Early Fail-Safe Validation
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100); // Caps maximum limit at 100 to prevent scraping abuse
    const { category, cursor } = req.query;

    let queryText = 'SELECT id, name, category, price, created_at FROM products';
    const queryParams = [];
    const whereClauses = [];

    // 3. Optimized Dynamic Query Generation
    if (category) {
        queryParams.push(category);
        whereClauses.push(`category = $${queryParams.length}`);
    }

    if (cursor) {
        try {
            // Decode base64 cursor cleanly
            const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
            const [cursorCreatedAt, cursorId] = decodedCursor.split('|');

            if (!cursorCreatedAt || !cursorId) {
                return res.status(400).json({ success: false, error: 'Malformed pagination token.' });
            }

            queryParams.push(cursorCreatedAt, parseInt(cursorId, 10));
            whereClauses.push(`(created_at, id) < ($${queryParams.length - 1}, $${queryParams.length})`);
        } catch (e) {
            return res.status(400).json({ success: false, error: 'Invalid pagination token format.' });
        }
    }

    if (whereClauses.length > 0) {
        queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Exact match to our composite indexes: (category, created_at DESC, id DESC)
    queryText += ` ORDER BY created_at DESC, id DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    try {
        // 4. Using Named Prepared Statements for PostgreSQL Execution Plan Caching
        // Generating a deterministic name based on whether 'category' filter is active
        const statementName = category ? `fetch_filtered_limit_${limit}` : `fetch_global_limit_${limit}`;

        const { rows } = await pool.query({
            name: statementName,
            text: queryText,
            values: queryParams
        });

        // 5. High-Performance Cursor Compilation
        let nextCursor = null;
        if (rows.length === limit) {
            const lastItem = rows[rows.length - 1];
            // Convert Date object to raw ISO String without allocations
            const cursorString = `${lastItem.created_at.toISOString()}|${lastItem.id}`;
            nextCursor = Buffer.from(cursorString).toString('base64');
        }

        // Return exact minimal payload structure
        res.json({
            success: true,
            data: rows,
            meta: {
                count: rows.length,
                next_cursor: nextCursor
            }
        });

    } catch (error) {
        console.error('Optimized API Execution Error:', error.message);
        res.status(500).json({ success: false, error: 'Database resource error.' });
    }
});

// Health check endpoint (Useful when hosting on Render/Supabase)
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'healthy' });
    } catch (err) {
        res.status(500).json({ status: 'unhealthy', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Highly optimized server processing on port ${PORT}`);
});