import { createPool } from "@neondatabase/serverless";
const pool = createPool({ connectionString: process.env.NEON_DATABASE_URL });

export async function handler() {
  try {
    const res = await pool.query(
      "SELECT user_id, username, date, steps_today FROM rankings ORDER BY steps_today DESC LIMIT 50"
    );
    return { statusCode: 200, body: JSON.stringify(res.rows) };
  } catch (err) {
    console.error("getRanking err", err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
