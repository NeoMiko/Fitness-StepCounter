const { createPool } = require("@neondatabase/serverless");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    const d = JSON.parse(event.body);

    // Jeśli userId nie istnieje lub jest pusty, przypisujemy "anon"
    const finalUserId = d.userId && d.userId !== "" ? d.userId : "anon";

    const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;
    const pool = createPool({ connectionString });

    const sql = `
      INSERT INTO rankings (user_id, username, date, steps_today)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, date) DO UPDATE
      SET username = COALESCE(EXCLUDED.username, rankings.username),
          steps_today = EXCLUDED.steps_today,
          created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const vals = [
      finalUserId,
      d.username || "Anonim",
      d.date || new Date().toISOString().split("T")[0],
      parseInt(d.stepsToday) || 0,
    ];

    const res = await pool.query(sql, vals);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, data: res.rows[0] }),
    };
  } catch (err) {
    console.error("Błąd funkcji updateRanking:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
