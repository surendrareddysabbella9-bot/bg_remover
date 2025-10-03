// api/removeBg.js  (Vercel Serverless function)
export const config = { runtime: 'nodejs18.x' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) throw new Error('No image provided');

    const buffer = Buffer.from(imageBase64, 'base64');

    // Use native FormData from node-fetch (v3+) or Web API in Node 18+
    const formData = new FormData();
    formData.append('image_file', buffer, 'image.png');
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': process.env.REMOVE_BG_KEY },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.status(200).json({ processedImageUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
