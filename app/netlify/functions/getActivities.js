const { createPool } = require("@neondatabase/serverless");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  const userId = event.queryStringParameters?.userId || "anon";

  try {
    const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;
    const pool = createPool({ connectionString });

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
      headers,
      body: JSON.stringify(res.rows),
    };
  } catch (err) {
    console.error("Błąd pobierania aktywności:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
