import { createPool } from "@neondatabase/serverless";

const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;
const pool = createPool({ connectionString });

export async function handler(event) {
  //logowanie w konsoli
  console.log("Otrzymano body:", event.body);

  try {
    if (event.httpMethod !== "POST")
      return { statusCode: 405, body: "Method Not Allowed" };

    const d = JSON.parse(event.body);

    // Walidacja - jesli userId jest null, baza wyrzuci błąd
    if (!d.userId || d.userId === "anon") {
      console.error("Błąd: Brak userId w żądaniu");
    }

    const sql = `
      INSERT INTO rankings (user_id, username, date, steps_today)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, date) DO UPDATE
      SET username = COALESCE(EXCLUDED.username, rankings.username),
          steps_today = EXCLUDED.steps_today,
          created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const vals = [d.userId, d.username || "Anonim", d.date, d.stepsToday || 0];

    // Wykonanie zapytania
    const res = await pool.query(sql, vals);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, data: res.rows[0] }),
    };
  } catch (err) {
    console.error("Błąd krytyczny funkcji:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, stack: err.stack }),
    };
  }
}
