import { createPool } from "@neondatabase/serverless";
const pool = createPool({ connectionString: process.env.NETLIFY_DATABASE_URL });

export async function handler(event) {
  try {
    const user = event.queryStringParameters?.user || null;
    const sql = user
      ? "SELECT * FROM activities WHERE user_id = $1 ORDER BY ts DESC LIMIT 200"
      : "SELECT * FROM activities ORDER BY ts DESC LIMIT 200";
    const res = await pool.query(sql, user ? [user] : []);
    return { statusCode: 200, body: JSON.stringify(res.rows) };
  } catch (err) {
    console.error("fetchActivities err", err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
