
import React, { useState, useEffect } from 'react';
import { Wine, UserTasting } from '../types';
import AromaWheel from './AromaWheel';

interface TastingSheetProps {
  wine: Wine;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tasting: UserTasting) => void;
}

// Composant Slider personnalisé style "Ploc"
const CustomSlider = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-stone-800">{label}</label>
      </div>
      <div className="relative w-full h-6 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-3 bg-stone-200 rounded-full overflow-hidden">
           {/* Filled part (gradient style) */}
           <div 
             className="h-full bg-gradient-to-r from-stone-300 to-stone-400 opacity-50" 
             style={{ width: `${value}%` }}
           />
        </div>
        
        {/* Input Range Invisible mais fonctionnel */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Custom Thumb (Cercle Blanc) */}
        <div 
            className="absolute h-6 w-6 bg-white border border-stone-300 rounded-full shadow-md z-10 pointer-events-none transition-all duration-75 ease-out"
            style={{ left: `calc(${value}% - 12px)` }}
        ></div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center justify-between mt-8 mb-6 border-b border-stone-200 pb-2">
        <h3 className="text-xl font-serif font-bold text-stone-900">{title}</h3>
        <div className="text-wine-800">
            {icon}
        </div>
    </div>
);

const TastingSheet: React.FC<TastingSheetProps> = ({ wine, isOpen, onClose, onSave }) => {
  // Initial State
  const [tasting, setTasting] = useState<UserTasting>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    rating: 85,
    vintage: '',
    comment: '',
    guests: '',
    visual: { intensity: 50, limpidity: 50, brilliance: 50, tears: 50 },
    nose: { intensity: 50, impression: 50, aromas: [] },
    mouth: { sugar: 10, alcohol: 50, acidity: 50, tannins: 50, persistence: 50, caudalie: 5 }
  });

  const [isAromaWheelOpen, setIsAromaWheelOpen] = useState(false);
  const [isEditingVintage, setIsEditingVintage] = useState(false);

  // Load existing tasting if available
  useEffect(() => {
    if (wine.userTasting) {
      setTasting(wine.userTasting);
    }
  }, [wine]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        // YYYY-MM-DD -> DD/MM/YY
        return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }
    return dateStr;
  };

  if (!isOpen) return null;

  const updateVisual = (key: keyof UserTasting['visual'], val: number) => 
    setTasting(prev => ({ ...prev, visual: { ...prev.visual, [key]: val } }));

  const updateNose = (key: keyof UserTasting['nose'], val: number) => 
    setTasting(prev => ({ ...prev, nose: { ...prev.nose, [key]: val } }));

  const updateMouth = (key: keyof UserTasting['mouth'], val: number) => 
    setTasting(prev => ({ ...prev, mouth: { ...prev.mouth, [key]: val } }));

  const handleAddAroma = (aroma: string) => {
      setTasting(prev => {
          // Évite les doublons
          if (prev.nose.aromas.includes(aroma)) return prev;
          return {
              ...prev,
              nose: { ...prev.nose, aromas: [...prev.nose.aromas, aroma] }
          };
      });
  };

  const removeAroma = (aroma: string) => {
      setTasting(prev => ({
          ...prev,
          nose: { ...prev.nose, aromas: prev.nose.aromas.filter(a => a !== aroma) }
      }));
  };

  const handleSave = () => {
    onSave(tasting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in">
      
      {/* Navbar FIXE (Z-Index élevé pour rester au dessus du scroll) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[70] pointer-events-none">
            {/* Pointer events auto sur les boutons pour qu'ils soient cliquables */}
            <button onClick={onClose} className="pointer-events-auto p-2 bg-black/20 text-white rounded-full backdrop-blur hover:bg-black/40 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
            </button>
            
            <h2 className="font-serif font-bold text-lg tracking-wide uppercase text-white drop-shadow-md opacity-0">Dégustation</h2> {/* Titre invisible pour l'espacement ou apparition au scroll si souhaité */}
            
            <button onClick={handleSave} className="pointer-events-auto p-2 bg-wine-600 rounded-full shadow-lg hover:bg-wine-500 text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </button>
      </div>

      {/* Main Container Scrolable (Contient Header + Contenu) */}
      <div className="flex-grow overflow-y-auto bg-white relative">
        
        {/* HEADER IMAGE (Dans le scroll) */}
        <div className="relative h-64 w-full bg-stone-900 overflow-hidden">
             {/* Background Image Effect */}
             {wine.imageUrl && (
                 <img src={wine.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" alt="bg" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

             {/* Wine Title centered */}
             <div className="absolute bottom-16 left-0 right-0 text-center px-6 z-10">
                <h1 className="text-white font-serif font-bold text-2xl md:text-3xl drop-shadow-md line-clamp-2 leading-tight mb-1">{wine.name}</h1>
                <p className="text-stone-300 text-sm font-medium">{wine.appellation} • {wine.type}</p>
             </div>
             
             {/* Edit Vintage Button Style - EDITABLE NOW */}
             <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30">
                {isEditingVintage ? (
                    <input 
                        type="number" 
                        autoFocus
                        placeholder="2020"
                        className="w-24 text-center bg-black/50 text-cyan-400 border border-cyan-400 rounded px-2 py-1 text-xs font-bold focus:outline-none backdrop-blur placeholder:text-cyan-400/50"
                        value={tasting.vintage || ''}
                        onChange={(e) => setTasting(prev => ({...prev, vintage: e.target.value}))}
                        onBlur={() => setIsEditingVintage(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingVintage(false);
                        }}
                    />
                ) : (
                    <button 
                        onClick={() => setIsEditingVintage(true)}
                        className="border border-cyan-400 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/20 backdrop-blur hover:bg-black/50 transition-colors shadow-sm"
                    >
                        {tasting.vintage ? `Millésime ${tasting.vintage}` : '+ Millésime'}
                    </button>
                )}
             </div>
        </div>

        {/* CONTENU BLANC (Chevauche le header via margin-top negatif) */}
        <div className="relative px-6 pb-20 bg-white min-h-[50vh] rounded-t-3xl -mt-6">
            
            {/* Rating Circle overlapping Header & Content */}
            <div className="flex justify-center -mt-10 mb-6 relative z-20">
                <div className="bg-white p-1.5 rounded-full shadow-xl">
                     <div className="w-20 h-20 rounded-full bg-stone-50 flex items-center justify-center border-4 border-white relative overflow-hidden group cursor-pointer shadow-inner">
                        {/* Background Progress Circle simulation */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-wine-200 to-wine-100 transition-all duration-300"
                            style={{ height: `${tasting.rating}%` }}
                        ></div>
                        
                        <input 
                            type="number" 
                            value={tasting.rating}
                            onChange={(e) => setTasting(prev => ({ ...prev, rating: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                            className="w-full text-center bg-transparent text-2xl font-bold text-stone-800 focus:outline-none z-10 relative"
                        />
                     </div>
                </div>
            </div>

            {/* General Info Cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {/* DATE CUSTOM DISPLAY */}
                <div className="bg-white border border-stone-100 shadow-sm rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <span className="text-[10px] text-stone-400 uppercase font-bold mb-1">Date</span>
                    <span className="font-bold text-stone-800 text-sm">{formatDateDisplay(tasting.date)}</span>
                    <input 
                        type="date" 
                        value={tasting.date}
                        onChange={(e) => setTasting(prev => ({...prev, date: e.target.value}))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                
                <div className="bg-white border border-stone-100 shadow-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                     <span className="text-[10px] text-stone-400 uppercase font-bold mb-1">Lieu</span>
                     <input 
                        type="text" 
                        placeholder="Choisir"
                        value={tasting.location}
                        onChange={(e) => setTasting(prev => ({...prev, location: e.target.value}))}
                        className="w-full text-center font-bold text-stone-800 text-sm bg-transparent focus:outline-none placeholder:text-stone-300"
                     />
                </div>
                 <div className="bg-white border border-stone-100 shadow-sm rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                     <span className="text-[10px] text-stone-400 uppercase font-bold mb-1">Note</span>
                     <span className="text-xl font-bold text-stone-800">{tasting.rating}</span>
                     <div className="absolute bottom-0 right-0 w-8 h-8 bg-stone-800 transform rotate-45 translate-x-4 translate-y-4 opacity-5"></div>
                </div>
            </div>

            {/* Sections Fields */}
            <div className="space-y-6">
                <div className="border-b border-stone-100 pb-2">
                    <input 
                        type="text" 
                        placeholder="Personnes présentes"
                        value={tasting.guests || ''}
                        onChange={(e) => setTasting(prev => ({...prev, guests: e.target.value}))}
                        className="w-full py-2 text-stone-600 bg-transparent border-none focus:ring-0 placeholder:text-stone-300"
                    />
                </div>
            </div>

            {/* --- VISUEL --- */}
            <SectionHeader 
                title="Visuel" 
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                } 
            />
            
            <CustomSlider label="Intensité" value={tasting.visual.intensity} onChange={(v) => updateVisual('intensity', v)} />
            <CustomSlider label="Limpidité" value={tasting.visual.limpidity} onChange={(v) => updateVisual('limpidity', v)} />
            <CustomSlider label="Brillance" value={tasting.visual.brilliance} onChange={(v) => updateVisual('brilliance', v)} />
            <CustomSlider label="Fluidité" value={tasting.visual.tears} onChange={(v) => updateVisual('tears', v)} />


            {/* --- NEZ --- */}
            <SectionHeader 
                title="Nez" 
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                         <path d="M12 14c2.5 0 4-1.5 4-4a4 4 0 1 0-8 0c0 2.5 1.5 4 4 4z" />
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v8" />
                         <path strokeLinecap="round" strokeLinejoin="round" d="M9 19c-1-1-3-2-3-4" />
                    </svg>
                } 
            />

            <CustomSlider label="Impression" value={tasting.nose.impression} onChange={(v) => updateNose('impression', v)} />
            <CustomSlider label="Intensité" value={tasting.nose.intensity} onChange={(v) => updateNose('intensity', v)} />
            
            {/* Liste des arômes sélectionnés (Tags) */}
            {tasting.nose.aromas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {tasting.nose.aromas.map((aroma, index) => (
                        <span 
                            key={index} 
                            className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-bold flex items-center gap-2 animate-fade-in"
                        >
                            {aroma}
                            <button onClick={() => removeAroma(aroma)} className="hover:text-cyan-600">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div 
                onClick={() => setIsAromaWheelOpen(true)}
                className="mt-4 p-4 bg-cyan-50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-cyan-100 transition-colors border border-cyan-100 group"
            >
                <span className="text-cyan-600 text-sm font-bold flex items-center gap-2 group-hover:scale-105 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ajouter des arômes
                </span>
            </div>


            {/* --- BOUCHE --- */}
            <SectionHeader 
                title="Bouche" 
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                } 
            />

            <CustomSlider label="Sucre" value={tasting.mouth.sugar} onChange={(v) => updateMouth('sugar', v)} />
            <CustomSlider label="Alcool" value={tasting.mouth.alcohol} onChange={(v) => updateMouth('alcohol', v)} />
            <CustomSlider label="Acidité" value={tasting.mouth.acidity} onChange={(v) => updateMouth('acidity', v)} />
            <CustomSlider label="Tanins" value={tasting.mouth.tannins} onChange={(v) => updateMouth('tannins', v)} />
            <CustomSlider label="Persistance" value={tasting.mouth.persistence} onChange={(v) => updateMouth('persistence', v)} />

            <div className="mt-6 mb-8">
                <div className="flex justify-between items-center bg-white p-4 rounded-full border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-2 text-stone-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <input 
                        type="number"
                        placeholder="Longueur en bouche (caudalie)"
                        value={tasting.mouth.caudalie || ''}
                        onChange={(e) => updateMouth('caudalie', parseInt(e.target.value))}
                        className="flex-grow text-center text-stone-800 font-bold bg-transparent outline-none placeholder:font-normal placeholder:text-stone-300 text-sm"
                    />
                </div>
            </div>

            {/* --- CONCLUSION --- */}
            <div className="mb-8">
                <h3 className="text-xl font-serif font-bold text-stone-900 mb-4">Conclusion</h3>
                <div className="bg-stone-100 rounded-xl p-4 flex gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-stone-400 flex-shrink-0 mt-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <textarea 
                        placeholder="Commentaires"
                        value={tasting.comment}
                        onChange={(e) => setTasting(prev => ({...prev, comment: e.target.value}))}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-stone-700 min-h-[80px] placeholder:text-stone-400"
                    ></textarea>
                </div>
            </div>
            
        </div>
      </div>

      <AromaWheel 
        isOpen={isAromaWheelOpen} 
        onClose={() => setIsAromaWheelOpen(false)} 
        onSelect={handleAddAroma}
      />
    </div>
  );
};

export default TastingSheet;
