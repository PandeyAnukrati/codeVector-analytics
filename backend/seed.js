const { Pool } = require('pg');
const format = require('pg-format');
require('dotenv').config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for secure hosted cloud DBs
});

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports', 'Beauty'];
const TOTAL_RECORDS = 200000;
const CHUNK_SIZE = 10000; // Batch size to optimize network payload sizes

async function seedDatabase() {
    const startTime = Date.now();
    console.log(`🚀 Starting high-performance seed of ${TOTAL_RECORDS} products...`);

    try {
        // Clean slate: clear old data and reset primary key counters
        await pool.query('TRUNCATE TABLE products RESTART IDENTITY;');
        console.log('🧹 Cleared existing tables.');

        let insertedCount = 0;
        const baseTime = new Date().getTime();

        while (insertedCount < TOTAL_RECORDS) {
            const values = [];

            for (let i = 0; i < CHUNK_SIZE; i++) {
                const currentId = insertedCount + i + 1;
                const name = `Product Premium ${currentId}`;
                const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
                const price = parseFloat((Math.random() * 450 + 4.99).toFixed(2));

                // Stagger timestamps backward cleanly so every single item has a deterministic order
                // This ensures the newest items sit cleanly at the top of the timeline
                const itemTime = new Date(baseTime - currentId * 1000);

                values.push([name, category, price, itemTime, itemTime]);
            }

            // Safely transform array matrix into raw SQL bulk tuples: 
            // INSERT INTO products (...) VALUES ('Name', 'Category', ...), ('Name2', 'Category2', ...)
            const bulkQuery = format(
                'INSERT INTO products (name, category, price, created_at, updated_at) VALUES %L',
                values
            );

            await pool.query(bulkQuery);
            insertedCount += CHUNK_SIZE;
            console.log(`📦 Progress: ${insertedCount}/${TOTAL_RECORDS} items written.`);
        }

        const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Database seeding successful! Added ${TOTAL_RECORDS} rows in ${totalSeconds}s.`);
    } catch (error) {
        console.error('❌ Critical error during execution:', error);
    } finally {
        // Terminate connection pool safely
        await pool.end();
    }
}

seedDatabase();