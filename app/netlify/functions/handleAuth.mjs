const { neon } = require("@neondatabase/serverless");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let username;
  try {
    const body = JSON.parse(event.body);
    username = body.username;
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Invalid JSON body." }),
    };
  }

  if (!username || username.length < 3) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "Nazwa użytkownika jest za krótka.",
      }),
    };
  }

  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    let result =
      await sql`SELECT user_id, username FROM users WHERE username = ${username}`;

    let userId;

    if (result.length > 0) {
      userId = result[0].user_id;
    } else {
      const newId = `usr_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      await sql`INSERT INTO users (user_id, username) VALUES (${newId}, ${username})`;
      userId = newId;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        userId: userId,
        username: username,
      }),
    };
  } catch (error) {
    console.error("Błąd bazy danych w handleAuth:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        message: "Wewnętrzny błąd serwera/bazy danych.",
      }),
    };
  }
};
