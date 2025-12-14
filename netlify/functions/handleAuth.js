const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username } = JSON.parse(event.body);

  if (!username || username.length < 3) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "Nazwa użytkownika jest za krótka.",
      }),
    };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
  });

  try {
    await client.connect();

    let result = await client.query(
      "SELECT user_id, username FROM users WHERE username = $1",
      [username]
    );

    let userId;

    if (result.rows.length > 0) {
      userId = result.rows[0].user_id;
    } else {
      const newId = `usr_${crypto.randomUUID()}`;
      await client.query(
        "INSERT INTO users (user_id, username) VALUES ($1, $2)",
        [newId, username]
      );
      userId = newId;
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        userId: userId,
        username: username,
      }),
    };
  } catch (error) {
    await client.end();
    console.error("Błąd bazy danych w handleAuth:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Błąd serwera. Sprawdź logs Netlify.",
      }),
    };
  }
};
