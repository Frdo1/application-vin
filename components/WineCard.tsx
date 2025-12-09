
import React, { useState } from 'react';
import { Wine } from '../types';

interface WineCardProps {
  wine: Wine;
  index: number;
  onClick: () => void;
}

const WineCard: React.FC<WineCardProps> = ({ wine, index, onClick }) => {
  const [imgError, setImgError] = useState(false);

  // Determine color theme based on wine type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Rouge': return 'bg-red-900 text-red-50 border-red-800';
      case 'Blanc': return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'Rosé': return 'bg-rose-200 text-rose-900 border-rose-300';
      case 'Champagne': return 'bg-amber-100 text-amber-900 border-amber-300';
      default: return 'bg-slate-100 text-slate-900 border-slate-300';
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Rouge': return 'bg-red-100 text-red-800';
      case 'Blanc': return 'bg-yellow-50 text-yellow-700';
      case 'Rosé': return 'bg-rose-100 text-rose-700';
      case 'Champagne': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-white rounded-lg shadow-md border border-stone-200 overflow-hidden hover:shadow-2xl hover:border-wine-300 transition-all duration-500 transform hover:-translate-y-1 cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image / Visualization Section */}
      <div className="relative h-72 bg-white flex items-center justify-center overflow-hidden border-b border-stone-100 p-0">
        <div className="absolute inset-0 bg-stone-50 opacity-50"></div>
        {wine.imageUrl && !imgError ? (
           <img 
             src={wine.imageUrl} 
             alt={wine.name} 
             className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
             onError={() => setImgError(true)}
           />
        ) : (
           /* Elegant Bottle Fallback Visualization */
           <div className="relative w-full h-full flex items-end justify-center pb-4 opacity-90 group-hover:scale-105 transition-transform duration-500">
              {/* SVG Bottle */}
              <svg width="70" height="190" viewBox="0 0 60 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl z-10">
                <path d="M20 0H40V30C40 30 55 40 55 70V150C55 155.523 50.5228 160 45 160H15C9.47715 160 5 155.523 5 150V70C5 40 20 30 20 30V0Z" fill={wine.type === 'Rouge' ? '#290e0e' : '#e6e8eb'} opacity={wine.type === 'Rouge' ? '0.95' : '0.6'} />
                <path d="M6 75C6 48 20 40 20 40V150C20 150 9 150 6 150V75Z" fill={getLiquidColor(wine.type)} fillOpacity="0.8" />
                <path d="M54 75C54 48 40 40 40 40V150C40 150 51 150 54 150V75Z" fill={getLiquidColor(wine.type)} fillOpacity="0.8" />
                <path d="M20 150H40V40C40 40 30 35 20 40V150Z" fill={getLiquidColor(wine.type)} />
                <rect x="10" y="70" width="40" height="50" rx="1" fill="#fdfbf7" />
                <rect x="14" y="75" width="32" height="1" fill="#1c1917" opacity="0.2" />
                <rect x="14" y="80" width="25" height="1" fill="#1c1917" opacity="0.2" />
                {/* Simulated text on label */}
                <rect x="14" y="90" width="32" height="2" fill="#1c1917" opacity="0.6" />
                <rect x="14" y="94" width="20" height="2" fill="#1c1917" opacity="0.6" />
                
                <rect x="25" y="105" width="10" height="10" rx="5" fill="#9b1c1c" opacity="0.1" />
                <path d="M15 10V150" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
              </svg>
           </div>
        )}
        
        {/* Price Tag Overlay */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-serif font-bold text-wine-900 shadow-sm border border-stone-200 z-20">
          {wine.priceRange}
        </div>
      </div>

      <div className={`h-1 w-full ${getTypeColor(wine.type).split(' ')[0]}`} />
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${getTypeBadge(wine.type)}`}>
                {wine.type}
            </span>
        </div>

        <h3 className="text-lg font-serif font-bold text-stone-900 mb-1 leading-tight group-hover:text-wine-800 transition-colors">
          {wine.name}
        </h3>
        <p className="text-xs font-bold text-wine-900/70 mb-3 uppercase tracking-wide">
          {wine.appellation} — {wine.region}
        </p>
        
        <p className="text-stone-600 text-sm leading-relaxed mb-4 italic pl-2 border-l-2 border-wine-100 line-clamp-3">
          "{wine.description}"
        </p>

        <div className="mt-auto pt-3 border-t border-stone-100">
             <div className="flex items-center text-xs text-wine-600 font-bold uppercase tracking-widest gap-1 group-hover:translate-x-1 transition-transform">
                Voir la fiche technique
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
             </div>
        </div>
      </div>
    </div>
  );
};

export default WineCard;
