const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const VOYAGE_KEY   = process.env.VOYAGE_API_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Récupérer les logos sans embedding (embedding IS NULL)
    const { offset = 0, batch_size = 20 } = req.body || {};

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/logos?select=id,name,brief,graphic,description&embedding=is.null&limit=${batch_size}&offset=${offset}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    const logos = await r.json();

    if (!logos || logos.length === 0) {
      return res.status(200).json({ done: true, processed: 0 });
    }

    // 2. Construire les textes pour Voyage
    const texts = logos.map(l => {
      const parts = [
        l.name || '',
        ...(Array.isArray(l.brief)   ? l.brief   : []),
        ...(Array.isArray(l.graphic) ? l.graphic  : []),
        l.description || '',
      ].filter(Boolean);
      return parts.join(', ') || l.name || 'logo';
    });

    // 3. Appeler Voyage AI
    const embedResp = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + VOYAGE_KEY,
      },
      body: JSON.stringify({ input: texts, model: 'voyage-3-lite', input_type: 'document' }),
    });
    const embedData = await embedResp.json();
    if (!embedResp.ok) throw new Error(embedData.detail || 'Voyage error');

    // 4. Mettre à jour chaque logo avec son embedding
    const embeddings = embedData.data.map(e => e.embedding);
    let updated = 0;

    for (let i = 0; i < logos.length; i++) {
      const upd = await fetch(
        `${SUPABASE_URL}/rest/v1/logos?id=eq.${logos[i].id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
          },
          body: JSON.stringify({ embedding: embeddings[i] }),
        }
      );
      if (upd.ok) updated++;
    }

    return res.status(200).json({
      done: logos.length < batch_size,
      processed: logos.length,
      updated,
      next_offset: offset + logos.length,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
