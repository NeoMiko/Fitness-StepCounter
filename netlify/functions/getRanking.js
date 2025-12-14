const { Client } = require("pg");

exports.handler = async () => {
  const today = new Date().toISOString().split("T")[0];

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
  });

  try {
    await client.connect();
    const query = `
            SELECT
                u.user_id,
                u.username,
                ds.steps AS steps_today
            FROM 
                users u
            LEFT JOIN 
                daily_steps ds 
                ON u.user_id = ds.user_id AND ds.date = $1
            ORDER BY
                steps_today DESC NULLS LAST, u.username ASC
        `;

    const result = await client.query(query, [today]);
    await client.end();

    const rankingData = result.rows.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      steps_today: row.steps_today || 0,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rankingData),
    };
  } catch (error) {
    await client.end();
    console.error("Błąd bazy danych w getRanking:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Nie udało się pobrać rankingu." }),
    };
  }
};
