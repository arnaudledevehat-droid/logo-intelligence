module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const allLinks = new Set();
  let offset = 0;

  try {
    while (offset <= 96) {
      const url = 'https://www.behance.net/' + username + (offset > 0 ? '?offset=' + offset : '');

      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
        },
      });

      if (!r.ok) break;
      const html = await r.text();

      // Extraire les liens de projets /gallery/
      const matches = [...html.matchAll(/href=["']([^"']*\/gallery\/\d+\/[^"'?#]*?)["']/gi)];
      const before = allLinks.size;

      matches.forEach(m => {
        try {
          const u = new URL(m[1], 'https://www.behance.net');
          allLinks.add(u.origin + u.pathname.replace(/\/$/, ''));
        } catch(e) {}
      });

      // Aussi extraire depuis le JSON embarqué dans la page
      const jsonMatch = html.match(/"projects":\s*(\[[\s\S]{0,50000}?\])/);
      if (jsonMatch) {
        try {
          const projects = JSON.parse(jsonMatch[1]);
          projects.forEach(p => {
            if (p.url) allLinks.add(p.url.replace(/\/$/, ''));
          });
        } catch(e) {}
      }

      // Arrêter si aucun nouveau lien
      if (offset > 0 && allLinks.size === before) break;
      offset += 12;

      // Petite pause
      await new Promise(r => setTimeout(r, 300));
    }

    return res.status(200).json({ links: [...allLinks] });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
