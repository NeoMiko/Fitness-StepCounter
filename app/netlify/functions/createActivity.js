import { createPool } from "@neondatabase/serverless";

const pool = createPool({ connectionString: process.env.NEON_DATABASE_URL });

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST")
      return { statusCode: 405, body: "Method Not Allowed" };
    const data = JSON.parse(event.body);

    const insertSQL = `
      INSERT INTO activities (user_id, ts, steps, distance, pace, weather)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `;
    const values = [
      data.userId || null,
      data.ts || Date.now(),
      data.steps || 0,
      typeof data.distance === "number" ? data.distance : null,
      typeof data.pace === "number" ? data.pace : null,
      data.weather ? JSON.stringify(data.weather) : null,
    ];

    const res = await pool.query(insertSQL, values);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, inserted: res.rows[0] }),
    };
  } catch (err) {
    console.error("createActivity error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
}
