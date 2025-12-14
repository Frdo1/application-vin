
import React from 'react';

interface BottomNavProps {
  currentView: 'search' | 'cellar' | 'history';
  onChangeView: (view: 'search' | 'cellar' | 'history') => void;
  cellarCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, cellarCount }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 flex justify-between items-end md:justify-center md:gap-12 h-20 md:h-24">
      
      <button 
        onClick={() => onChangeView('search')}
        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${currentView === 'search' ? 'text-wine-800 -translate-y-2' : 'text-stone-400'}`}
      >
        <div className={`p-2 rounded-full transition-all ${currentView === 'search' ? 'bg-wine-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={currentView === 'search' ? 2.5 : 1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide">Recherche</span>
      </button>

      <button 
        onClick={() => onChangeView('cellar')}
        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${currentView === 'cellar' ? 'text-wine-800 -translate-y-2' : 'text-stone-400'}`}
      >
        <div className={`relative p-2 rounded-full transition-all ${currentView === 'cellar' ? 'bg-wine-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={currentView === 'cellar' ? 2.5 : 1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3M12 15.75h3M12 7.5v-3h-3v3M12 7.5H4.875c-.621 0-1.125.504-1.125 1.125v1.125c0 .621.504 1.125 1.125 1.125h.375m3 0h12m-12 0v7.625c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V10.875m-9 0H3.375" />
            </svg>
            {cellarCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-wine-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {cellarCount}
                </span>
            )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide">Ma Cave</span>
      </button>

      <button 
        onClick={() => onChangeView('history')}
        className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${currentView === 'history' ? 'text-wine-800 -translate-y-2' : 'text-stone-400'}`}
      >
        <div className={`p-2 rounded-full transition-all ${currentView === 'history' ? 'bg-wine-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={currentView === 'history' ? 2.5 : 1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide">Historique</span>
      </button>

    </div>
  );
};

export default BottomNav;
