import fetch from "node-fetch";
import Busboy from "busboy";

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
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
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

        const removeResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
          body: formData,
        });

        if (!removeResponse.ok) {
          resolve({
            statusCode: removeResponse.status,
            body: JSON.stringify({ error: "Failed to remove background" }),
          });
          return;
        }

        const arrayBuffer = await removeResponse.arrayBuffer();
        resolve({
          statusCode: 200,
          headers: { "Content-Type": "image/png" },
          body: Buffer.from(arrayBuffer).toString("base64"),
          isBase64Encoded: true,
        });
      } catch (err) {
        resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
      }
    });

    // Feed event body to busboy
    const body = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
    busboy.end(body);
  });
}
