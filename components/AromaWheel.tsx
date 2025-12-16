
import React, { useState, useMemo } from 'react';

interface AromaWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (aroma: string) => void;
}

// Structure de données hiérarchique des arômes
const AROMA_DATA = [
  {
    id: 'fruite',
    label: 'Fruité',
    color: '#dc2626', // Red-600
    children: [
      {
        label: 'Agrumes',
        children: ['Citron', 'Pamplemousse', 'Orange', 'Mandarine', 'Zeste']
      },
      {
        label: 'Fruits Rouges',
        children: ['Fraise', 'Framboise', 'Groseille', 'Cerise', 'Cassis']
      },
      {
        label: 'Fruits Noirs',
        children: ['Mûre', 'Myrtille', 'Prune', 'Pruneau']
      },
      {
        label: 'Fruits à Noyau',
        children: ['Pêche', 'Abricot', 'Nectarine']
      },
      {
        label: 'Fruits Exotiques',
        children: ['Ananas', 'Mangue', 'Litchi', 'Fruit de la passion', 'Banane']
      },
      {
        label: 'Fruits Secs',
        children: ['Figue séchée', 'Raisin sec', 'Amande', 'Noisette', 'Noix']
      }
    ]
  },
  {
    id: 'floral',
    label: 'Floral',
    color: '#facc15', // Yellow-400
    children: [
      {
        label: 'Fleurs Blanches',
        children: ['Acacia', 'Chèvrefeuille', 'Jasmin', 'Fleur d\'oranger']
      },
      {
        label: 'Fleurs Diverses',
        children: ['Rose', 'Violette', 'Pivoine', 'Iris', 'Lavande']
      }
    ]
  },
  {
    id: 'vegetal',
    label: 'Végétal',
    color: '#65a30d', // Lime-600
    children: [
      {
        label: 'Frais',
        children: ['Herbe coupée', 'Menthe', 'Fougère', 'Bourgeon de cassis', 'Poivron vert']
      },
      {
        label: 'Sec / Cuit',
        children: ['Foin', 'Tabac', 'Thé', 'Champignon', 'Sous-bois', 'Humus']
      }
    ]
  },
  {
    id: 'epice',
    label: 'Épicé',
    color: '#ea580c', // Orange-600
    children: [
      {
        label: 'Épices Douces',
        children: ['Cannelle', 'Vanille', 'Clou de girofle', 'Muscade']
      },
      {
        label: 'Épices Fortes',
        children: ['Poivre noir', 'Poivre blanc', 'Réglisse', 'Anis']
      }
    ]
  },
  {
    id: 'empyreumatique',
    label: 'Grillé', // Empyreumatique simplifié
    color: '#78350f', // Amber-900
    children: [
      {
        label: 'Boisé',
        children: ['Chêne', 'Cèdre', 'Bois exotique', 'Pin']
      },
      {
        label: 'Brûlé',
        children: ['Café', 'Cacao', 'Chocolat', 'Pain grillé', 'Caramel', 'Fumé']
      }
    ]
  },
  {
    id: 'mineral',
    label: 'Minéral',
    color: '#94a3b8', // Slate-400
    children: [
      {
        label: 'Pierre',
        children: ['Silex', 'Craie', 'Pierre à fusil', 'Graphite']
      },
      {
        label: 'Autre',
        children: ['Iode', 'Pétrole']
      }
    ]
  },
  {
    id: 'animal',
    label: 'Animal',
    color: '#a8a29e', // Stone-400
    children: [
      {
        label: 'Cuir',
        children: ['Cuir frais', 'Cuir vieux']
      },
      {
        label: 'Gibier',
        children: ['Fourrure', 'Musc', 'Viande']
      }
    ]
  },
  {
    id: 'lactique',
    label: 'Lactique',
    color: '#fef3c7', // Amber-100
    children: [
      {
        label: 'Produits laitiers',
        children: ['Beurre', 'Crème', 'Lait', 'Yaourt']
      },
      {
        label: 'Fermentaire',
        children: ['Levure', 'Mie de pain', 'Brioche']
      }
    ]
  }
];

// Helper pour calculer les chemins SVG des parts de gâteau
const calculateArc = (index: number, total: number, innerRadius: number, outerRadius: number) => {
  const anglePerSegment = (2 * Math.PI) / total;
  const startAngle = index * anglePerSegment - Math.PI / 2; // Start at top
  const endAngle = (index + 1) * anglePerSegment - Math.PI / 2;

  // Points coordinates
  const x1 = 50 + innerRadius * Math.cos(startAngle);
  const y1 = 50 + innerRadius * Math.sin(startAngle);
  const x2 = 50 + outerRadius * Math.cos(startAngle);
  const y2 = 50 + outerRadius * Math.sin(startAngle);
  const x3 = 50 + outerRadius * Math.cos(endAngle);
  const y3 = 50 + outerRadius * Math.sin(endAngle);
  const x4 = 50 + innerRadius * Math.cos(endAngle);
  const y4 = 50 + innerRadius * Math.sin(endAngle);

  // SVG Path command
  const largeArc = anglePerSegment > Math.PI ? 1 : 0;
  
  return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
};

// Helper pour positionner le texte au milieu d'un segment
const getLabelPosition = (index: number, total: number, radius: number) => {
  const anglePerSegment = (2 * Math.PI) / total;
  const angle = index * anglePerSegment - Math.PI / 2 + anglePerSegment / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
    rotation: (angle * 180) / Math.PI // Pour orienter le texte si besoin
  };
};

const AromaWheel: React.FC<AromaWheelProps> = ({ isOpen, onClose, onSelect }) => {
  const [history, setHistory] = useState<any[]>([]); // Stack de navigation
  const [currentLevelData, setCurrentLevelData] = useState<any[]>(AROMA_DATA);
  const [animating, setAnimating] = useState(false);

  // Détermine la couleur actuelle (celle du parent si on est dans un sous-niveau)
  const activeColor = useMemo(() => {
    if (history.length > 0) return history[0].color;
    return null;
  }, [history]);

  // Titre central
  const centerLabel = useMemo(() => {
    if (history.length === 0) return "FAMILLES";
    return history[history.length - 1].label.toUpperCase();
  }, [history]);

  const handleSegmentClick = (item: any) => {
    if (item.children) {
      // Navigation descendante (Drill down)
      setHistory([...history, item]);
      setCurrentLevelData(item.children);
    } else {
      // Feuille (Arome final)
      onSelect(typeof item === 'string' ? item : item.label);
      // Optionnel : on ne ferme pas tout de suite pour permettre multi-select ? 
      // Pour l'instant on reset
      handleBackToRoot(); 
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);

    if (newHistory.length === 0) {
      setCurrentLevelData(AROMA_DATA);
    } else {
      const parent = newHistory[newHistory.length - 1];
      setCurrentLevelData(parent.children || []);
    }
  };

  const handleBackToRoot = () => {
      setHistory([]);
      setCurrentLevelData(AROMA_DATA);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
      <div className="relative w-full max-w-md aspect-square bg-white rounded-full shadow-2xl overflow-hidden flex items-center justify-center animate-in zoom-in duration-300">
        
        {/* Bouton Fermer (Absolu en haut à droite du conteneur carré) */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200"
        >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        {/* SVG Wheel */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl select-none">
          {/* Segments */}
          {currentLevelData.map((item: any, index: number) => {
            const label = typeof item === 'string' ? item : item.label;
            const color = activeColor || item.color || '#e5e7eb';
            const total = currentLevelData.length;
            
            // Calculer la couleur : si on est dans un sous-niveau, on varie légèrement la teinte
            // ou on utilise la couleur parent. Ici on garde la couleur parent pour l'immersion.
            // Pour distinguer les segments, on ajoute une bordure blanche via stroke.
            
            const pos = getLabelPosition(index, total, 35); // Position du texte

            return (
              <g 
                key={index} 
                onClick={() => handleSegmentClick(item)}
                className="cursor-pointer hover:opacity-90 transition-opacity"
              >
                <path 
                  d={calculateArc(index, total, 20, 50)} 
                  fill={color} 
                  stroke="white" 
                  strokeWidth="0.5"
                />
                
                {/* Texte du segment */}
                {/* On fait une rotation pour suivre le rayon, ou horizontal si peu de segments */}
                <text 
                  x={pos.x} 
                  y={pos.y} 
                  fill={['#fef3c7', '#facc15', '#e5e7eb'].includes(color) ? '#1c1917' : 'white'} // Contraste texte
                  fontSize={total > 8 ? "2.5" : "3.5"} 
                  fontWeight="bold"
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  transform={`rotate(${pos.rotation > 90 && pos.rotation < 270 ? pos.rotation + 180 : pos.rotation}, ${pos.x}, ${pos.y})`}
                  style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
                >
                  {label.length > 12 ? label.substring(0, 10) + '.' : label}
                </text>
              </g>
            );
          })}

          {/* Centre Circle (Navigation) */}
          <circle cx="50" cy="50" r="19" fill="white" className="drop-shadow-inner" />
          
          {/* Icone / Texte Central */}
          <g onClick={handleBack} className={history.length > 0 ? "cursor-pointer" : ""}>
             {history.length > 0 ? (
                 <>
                    <circle cx="50" cy="50" r="19" fill="transparent" /> {/* Hitbox */}
                    <text x="50" y="48" textAnchor="middle" fontSize="3" fontWeight="bold" fill="#78716c">RETOUR</text>
                    <path transform="translate(46, 52) scale(0.3)" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#78716c" strokeWidth="2" fill="none"/>
                 </>
             ) : (
                <>
                    <path transform="translate(42, 35) scale(0.6)" d="M12 14c2.5 0 4-1.5 4-4a4 4 0 1 0-8 0c0 2.5 1.5 4 4 4z" fill="none" stroke="#1c1917" strokeWidth="2" />
                    <path transform="translate(42, 35) scale(0.6)" d="M12 14v8" stroke="#1c1917" strokeWidth="2" strokeLinecap="round"/>
                    <path transform="translate(42, 35) scale(0.6)" d="M9 19c-1-1-3-2-3-4" stroke="#1c1917" strokeWidth="2" strokeLinecap="round"/>
                </>
             )}
             
             <text 
                x="50" 
                y={history.length > 0 ? "60" : "58"} 
                textAnchor="middle" 
                fill={activeColor || "#1c1917"} 
                fontSize={centerLabel.length > 10 ? "3" : "4"} 
                fontWeight="bold"
             >
                 {centerLabel}
             </text>

             {/* Indicateur de niveau si profond */}
             {history.length > 1 && (
                <text x="50" y="42" textAnchor="middle" fontSize="2" fill="#a8a29e">
                   {history[history.length-2].label}
                </text>
             )}
          </g>
        </svg>

        {/* Plus Icon Overlay in Center (Purely visual like screenshot) */}
        {history.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-2 pointer-events-none">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            </div>
        )}

      </div>
      
      {/* Legend / Instruction */}
      <div className="absolute bottom-10 text-white/80 text-sm font-medium text-center bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
         {history.length === 0 ? "Touchez une famille" : "Touchez pour préciser"}
      </div>
    </div>
  );
};

export default AromaWheel;
