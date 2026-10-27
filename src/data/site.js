// Facts and visitor copy, from the kit (docs/conteudo-fr-FR.md, site/content.js,
// docs/fontes-e-origem.md). No phone, prices, hours or ratings: none are confirmed.
export const site = {
  name: 'La Dépendance',
  tagline: 'Ongles & Regard',
  url: 'https://la-dependance-pontchateau.vercel.app/', // TODO(dependance): final domain → canonical/og:url, then drop noindex
  booking: 'https://www.planity.com/la-dependance-beaute-du-regard-44160-pontchateau',
  instagram: {
    handle: '@ladependance_beauteduregard',
    url: 'https://www.instagram.com/ladependance_beauteduregard/',
  },
  address: {
    venue: 'La Maison B',
    street: '22 Grande Rue',
    postcode: '44160',
    city: 'Pontchâteau',
    // TODO(dependance): Google place link (cid) once the listing is confirmed; address search until then
    maps: 'https://www.google.com/maps/search/?api=1&query=La+Maison+B+22+Grande+Rue+44160+Pontch%C3%A2teau',
  },
  // TODO(dependance): service list and wording to confirm with the institute (prices stay on Planity)
  services: {
    ongles: {
      tab: 'Ongles',
      title: 'Beauté des ongles',
      description: 'Une forme, une couleur, un détail. Découvrez les possibilités de l’onglerie et choisissez votre prestation avec l’institut.',
      items: ['Manucure et beauté des mains', 'Gainage sur ongles naturels', 'Rallongement et remplissage', 'Vernis semi-permanent', 'Nail art', 'Dépose et entretien'],
    },
    regard: {
      tab: 'Regard',
      title: 'Beauté du regard',
      description: 'Souligner une ligne, accompagner vos traits et choisir l’intensité qui vous ressemble.',
      items: ['Microshading des sourcils', 'Browlift et teinture', 'Rehaussement de cils', 'Teinture de cils', 'Épilation des sourcils'],
    },
    maquillage: {
      tab: 'Maquillage semi-permanent',
      title: 'Maquillage semi-permanent',
      description: 'Explorez les prestations proposées pour les sourcils, les lèvres et le regard. Les informations détaillées sont disponibles auprès de l’institut et sur Planity.',
      items: ['Sourcils — shading', 'Lèvres — Candylips', 'Regard — ras de cils', 'Retouches et entretien'],
    },
  },
  gallery: [
    { image: 'galerie-fuchsia', caption: 'Nail art floral fuchsia.' },
    { image: 'galerie-bleu-jaune', caption: 'French colorée, rayures et petites fleurs.' },
    { image: 'galerie-fraises', caption: 'Détails fruités et couleurs délicates.' },
    { image: 'galerie-regard', caption: 'Un regard dessiné avec attention.' },
  ],
};
