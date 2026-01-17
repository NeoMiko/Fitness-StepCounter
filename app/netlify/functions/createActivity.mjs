import { createPool } from "@neondatabase/serverless";

const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;
const pool = createPool({ connectionString });

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
      parseInt(data.ts) || Date.now(),
      parseInt(data.steps) || 0,
      parseFloat(data.distance) || null,
      parseFloat(data.pace) || null,
      data.weather ? JSON.stringify(data.weather) : null,
    ];

    const res = await pool.query(insertSQL, values);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, inserted: res.rows[0] }),
    };
  } catch (err) {
    console.error("createActivity error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
