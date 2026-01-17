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
    const connectionString = `${process.env.NETLIFY_DATABASE_URL}?sslmode=require`;

    const pool = new Pool({ connectionString });

    const user = event.queryStringParameters?.user || null;

    const sql = user
      ? "SELECT * FROM activities WHERE user_id = $1 ORDER BY ts DESC LIMIT 200"
      : "SELECT * FROM activities ORDER BY ts DESC LIMIT 200";

    const res = await pool.query(sql, user ? [user] : []);

    await pool.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(res.rows),
    };
  } catch (err) {
    console.error("fetchActivities error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Błąd bazy danych", details: err.message }),
    };
  }
};
