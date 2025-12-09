
import { sql } from '@vercel/postgres';
// Helper pour initialiser la DB si elle n'existe pas
export async function ensureDB() {
    await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, avatar TEXT, created_at BIGINT);`;
    await sql`CREATE TABLE IF NOT EXISTS reports (id SERIAL PRIMARY KEY, target_id TEXT, reporter_id TEXT, reason TEXT, proofs TEXT, timestamp BIGINT);`;
}
