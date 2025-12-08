const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'postgres-db',
    database: 'assessy_db',
    password: 'password',
    port: 5432,
});

async function check() {
    try {
        const users = await pool.query("SELECT * FROM users");
        console.log("Users:", users.rows);

        const sessions = await pool.query("SELECT id, token, status, candidate_name FROM sessions ORDER BY created_at DESC LIMIT 5");
        console.log("Recent Sessions:", sessions.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
