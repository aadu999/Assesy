const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'assesy',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log("Connected to DB. Adding candidate_email column...");
        await client.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS candidate_email TEXT");
        console.log("Column added successfully.");
        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
