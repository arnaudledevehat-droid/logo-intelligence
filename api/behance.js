module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, debug: debugMode } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const debug = [];

  try {
    // Test API v2
    const apiUrl = `https://www.behance.net/v2/users/${username}/projects?client_id=MCuCU308B0Y0ypns5oxbM9QhMFvUVoVg&offset=0&limit=12`;
    const r1 = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    debug.push({ endpoint: 'v2 API', status: r1.status });

    if (r1.ok) {
      const d = await r1.json();
      const projects = d.projects || [];
      debug.push({ projects_found: projects.length, sample: projects.slice(0,2).map(p => p.url) });

      if (!debugMode && projects.length > 0) {
        const allLinks = new Set();
        projects.forEach(p => { if (p.url) allLinks.add(p.url.replace(/\/$/, '')); });
        let offset = 12;
        while (offset <= 240) {
          const r = await fetch(`https://www.behance.net/v2/users/${username}/projects?client_id=MCuCU308B0Y0ypns5oxbM9QhMFvUVoVg&offset=${offset}&limit=12`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
          });
          if (!r.ok) break;
          const data = await r.json();
          const batch = data.projects || [];
          if (batch.length === 0) break;
          batch.forEach(p => { if (p.url) allLinks.add(p.url.replace(/\/$/, '')); });
          if (batch.length < 12) break;
          offset += 12;
          await new Promise(r => setTimeout(r, 150));
        }
        return res.status(200).json({ links: [...allLinks], total: allLinks.size });
      }
    } else {
      const txt = await r1.text();
      debug.push({ v2_error: txt.slice(0, 300) });
    }

    // Fallback HTML
    const r2 = await fetch(`https://www.behance.net/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    debug.push({ endpoint: 'HTML', status: r2.status });

    if (r2.ok) {
      const html = await r2.text();
      debug.push({ html_length: html.length, has_next_data: html.includes('__NEXT_DATA__'), gallery_count: (html.match(/\/gallery\/\d+\//g)||[]).length });

      const allLinks = new Set();

      const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (m) {
        try {
          const nd = JSON.parse(m[1]);
          const items = nd?.props?.pageProps?.profile?.activeSection?.projects?.items
                     || nd?.props?.pageProps?.projects
                     || [];
          items.forEach(p => { if (p.url) allLinks.add(p.url.replace(/\/$/, '')); });
          debug.push({ next_data_projects: allLinks.size });
        } catch(e) { debug.push({ next_data_parse_error: e.message }); }
      }

      const galleryMatches = [...html.matchAll(/["'](https:\/\/www\.behance\.net\/gallery\/\d+\/[^"'?#\s]+)["']/g)];
      galleryMatches.forEach(gm => allLinks.add(gm[1].replace(/\/$/, '')));
      debug.push({ gallery_regex_links: allLinks.size });

      if (!debugMode && allLinks.size > 0) {
        return res.status(200).json({ links: [...allLinks], total: allLinks.size });
      }
    }

    return res.status(200).json({ debug, links: [], total: 0 });
  } catch(e) {
    return res.status(500).json({ error: e.message, debug });
  }
};
