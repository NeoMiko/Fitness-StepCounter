import { createPool } from "@neondatabase/serverless";
const pool = createPool({ connectionString: process.env.NEON_DATABASE_URL });

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST")
      return { statusCode: 405, body: "Method Not Allowed" };
    const d = JSON.parse(event.body);
    const sql = `
      INSERT INTO rankings (user_id, username, date, steps_today)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, date) DO UPDATE
      SET username = EXCLUDED.username,
          steps_today = EXCLUDED.steps_today
      RETURNING *
    `;
    const vals = [d.userId, d.username || null, d.date, d.stepsToday || 0];
    const res = await pool.query(sql, vals);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, row: res.rows[0] }),
    };
  } catch (err) {
    console.error("updateRanking err", err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
