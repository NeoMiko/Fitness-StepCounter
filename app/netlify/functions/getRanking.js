import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export const handler = async (event) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const rows = await sql`
      SELECT username, steps_today 
      FROM rankings 
      WHERE date = ${today}
      ORDER BY steps_today DESC 
      LIMIT 10
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Błąd bazy danych: " + error.message }),
    };
  }
};
