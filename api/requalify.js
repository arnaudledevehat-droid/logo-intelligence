const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Mapping LogoArchive tags → nos dimensions
const TAG_LOOKUP = {
  // Construction
  'Single Letters': ['construction','Monogramme'],
  'Two Letters':    ['construction','Monogramme'],
  'Three Letters':  ['construction','Monogramme'],
  'Monograms':      ['construction','Monogramme'],
  'Ligatures':      ['construction','Monogramme'],
  // Forme
  'Circle':   ['forme','Cercle'],    'Ring':      ['forme','Cercle'],
  'Oval':     ['forme','Ellipse'],   'Square':    ['forme','Carré'],
  'Rectangle':['forme','Carré'],     'Triangle':  ['forme','Triangle'],
  'Diamond':  ['forme','Polygone'],  'Hexagon':   ['forme','Polygone'],
  'Polygon':  ['forme','Polygone'],  'Cross':     ['forme','Croix'],
  'Star':     ['forme','Étoile'],    'Stars':     ['forme','Étoile'],
  'Spiral':   ['forme','Spirale'],   'Curve':     ['forme','Organique'],
  'Arrows':   ['forme','Flèche'],    'Diagonal':  ['forme','Géométrique'],
  // Énergie
  'Static':        ['energie','Statique'],
  'Dynamic':       ['energie','Dynamique'],
  'Open':          ['energie','Ouvert'],
  'Closed':        ['energie','Fermé'],
  'Symmetrical':   ['energie','Symétrique'],
  'Asymmetrical':  ['energie','Asymétrique'],
  // Technique
  'Negative Space': ['technique','Espace négatif'],
  'Reflection':     ['technique','Miroir'],
  'Rotation':       ['technique','Rotation'],
  'Repetition':     ['technique','Répétition'],
  'Tessellation':   ['technique','Répétition'],
  'Pattern':        ['technique','Répétition'],
  'Modular':        ['technique','Modulaire'],
  'Quadrant':       ['technique','Modulaire'],
  'Proximity':      ['technique','Modulaire'],
  'Concentric':     ['technique','Concentrique'],
  'Overlap':        ['technique','Superposition'],
  'Compounding':    ['technique','Superposition'],
  'Stacking':       ['technique','Superposition'],
  'Layers':         ['technique','Superposition'],
  'Lines':          ['technique','Linéaire'],
  'Structural':     ['technique','Linéaire'],
  'Outline':        ['technique','Contour'],
  'Inline':         ['technique','Contour'],
  'Dots':           ['technique','Points'],
  'Solid':          ['technique','Plein'],
  'Spatial':        ['technique','Volume'],
  'Shadow':         ['technique','Volume'],
  'Illusory Contours': ['technique','Espace négatif'],
  'Impossible Forms':  ['technique','Espace négatif'],
  'Partial Forms':     ['technique','Espace négatif'],
  'Half Circle-Out':   ['technique','Espace négatif'],
  'Transition':        ['technique','Dégradé'],
  // Référent
  'Figurative': ['referent','Figuratif'],
  'Animals':    ['referent','Animal'],
  'Bird':       ['referent','Oiseau'],
  'Fish':       ['referent','Poisson'],
  'Snake':      ['referent','Reptile'],
  'Elephant':   ['referent','Animal'],
  'Person':     ['referent','Humain'],
  'People':     ['referent','Humain'],
  'Face':       ['referent','Humain'],
  'Heads':      ['referent','Humain'],
  'Hands':      ['referent','Humain'],
  'Eye':        ['referent','Humain'],
  'Community':  ['referent','Humain'],
  'Family':     ['referent','Humain'],
  'Trees':      ['referent','Nature'],
  'Leaf':       ['referent','Nature'],
  'Plant':      ['referent','Nature'],
  'Flowers':    ['referent','Nature'],
  'Mountains':  ['referent','Nature'],
  'Waves':      ['referent','Nature'],
  'Water':      ['referent','Nature'],
  'Sun':        ['referent','Astre'],
  'Snowflake':  ['referent','Astre'],
  'Fire':       ['referent','Élément'],
  'Flame':      ['referent','Élément'],
  'Lightning':  ['referent','Élément'],
  'Heart':      ['referent','Symbole'],
  'Crown':      ['referent','Symbole'],
  'Globe':      ['referent','Territoire'],
  'Globes':     ['referent','Territoire'],
  'House':      ['referent','Architecture'],
  'Homes':      ['referent','Architecture'],
  'Building':   ['referent','Architecture'],
  'Ball':       ['referent','Objet'],
  'Narrative':  ['referent','Figuratif'],
};

const INDUSTRY_MAP = {
  'banking': 'Finance & Banque', 'bank': 'Finance & Banque', 'finance': 'Finance & Banque',
  'insurance': 'Assurance', 'real estate': 'Immobilier',
  'consulting': 'Conseil & Management', 'accounting': 'Conseil & Management',
  'legal': 'Droit & Juridique', 'law': 'Droit & Juridique',
  'retail': 'Retail & Grande distribution', 'furniture': 'Retail & Grande distribution',
  'luxury': 'Luxe & Prestige', 'fashion': 'Mode & Textile', 'textiles': 'Mode & Textile',
  'food': 'Alimentation & Boisson', 'restaurant': 'Restauration', 'wine': 'Agriculture & Terroir',
  'technology': 'Technologie & SaaS', 'software': 'Technologie & SaaS', 'electronics': 'Technologie & SaaS',
  'telecommunications': 'Télécommunications',
  'healthcare': 'Santé & Médical', 'hospital': 'Santé & Médical', 'medical': 'Santé & Médical',
  'pharmaceuticals': 'Pharmacie & Biotech',
  'beauty': 'Bien-être & Beauté',
  'energy': 'Énergie & Utilities',
  'manufacturing': 'Industrie & Manufacture', 'chemicals': 'Industrie & Manufacture', 'paper': 'Industrie & Manufacture',
  'construction': 'Construction & BTP',
  'transport': 'Mobilité & Transport', 'airline': 'Mobilité & Transport',
  'culture': 'Culture & Médias', 'publishing': 'Culture & Médias', 'printing': 'Culture & Médias',
  'broadcasting': 'Culture & Médias', 'music': 'Culture & Médias', 'film': 'Culture & Médias',
  'media': 'Culture & Médias', 'art': 'Culture & Médias', 'photography': 'Culture & Médias',
  'theatre': 'Culture & Médias', 'museum': 'Culture & Médias',
  'sport': 'Sport',
  'hotel': 'Tourisme & Hôtellerie', 'tourism': 'Tourisme & Hôtellerie', 'travel': 'Tourisme & Hôtellerie',
  'education': 'Éducation & Formation',
  'government': 'Institutionnel & Public',
  'charity': 'ONG & Association', 'non-profit': 'ONG & Association', 'nonprofit': 'ONG & Association', 'association': 'ONG & Association',
  'agriculture': 'Agriculture & Terroir',
  'architecture': 'Architecture & Design', 'design': 'Architecture & Design',
  'advertising': 'Architecture & Design', 'engineering': 'Industrie & Manufacture',
  'drilling': 'Industrie & Manufacture',
};

function mapIndustry(ind) {
  if (!ind) return null;
  const lower = ind.toLowerCase();
  for (const [key, val] of Object.entries(INDUSTRY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function requalifyLogoArchiveTags(tags) {
  const dims = { construction: new Set(), forme: new Set(), energie: new Set(), technique: new Set(), referent: new Set() };
  for (const tag of (tags || [])) {
    const mapped = TAG_LOOKUP[tag];
    if (mapped) dims[mapped[0]].add(mapped[1]);
  }
  if (dims.construction.size === 0) dims.construction.add('Symbole seul');
  return dims;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { offset = 0, batch_size = 100 } = req.body || {};

  try {
    // Récupérer les logos LogoArchive (identifiés par source_url)
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/logos?select=id,name,brief,graphic,source_url,description&source_url=like.%25logo-archive.org%25&limit=${batch_size}&offset=${offset}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    const logos = await r.json();
    if (!logos || logos.length === 0) return res.status(200).json({ done: true, processed: 0 });

    let updated = 0;
    for (const logo of logos) {
      // Extraire les tags originaux LogoArchive depuis graphic
      const originalTags = (logo.graphic || []);
      const dims = requalifyLogoArchiveTags(originalTags);

      // Construire le nouveau graphic structuré
      const newGraphic = [
        ...[...dims.construction].map(v => 'Construction: ' + v),
        ...[...dims.forme].map(v => 'Forme: ' + v),
        ...[...dims.energie].map(v => 'Énergie: ' + v),
        ...[...dims.technique].map(v => 'Technique: ' + v),
        ...[...dims.referent].map(v => 'Référent: ' + v),
      ];

      // Extraire le secteur depuis brief ou description
      const currentBrief = logo.brief || [];
      const secteur = mapIndustry(logo.description || '');
      const newBrief = secteur
        ? [secteur, ...currentBrief.filter(b => !b.includes('Lettre initiale'))]
        : currentBrief;
      // Garder la lettre
      const lettre = currentBrief.find(b => b.startsWith('Lettre initiale'));
      if (lettre && !newBrief.includes(lettre)) newBrief.push(lettre);

      const upd = await fetch(
        `${SUPABASE_URL}/rest/v1/logos?id=eq.${logo.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
          },
          body: JSON.stringify({ graphic: newGraphic, brief: newBrief }),
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
