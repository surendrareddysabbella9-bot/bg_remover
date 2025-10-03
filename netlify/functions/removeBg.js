import fetch from "node-fetch";
import Busboy from "busboy";
import FormData from "form-data";

export async function handler(event) {
  return new Promise((resolve, reject) => {
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
        const form = new FormData();
        form.append("image_file", fileBuffer, { filename: "image.png" });
        form.append("size", "auto");

        const removeResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
          body: form,
        });

        if (!removeResponse.ok) {
          const errText = await removeResponse.text();
          resolve({
            statusCode: removeResponse.status,
            body: JSON.stringify({ error: "Remove.bg failed", details: errText }),
          });
          return;
        }

        const arrayBuffer = await removeResponse.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString("base64");

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processedImageUrl: `data:image/png;base64,${base64Image}` }),
        });
      } catch (err) {
        resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
      }
    });

    const body = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
    busboy.end(body);
  });
}
