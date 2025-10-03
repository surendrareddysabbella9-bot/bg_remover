import fetch from "node-fetch";
import Busboy from "busboy";
import FormData from "form-data";
import { Blob } from "fetch-blob";

export async function handler(event) {
  return new Promise((resolve) => {
    if (event.httpMethod !== "POST") {
      resolve({ statusCode: 405, body: "Method Not Allowed" });
      return;
    }

    const busboy = new Busboy({ headers: event.headers });
    let fileBuffer = null;

    busboy.on("file", (fieldname, file) => {
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
    });

    busboy.on("finish", async () => {
      if (!fileBuffer) {
        resolve({ statusCode: 400, body: JSON.stringify({ error: "No file uploaded" }) });
        return;
      }

      try {
        const formData = new FormData();
        formData.append("image_file", new Blob([fileBuffer]), "image.png");
        formData.append("size", "auto");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
          body: formData
        });

        if (!response.ok) {
          const errText = await response.text();
          resolve({
            statusCode: response.status,
            body: JSON.stringify({ error: errText || "Failed to remove background" })
          });
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        resolve({
          statusCode: 200,
          body: JSON.stringify({ processedImageUrl: `data:image/png;base64,${base64}` })
        });
      } catch (err) {
        resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
      }
    });

    const body = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
    busboy.end(body);
  });
}
