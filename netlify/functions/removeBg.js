export async function handler(event) {
  try {
    const formData = await event.body;
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "API request failed" }),
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
      body: Buffer.from(arrayBuffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
