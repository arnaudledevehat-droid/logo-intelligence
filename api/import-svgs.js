const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { batch } = req.body;
  if (!batch || !Array.isArray(batch)) return res.status(400).json({ error: 'batch array required' });

  let ok = 0, errors = 0;

  for (const item of batch) {
    if (!item.slug || !item.svg) continue;

    const imageUrl = 'data:image/svg+xml;base64,' + Buffer.from(item.svg).toString('base64');
    const sourceUrl = 'https://www.logo-archive.org/?item=' + item.slug;

    const r = await fetch(
      SUPABASE_URL + '/rest/v1/logos?source_url=eq.' + encodeURIComponent(sourceUrl),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      }
    );

    if (r.ok) ok++; else errors++;
  }

  return res.status(200).json({ ok, errors, processed: batch.length });
};
