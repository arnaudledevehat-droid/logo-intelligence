export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { texts, input_type = 'document' } = req.body;
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'texts array required' });
  }

  try {
    const r = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.VOYAGE_API_KEY,
      },
      body: JSON.stringify({
        model: 'voyage-3-lite',
        input: texts,
        input_type,
      }),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e.detail || 'Voyage API error ' + r.status });
    }

    const data = await r.json();
    const embeddings = data.data.map(d => d.embedding);
    return res.status(200).json({ embeddings });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
