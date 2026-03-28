export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { embedding, match_threshold = 0.3, match_count = 20 } = req.body;
  if (!embedding || !Array.isArray(embedding)) {
    return res.status(400).json({ error: 'embedding array required' });
  }

  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const r = await fetch(SUPA_URL + '/rest/v1/rpc/match_logos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_threshold,
        match_count,
      }),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e.message || 'Supabase error ' + r.status });
    }

    const results = await r.json();
    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
