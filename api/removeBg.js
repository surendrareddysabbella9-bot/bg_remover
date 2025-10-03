import fetch from "node-fetch";
import FormData from "form-data";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { imageBase64 } = JSON.parse(event.body);
    if (!imageBase64) throw new Error("No image provided");

    const buffer = Buffer.from(imageBase64, "base64");

    const formData = new FormData();
    formData.append("image_file", buffer, "image.png");
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errText }) };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({ processedImageUrl: `data:image/png;base64,${base64}` })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
