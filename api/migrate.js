export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  const VOYAGE_KEY = process.env.VOYAGE_API_KEY;

  try {
    const r = await fetch(SUPA_URL + '/rest/v1/logos?select=id,name,brief,graphic,description&embedding=is.null', {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY },
    });
    const logos = await r.json();

    if (!logos.length) return res.status(200).json({ message: 'Tous les logos ont déjà un embedding', updated: 0 });

    let updated = 0;
    const errors = [];

    for (const logo of logos) {
      try {
        const graphicText = (Array.isArray(logo.graphic) ? logo.graphic : JSON.parse(logo.graphic || '[]')).join(', ');
        const briefText = (Array.isArray(logo.brief) ? logo.brief : JSON.parse(logo.brief || '[]')).join(', ');
        const text = [logo.name, briefText ? 'Brief: ' + briefText : '', graphicText ? 'Graphique: ' + graphicText : '', logo.description || ''].filter(Boolean).join('. ');

        const er = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + VOYAGE_KEY },
          body: JSON.stringify({ model: 'voyage-3-lite', input: [text], input_type: 'document' }),
        });

        if (!er.ok) throw new Error('Voyage error ' + er.status);
        const ed = await er.json();
        const embedding = ed.data[0].embedding;

        const ur = await fetch(SUPA_URL + '/rest/v1/logos?id=eq.' + logo.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ embedding: JSON.stringify(embedding) }),
        });

        if (!ur.ok) throw new Error('Supabase patch error ' + ur.status);
        updated++;
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        errors.push({ id: logo.id, name: logo.name, error: e.message });
      }
    }

    return res.status(200).json({ updated, total: logos.length, errors });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
