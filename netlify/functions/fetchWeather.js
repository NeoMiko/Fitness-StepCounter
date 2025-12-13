export async function handler(event) {
  try {
    const lat = event.queryStringParameters?.lat;
    const lon = event.queryStringParameters?.lon;

    if (!lat || !lon) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing lat/lon" }),
      };
    }

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}&current_weather=true`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Weather error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
}
