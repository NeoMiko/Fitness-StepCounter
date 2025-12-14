const { neon } = require("@neondatabase/serverless");

exports.handler = async () => {
  const today = new Date().toISOString().split("T")[0];
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    const rankingData = await sql`
            SELECT
                u.user_id,
                u.username,
                COALESCE(ds.steps, 0) AS steps_today
            FROM 
                users u
            LEFT JOIN 
                daily_steps ds 
                ON u.user_id = ds.user_id AND ds.date = ${today}
            ORDER BY
                steps_today DESC NULLS LAST, u.username ASC
        `;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rankingData),
    };
  } catch (error) {
    console.error("Błąd bazy danych w getRanking:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Nie udało się pobrać rankingu." }),
    };
  }
};
