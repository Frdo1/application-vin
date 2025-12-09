
import React, { useState } from 'react';
import { Wine, FoodPairing } from '../types';

interface WineDetailModalProps {
  wine: Wine | null;
  isOpen: boolean;
  onClose: () => void;
}

// Sous-composant pour gérer le chargement individuel de chaque image
const FoodPairingItem: React.FC<{ food: FoodPairing }> = ({ food }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Utilisation du mot-clé anglais généré par Gemini
  const keyword = food.imageKeyword || food.name;
  
  // Seed stable basé sur le nom du plat pour permettre le cache
  const seed = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Prompt simplifié et modèle Flux pour le photoréalisme
  const prompt = `photo of ${keyword}, delicious french food, detailed texture, 8k, gastronomic`;
  const encodedPrompt = encodeURIComponent(prompt);
  
  // URL stable (sans Math.random)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=300&height=300&nologo=true&seed=${seed}&model=flux`;

  return (
    <div className="flex flex-col items-center group">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-md border-2 border-white mb-2 relative bg-stone-200">
            {/* Spinner de chargement */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                    <div className="w-6 h-6 border-2 border-wine-200 border-t-wine-600 rounded-full animate-spin"></div>
                </div>
            )}
            
            <img 
                src={imageUrl} 
                alt={food.name}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => { setIsLoaded(true); setHasError(true); }}
            />
            
            {/* Fallback si erreur */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            )}
        </div>
        <p className="text-xs text-center font-bold text-stone-700 leading-tight capitalize max-w-[80px]">{food.name}</p>
    </div>
  );
};

const WineDetailModal: React.FC<WineDetailModalProps> = ({ wine, isOpen, onClose }) => {
  if (!isOpen || !wine) return null;

  // Helper colors
  const getThemeColor = (type: string) => {
    switch (type) {
      case 'Rouge': return 'bg-red-900 text-white';
      case 'Blanc': return 'bg-yellow-400 text-yellow-900';
      case 'Rosé': return 'bg-rose-300 text-rose-900';
      case 'Champagne': return 'bg-amber-200 text-amber-900';
      default: return 'bg-slate-800 text-white';
    }
  };

  const getLiquidColor = (type: string) => {
    switch (type) {
        case 'Rouge': return '#720e1e';
        case 'Blanc': return '#fef3c7';
        case 'Rosé': return '#fecdd3';
        case 'Champagne': return '#fde68a';
        default: return '#e2e8f0';
    }
  };

  // Graphique Apogée
  const renderAgingGraph = () => {
    const maxYears = 15;
    const startPct = Math.min((wine.peakStart || 0) / maxYears * 100, 100);
    const endPct = Math.min((wine.peakEnd || 5) / maxYears * 100, 100);
    const widthPct = endPct - startPct;

    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs text-stone-500 uppercase font-bold mb-1">
                <span>Jeune</span>
                <span>Apogée</span>
                <span>Vieux</span>
            </div>
            <div className="relative h-4 bg-stone-200 rounded-full w-full overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-3 divide-x divide-white/20">
                    <div className="bg-stone-300/30"></div>
                    <div className="bg-stone-300/30"></div>
                    <div className="bg-stone-300/30"></div>
                </div>
                <div 
                    className="absolute h-full bg-gradient-to-r from-wine-400 to-wine-700 shadow-md rounded-full opacity-90"
                    style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 5)}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>0 ans</span>
                <span>{wine.agingPotential}</span>
                <span>15+ ans</span>
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-[#fdfbf7] md:rounded-2xl shadow-2xl overflow-y-auto flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:left-auto md:right-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-stone-800 transition-colors shadow-lg border border-stone-100"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        {/* Left: Visuals */}
        <div className={`md:w-2/5 relative flex flex-col items-center justify-center p-8 overflow-visible ${wine.type === 'Rouge' ? 'bg-stone-100' : 'bg-white'}`}>
            <div className={`absolute top-0 left-0 px-4 py-2 text-xs font-bold uppercase tracking-widest ${getThemeColor(wine.type)} rounded-br-lg shadow-md z-10`}>
                {wine.type}
            </div>

            {/* PRIX EN HAUT - High Visibility Overlay */}
            <div className="absolute top-4 right-4 z-50">
                 <div className="bg-[#fff8e1] px-5 py-3 rounded-xl border-2 border-amber-200 shadow-2xl flex flex-col items-center animate-bounce-in transform hover:scale-105 transition-transform">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800/80 leading-none mb-1">Prix Estimé</span>
                    <span className="text-amber-900 font-serif font-black text-2xl leading-none">{wine.priceRange}</span>
                 </div>
            </div>
            
             <div className="relative w-full h-64 md:h-96 flex items-center justify-center mt-6 md:mt-0 z-0">
                {wine.imageUrl ? (
                     <img src={wine.imageUrl} alt={wine.name} className="h-full object-contain drop-shadow-2xl" />
                ) : (
                    <svg viewBox="0 0 60 160" className="h-full drop-shadow-2xl overflow-visible">
                        <path d="M20 0H40V30C40 30 55 40 55 70V150C55 155.523 50.5228 160 45 160H15C9.47715 160 5 155.523 5 150V70C5 40 20 30 20 30V0Z" fill={wine.type === 'Rouge' ? '#290e0e' : '#e6e8eb'} />
                        <path d="M6 75C6 48 20 40 20 40V150C20 150 9 150 6 150V75Z" fill={getLiquidColor(wine.type)} fillOpacity="0.8" />
                        <path d="M54 75C54 48 40 40 40 40V150C40 150 51 150 54 150V75Z" fill={getLiquidColor(wine.type)} fillOpacity="0.8" />
                        <path d="M20 150H40V40C40 40 30 35 20 40V150Z" fill={getLiquidColor(wine.type)} />
                        <rect x="10" y="70" width="40" height="40" rx="2" fill="#fffefc" />
                        <rect x="25" y="95" width="10" height="10" rx="5" fill="#9b1c1c" opacity="0.1" />
                        <path d="M15 10V150" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
                    </svg>
                )}
             </div>
        </div>

        {/* Right: Details */}
        <div className="md:w-3/5 p-6 md:p-10 bg-[#fdfbf7] flex flex-col gap-8 relative z-10">
            
            <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 leading-tight mb-2">
                    {wine.name}
                </h2>
                <div className="flex items-center gap-2 text-wine-800 font-bold uppercase tracking-wide text-sm">
                    <span>{wine.region}</span>
                    <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                    <span>{wine.appellation}</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-stone-800 mb-3 border-b border-stone-100 pb-2">Dégustation</h3>
                <p className="text-stone-600 italic mb-4 leading-relaxed">"{wine.description}"</p>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-xs font-bold text-stone-400 uppercase mb-1">Au Nez</h4>
                        <div className="flex flex-wrap gap-1">
                             {wine.tastingNotes?.nose?.map((n, i) => (
                                <span key={i} className="px-2 py-1 bg-stone-50 border border-stone-100 rounded text-xs text-stone-700">{n}</span>
                             ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-stone-400 uppercase mb-1">En Bouche</h4>
                        <div className="flex flex-wrap gap-1">
                             {wine.tastingNotes?.mouth?.map((n, i) => (
                                <span key={i} className="px-2 py-1 bg-stone-50 border border-stone-100 rounded text-xs text-stone-700">{n}</span>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-serif text-lg font-bold text-stone-800 mb-2">Service</h3>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-stone-400 uppercase font-bold">Température</p>
                            <p className="text-stone-800 font-bold">{wine.servingTemp}</p>
                        </div>
                    </div>
                </div>
                <div>
                     <h3 className="font-serif text-lg font-bold text-stone-800 mb-2">Millésimes d'Or</h3>
                     <div className="flex flex-wrap gap-1">
                        {wine.bestVintages?.map((year, i) => (
                            <span key={i} className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-100 rounded text-xs font-bold">
                                {year}
                            </span>
                        ))}
                     </div>
                </div>
            </div>
            
            <div>
                 <h3 className="font-serif text-lg font-bold text-stone-800">Potentiel de Garde</h3>
                 {renderAgingGraph()}
            </div>

            {/* Food Pairings */}
            <div>
                <h3 className="font-serif text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <span>Accords Gourmands</span>
                    <span className="h-px bg-stone-200 flex-grow"></span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {wine.foodPairing?.map((food, i) => (
                        <FoodPairingItem key={i} food={food} />
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default WineDetailModal;
