import fetch from "node-fetch";
import FormData from "form-data";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { body, isBase64Encoded } = event;
    if (!body) return { statusCode: 400, body: "No file uploaded" };

    // Convert incoming file to buffer
    const fileBuffer = Buffer.from(body, isBase64Encoded ? "base64" : "utf8");

    const formData = new FormData();
    formData.append("image_file", fileBuffer, { filename: "image.png" });
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      return { statusCode: response.status, body: text };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processedImageUrl: `data:image/png;base64,${base64}` }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
