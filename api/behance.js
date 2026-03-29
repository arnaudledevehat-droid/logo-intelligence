module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const allLinks = new Set();
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore && offset <= 240) {
      const apiUrl = `https://www.behance.net/v2/users/${username}/projects?client_id=MCuCU308B0Y0ypns5oxbM9QhMFvUVoVg&offset=${offset}&limit=12&field=id,url,name`;

      const r = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.behance.net/' + username,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!r.ok) {
        const htmlUrl = `https://www.behance.net/${username}`;
        const hr = await fetch(htmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html',
          },
        });
        if (!hr.ok) break;
        const html = await hr.text();

        const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextDataMatch) {
          try {
            const nextData = JSON.parse(nextDataMatch[1]);
            const projects = nextData?.props?.pageProps?.profile?.activeSection?.projects?.items || [];
            projects.forEach(p => { if (p.url) allLinks.add(p.url.replace(/\/$/, '')); });
          } catch(e) {}
        }

        const matches = [...html.matchAll(/href="(https:\/\/www\.behance\.net\/gallery\/\d+\/[^"?#]+)"/g)];
        matches.forEach(m => allLinks.add(m[1].replace(/\/$/, '')));
        break;
      }

      const data = await r.json();
      const projects = data.projects || [];

      if (projects.length === 0) { hasMore = false; break; }

      projects.forEach(p => {
        if (p.url) allLinks.add(p.url.replace(/\/$/, ''));
      });

      hasMore = projects.length === 12;
      offset += 12;
      await new Promise(r => setTimeout(r, 200));
    }

    return res.status(200).json({ links: [...allLinks], total: allLinks.size });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
