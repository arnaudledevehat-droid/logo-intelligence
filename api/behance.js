module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const allLinks = new Set();

  try {
    // Behance charge 12 projets par page, on pagine via ?offset=
    // Mais le HTML contient tous les projets visibles au premier chargement (12 max)
    // Pour avoir tous les projets on doit paginer

    let offset = 0;
    while (offset <= 240) {
      const pageUrl = offset === 0
        ? `https://www.behance.net/${username}`
        : `https://www.behance.net/${username}?offset=${offset}`;

      const r = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'fetch',
        },
      });

      if (!r.ok) break;
      const html = await r.text();

      // Extraire href="/gallery/ID/slug" (liens relatifs dans le HTML)
      const before = allLinks.size;
      const matches = [...html.matchAll(/href="\/gallery\/(\d+)\/([^"?#]+)"/g)];
      matches.forEach(m => {
        allLinks.add(`https://www.behance.net/gallery/${m[1]}/${m[2]}`);
      });

      // Aussi chercher les URLs complètes encodées avec backslash
      const fullMatches = [...html.matchAll(/https:\\\/\\\/www\.behance\.net\\\/gallery\\\/(\d+)\\\/([^"'\\\s,]+)/g)];
      fullMatches.forEach(m => {
        allLinks.add(`https://www.behance.net/gallery/${m[1]}/${m[2]}`);
      });

      // Si aucun nouveau lien sur cette page, arrêter
      if (offset > 0 && allLinks.size === before) break;

      offset += 12;
      await new Promise(r => setTimeout(r, 400));
    }

    return res.status(200).json({ links: [...allLinks], total: allLinks.size });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
