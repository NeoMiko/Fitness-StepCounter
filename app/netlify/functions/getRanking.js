const { neon } = require("@neondatabase/serverless");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const sql = neon(`${process.env.NETLIFY_DATABASE_URL}?sslmode=require`);

    const today = new Date().toISOString().split("T")[0];

    // Pobieranie top 10 wyników
    const rows = await sql`
      SELECT username, steps_today 
      FROM rankings 
      WHERE date = ${today}
      ORDER BY steps_today DESC 
      LIMIT 10
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error("Database error w getRanking:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Błąd bazy danych: " + error.message }),
    };
  }
};
