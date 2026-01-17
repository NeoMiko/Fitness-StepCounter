const { Pool } = require("@neondatabase/serverless");

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

    const data = JSON.parse(event.body);

    const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;
    const pool = new Pool({ connectionString });

    const insertSQL = `
      INSERT INTO activities (user_id, ts, steps, distance, pace, weather)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `;

    const values = [
      data.userId || "anon",
      parseInt(data.ts) || Date.now(),
      parseInt(data.steps) || 0,
      parseFloat(data.distance) || 0,
      parseFloat(data.pace) || 0,
      data.weather ? JSON.stringify(data.weather) : null,
    ];

    const res = await pool.query(insertSQL, values);

    await pool.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, inserted: res.rows[0] }),
    };
  } catch (err) {
    console.error("createActivity error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
