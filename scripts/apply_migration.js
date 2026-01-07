const { readFileSync } = require('fs');
const { Client } = require('pg');

const sqlFile = process.argv[2] || 'supabase/migrations/20260107_create_competency_levels.sql';
const conn = process.argv[3] || process.env.DATABASE_URL;

if (!conn) {
  console.error('Usage: node apply_migration.js <sql-file> <DATABASE_URL>');
  process.exit(1);
}

(async () => {
  const sql = readFileSync(sqlFile, 'utf8');
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB, running migration...');
    await client.query(sql);
    console.log('Migration applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(2);
  } finally {
    try { await client.end(); } catch (e) {}
  }
})();
