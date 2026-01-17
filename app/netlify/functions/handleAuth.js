const { neon } = require("@neondatabase/serverless");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  let username;
  try {
    const body = JSON.parse(event.body);
    username = body.username;
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: "Invalid JSON body." }),
    };
  }

  if (!username || username.length < 3) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Nazwa użytkownika jest za krótka.",
      }),
    };
  }

  const sql = neon(`${process.env.NETLIFY_DATABASE_URL}?sslmode=require`);

  try {
    // Sprawdzanie czy użytkownik istnieje
    let result =
      await sql`SELECT user_id, username FROM users WHERE username = ${username}`;

    let userId;

    if (result.length > 0) {
      userId = result[0].user_id;
    } else {
      // Generowanie unikalnego ID
      const newId = `usr_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      await sql`INSERT INTO users (user_id, username) VALUES (${newId}, ${username})`;
      userId = newId;
    }

    return {
      statusCode: 200,
      headers,
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
      headers,
      body: JSON.stringify({
        success: false,
        message: "Wewnętrzny błąd serwera/bazy danych.",
        error: error.message,
      }),
    };
  }
};
