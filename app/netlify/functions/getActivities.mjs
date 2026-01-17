import { createPool } from "@neondatabase/serverless";

const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;
const pool = createPool({ connectionString });

export async function handler(event) {
  const userId = event.queryStringParameters.userId || "anon";

  try {
    const sql = `
      SELECT id, ts, steps, distance, pace, weather 
      FROM activities 
      WHERE user_id = $1 
      ORDER BY ts DESC 
      LIMIT 30
    `;

    const res = await pool.query(sql, [userId]);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",

        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(res.rows),
    };
  } catch (err) {
    console.error("Błąd pobierania aktywności:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
