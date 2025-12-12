
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
      case 'Rouge': return 'bg-red-50 text-red-900 border border-red-100';
      case 'Blanc': return 'bg-yellow-50 text-yellow-800 border border-yellow-100';
      case 'Rosé': return 'bg-rose-50 text-rose-800 border border-rose-100';
      case 'Champagne': return 'bg-amber-50 text-amber-800 border border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-2xl hover:border-wine-200 transition-all duration-500 transform hover:-translate-y-1 cursor-pointer will-change-transform"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image / Visualization Section - Studio Style */}
      <div className="relative h-80 w-full overflow-hidden border-b border-stone-100 p-6 flex items-center justify-center bg-[#fdfbf7]">
        
        {/* Background Spotlight Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-[#f4f1ea] to-[#e6e2d8] opacity-80"></div>
        
        {wine.imageUrl && !imgError ? (
           <img 
             src={wine.imageUrl} 
             alt={wine.name} 
             className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-700 filter contrast-[1.05]"
             onError={() => setImgError(true)}
           />
        ) : (
           /* Elegant Bottle Fallback Visualization */
           <div className="relative w-full h-full flex items-end justify-center pb-2 opacity-90 group-hover:scale-105 transition-transform duration-500">
              {/* SVG Bottle with better definition */}
              <svg width="80" height="220" viewBox="0 0 60 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl z-10">
                <path d="M20 0H40V30C40 30 55 40 55 70V150C55 155.523 50.5228 160 45 160H15C9.47715 160 5 155.523 5 150V70C5 40 20 30 20 30V0Z" fill={wine.type === 'Rouge' ? '#290e0e' : '#f1f5f9'} opacity={wine.type === 'Rouge' ? '0.95' : '0.8'} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                
                {/* Liquid */}
                <path d="M6 75C6 48 20 40 20 40V150C20 150 9 150 6 150V75Z" fill={getLiquidColor(wine.type)} fillOpacity="0.9" />
                <path d="M54 75C54 48 40 40 40 40V150C40 150 51 150 54 150V75Z" fill={getLiquidColor(wine.type)} fillOpacity="0.9" />
                <path d="M20 150H40V40C40 40 30 35 20 40V150Z" fill={getLiquidColor(wine.type)} fillOpacity="1" />
                
                {/* Label */}
                <rect x="10" y="70" width="40" height="45" rx="1" fill="#fffefc" className="drop-shadow-sm" />
                <rect x="14" y="76" width="32" height="1" fill="#1c1917" opacity="0.2" />
                <rect x="14" y="80" width="25" height="1" fill="#1c1917" opacity="0.2" />
                <rect x="14" y="90" width="32" height="3" fill="#881337" opacity="0.8" /> {/* Red line branding */}
                <rect x="14" y="96" width="20" height="1.5" fill="#1c1917" opacity="0.6" />
                
                {/* Capsule / Neck */}
                <rect x="25" y="105" width="10" height="10" rx="5" fill="#9b1c1c" opacity="0.15" />
                
                {/* Highlight/Reflection */}
                <path d="M15 10V150" stroke="white" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
              </svg>
           </div>
        )}
        
        {/* Price Tag Overlay - Redesigned for elegance */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/90 backdrop-blur-sm pl-3 pr-4 py-2 rounded-l-full rounded-r-lg border border-stone-100 shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 translate-x-1 group-hover:translate-x-0">
             <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mr-2 border-r border-stone-200 pr-2">Prix</span>
             <span className="text-wine-900 font-serif font-bold text-sm">{wine.priceRange}</span>
          </div>
        </div>
      </div>

      <div className={`h-1 w-full ${getTypeColor(wine.type).split(' ')[0]} opacity-80`} />
      
      <div className="p-6 flex flex-col flex-grow bg-white">
        <div className="flex justify-between items-start mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getTypeBadge(wine.type)}`}>
                {wine.type}
            </span>
        </div>

        <h3 className="text-xl font-serif font-bold text-stone-900 mb-1 leading-tight group-hover:text-wine-800 transition-colors line-clamp-2">
          {wine.name}
        </h3>
        <p className="text-xs font-bold text-stone-500 mb-4 uppercase tracking-wide flex items-center gap-2">
          <span className="text-wine-800">{wine.appellation}</span>
          <span className="w-1 h-1 rounded-full bg-stone-300"></span>
          <span>{wine.region}</span>
        </p>
        
        <p className="text-stone-600 text-sm leading-relaxed mb-4 italic pl-3 border-l-2 border-wine-100 line-clamp-3">
          "{wine.description}"
        </p>

        <div className="mt-auto pt-4 border-t border-stone-100 flex justify-between items-center">
             <div className="flex items-center text-xs text-stone-500 font-medium">
                <span className="mr-1">❤️</span> {wine.bestVintages?.[0] || 'Top'}
             </div>
             
             <div className="flex items-center text-xs text-wine-700 font-bold uppercase tracking-widest gap-1 group-hover:translate-x-1 transition-transform">
                Fiche Sommelier
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
