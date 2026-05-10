const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const INDUSTRY_MAP = {
  'construction': 'Construction & BTP',
  'publishing': 'Culture & Médias',
  'printing': 'Culture & Médias',
  'design': 'Architecture & Design',
  'design studio': 'Architecture & Design',
  'banking': 'Finance & Banque',
  'bank': 'Finance & Banque',
  'finance': 'Finance & Banque',
  'real estate': 'Immobilier',
  'furniture': 'Retail & Grande distribution',
  'education': 'Éducation & Formation',
  'hotel': 'Tourisme & Hôtellerie',
  'electronics': 'Technologie & SaaS',
  'textiles': 'Mode & Textile',
  'architecture': 'Architecture & Design',
  'transport': 'Mobilité & Transport',
  'manufacturing': 'Industrie & Manufacture',
  'healthcare': 'Santé & Médical',
  'pharmaceuticals': 'Pharmacie & Biotech',
  'food': 'Alimentation & Boisson',
  'association': 'ONG & Association',
  'chemicals': 'Industrie & Manufacture',
  'retail': 'Retail & Grande distribution',
  'hospital': 'Santé & Médical',
  'insurance': 'Assurance',
  'engineering': 'Industrie & Manufacture',
  'sport': 'Sport',
  'energy': 'Énergie & Utilities',
  'music': 'Culture & Médias',
  'advertising': 'Architecture & Design',
  'art': 'Culture & Médias',
  'paper': 'Industrie & Manufacture',
  'broadcasting': 'Culture & Médias',
  'theatre': 'Culture & Médias',
  'museum': 'Culture & Médias',
  'airline': 'Mobilité & Transport',
  'photography': 'Culture & Médias',
  'government': 'Institutionnel & Public',
  'charity': 'ONG & Association',
  'telecommunications': 'Télécommunications',
  'technology': 'Technologie & SaaS',
  'software': 'Technologie & SaaS',
  'luxury': 'Luxe & Prestige',
  'fashion': 'Mode & Textile',
  'beauty': 'Bien-être & Beauté',
  'agriculture': 'Agriculture & Terroir',
  'wine': 'Agriculture & Terroir',
  'restaurant': 'Restauration',
  'media': 'Culture & Médias',
  'film': 'Culture & Médias',
  'accounting': 'Conseil & Management',
  'consulting': 'Conseil & Management',
  'legal': 'Droit & Juridique',
  'law': 'Droit & Juridique',
  'travel': 'Tourisme & Hôtellerie',
  'tourism': 'Tourisme & Hôtellerie',
  'interior design': 'Architecture & Design',
  'nonprofit': 'ONG & Association',
  'non-profit': 'ONG & Association',
};

function mapIndustry(ind) {
  if (!ind) return null;
  const parts = ind.toLowerCase().split(',');
  for (const part of parts) {
    const p = part.trim();
    for (const [key, val] of Object.entries(INDUSTRY_MAP)) {
      if (p.includes(key)) return val;
    }
  }
  return null;
}

function svgToDataUrl(svg) {
  if (!svg) return null;
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { logos, offset = 0 } = req.body;
  if (!logos || !Array.isArray(logos)) return res.status(400).json({ error: 'logos array required' });

  const batch = logos.slice(offset, offset + 50);
  if (batch.length === 0) return res.status(200).json({ done: true, total: offset });

  const rows = batch.map(l => ({
    name: l.client || 'Unknown',
    brief: [
      mapIndustry(l.industry),
      ...(l.letters || []).map(lt => 'Lettre initiale : ' + lt),
    ].filter(Boolean),
    graphic: [
      ...(l.tags || []),
      l.country ? 'Pays: ' + l.country : null,
    ].filter(Boolean),
    description: [l.designers?.join(', '), l.industry, l.year].filter(Boolean).join(' — '),
    image_url: svgToDataUrl(l.svg),
    source_url: 'https://www.logo-archive.org/?item=' + l.slug,
    created_at: l.year ? `${l.year}-01-01` : new Date().toISOString(),
  }));

  // Upsert par source_url pour éviter les doublons
  const r = await fetch(SUPABASE_URL + '/rest/v1/logos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(rows),
  });

  if (!r.ok) {
    const err = await r.text();
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({
    done: false,
    inserted: batch.length,
    next_offset: offset + batch.length,
    total_processed: offset + batch.length,
    total_logos: logos.length,
  });
};
