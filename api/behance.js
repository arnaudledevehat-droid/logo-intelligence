module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, debug: debugMode } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  try {
    const r = await fetch(`https://www.behance.net/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!r.ok) return res.status(200).json({ error: 'HTML fetch failed: ' + r.status, links: [], total: 0 });

    const html = await r.text();

    const allLinks = new Set();

    // Méthode 1 : URLs complètes Behance dans le JS inline
    const fullUrlMatches = [...html.matchAll(/https:\\?\/\\?\/www\.behance\.net\\?\/gallery\\?\/(\d+)\\?\/([^"'\\\s,>]+)/g)];
    fullUrlMatches.forEach(m => {
      const url = `https://www.behance.net/gallery/${m[1]}/${m[2].replace(/\\+/g, '')}`;
      allLinks.add(url);
    });

    // Méthode 2 : pattern "url":"...gallery..." dans JSON
    const jsonUrlMatches = [...html.matchAll(/"url"\s*:\s*"(https:\/\/www\.behance\.net\/gallery\/\d+\/[^"]+)"/g)];
    jsonUrlMatches.forEach(m => allLinks.add(m[1].replace(/\\\//g, '/').replace(/\/$/, '')));

    // Méthode 3 : "slug" + "id" pattern pour reconstruire l'URL
    const slugMatches = [...html.matchAll(/"id"\s*:\s*(\d+)\s*,\s*"(?:[^"]*)"[^}]*?"slug"\s*:\s*"([^"]+)"/g)];
    slugMatches.forEach(m => allLinks.add(`https://www.behance.net/gallery/${m[1]}/${m[2]}`));

    // Méthode 4 : chercher les IDs de projet et slugs séparément
    const projectIds = [...html.matchAll(/"project_id"\s*:\s*(\d+)/g)].map(m => m[1]);
    const projectSlugs = [...html.matchAll(/"slug"\s*:\s*"([a-z0-9-]+)"/g)].map(m => m[1]);

    if (debugMode) {
      return res.status(200).json({
        html_length: html.length,
        gallery_count_raw: (html.match(/\/gallery\/\d+\//g)||[]).length,
        method1: fullUrlMatches.length,
        method2: jsonUrlMatches.length,
        method3: slugMatches.length,
        project_ids_found: projectIds.length,
        project_slugs_found: projectSlugs.length,
        links_found: allLinks.size,
        sample: [...allLinks].slice(0, 5),
        // Extrait du HTML autour de "gallery"
        html_sample: (html.match(/.{0,100}gallery\/\d+.{0,100}/g)||[]).slice(0, 3),
      });
    }

    return res.status(200).json({ links: [...allLinks], total: allLinks.size });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
