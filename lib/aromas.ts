// Roue des arômes (reprise de la v1).
export const AROMAS: { id: string; label: string; color: string; groups: { label: string; items: string[] }[] }[] = [
  {
    id: 'fruite',
    label: 'Fruité',
    color: '#DC2626',
    groups: [
      { label: 'Agrumes', items: ['Citron', 'Pamplemousse', 'Orange', 'Mandarine', 'Zeste'] },
      { label: 'Fruits rouges', items: ['Fraise', 'Framboise', 'Groseille', 'Cerise', 'Cassis'] },
      { label: 'Fruits noirs', items: ['Mûre', 'Myrtille', 'Prune', 'Pruneau'] },
      { label: 'Fruits à noyau', items: ['Pêche', 'Abricot', 'Nectarine'] },
      { label: 'Fruits exotiques', items: ['Ananas', 'Mangue', 'Litchi', 'Fruit de la passion', 'Banane'] },
      { label: 'Fruits secs', items: ['Figue séchée', 'Raisin sec', 'Amande', 'Noisette', 'Noix'] },
    ],
  },
  {
    id: 'floral',
    label: 'Floral',
    color: '#CA8A04',
    groups: [
      { label: 'Fleurs blanches', items: ['Acacia', 'Chèvrefeuille', 'Jasmin', "Fleur d'oranger"] },
      { label: 'Fleurs diverses', items: ['Rose', 'Violette', 'Pivoine', 'Iris', 'Lavande'] },
    ],
  },
  {
    id: 'vegetal',
    label: 'Végétal',
    color: '#65A30D',
    groups: [
      { label: 'Frais', items: ['Herbe coupée', 'Menthe', 'Fougère', 'Bourgeon de cassis', 'Poivron vert'] },
      { label: 'Sec / cuit', items: ['Foin', 'Tabac', 'Thé', 'Champignon', 'Sous-bois', 'Humus'] },
    ],
  },
  {
    id: 'epice',
    label: 'Épicé',
    color: '#EA580C',
    groups: [
      { label: 'Épices douces', items: ['Cannelle', 'Vanille', 'Clou de girofle', 'Muscade'] },
      { label: 'Épices fortes', items: ['Poivre noir', 'Poivre blanc', 'Réglisse', 'Anis'] },
    ],
  },
  {
    id: 'grille',
    label: 'Grillé',
    color: '#78350F',
    groups: [
      { label: 'Boisé', items: ['Chêne', 'Cèdre', 'Bois exotique', 'Pin'] },
      { label: 'Brûlé', items: ['Café', 'Cacao', 'Chocolat', 'Pain grillé', 'Caramel', 'Fumé'] },
    ],
  },
  {
    id: 'mineral',
    label: 'Minéral',
    color: '#64748B',
    groups: [
      { label: 'Pierre', items: ['Silex', 'Craie', 'Pierre à fusil', 'Graphite'] },
      { label: 'Autre', items: ['Iode', 'Pétrole'] },
    ],
  },
  {
    id: 'animal',
    label: 'Animal',
    color: '#78716C',
    groups: [
      { label: 'Cuir', items: ['Cuir frais', 'Cuir vieux'] },
      { label: 'Gibier', items: ['Fourrure', 'Musc', 'Viande'] },
    ],
  },
  {
    id: 'lactique',
    label: 'Lactique',
    color: '#B45309',
    groups: [
      { label: 'Produits laitiers', items: ['Beurre', 'Crème', 'Lait', 'Yaourt'] },
      { label: 'Fermentaire', items: ['Levure', 'Mie de pain', 'Brioche'] },
    ],
  },
];
