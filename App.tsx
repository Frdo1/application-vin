
import React, { useState, useEffect } from 'react';
import { searchWines, analyzeLabel } from './services/geminiService';
import { Wine, SearchState } from './types';
import WineCard from './components/WineCard';
import WineDetailModal from './components/WineDetailModal';
import CameraModal from './components/CameraModal';

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const WineGlassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export default function App() {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setInstallPrompt(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.query.trim() && state.hasSearched) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, hasSearched: true }));
    
    try {
      const wines = await searchWines(state.query);
      setState(prev => ({ ...prev, results: wines, isLoading: false }));
    } catch (error: any) {
      console.error("App Error:", error);
      let message = "Une erreur est survenue lors de la consultation du sommelier.";
      
      if (error.message === "MISSING_API_KEY") {
        message = "Configuration manquante : Clé API non trouvée. Veuillez configurer la variable 'API_KEY' dans Vercel et redéployer.";
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: message
      }));
    }
  };

  const handleCameraCapture = async (imageBase64: string) => {
    setIsCameraOpen(false);
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      hasSearched: true,
      query: "Analyse d'étiquette en cours..." 
    }));

    try {
      const wines = await analyzeLabel(imageBase64);
      if (wines.length > 0) {
        const winesWithImage = wines.map(w => ({
            ...w,
            imageUrl: imageBase64 
        }));

        setState(prev => ({ 
            ...prev, 
            results: winesWithImage, 
            isLoading: false, 
            query: wines[0].name 
        }));
        
        setSelectedWine(winesWithImage[0]);
      } else {
        setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: "Je n'ai pas réussi à lire l'étiquette. Vérifiez la luminosité." 
        }));
      }
    } catch (error: any) {
      let message = "Erreur lors de l'analyse visuelle.";
      if (error.message === "MISSING_API_KEY") {
        message = "Configuration requise : Clé API manquante sur Vercel.";
      }
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: message
      }));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setState(prev => ({ ...prev, query: suggestion }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 selection:bg-wine-200 selection:text-wine-900">
      
      {/* Header / Hero */}
      <header className="relative bg-white border-b border-stone-200 pt-16 pb-12 px-4 shadow-sm">
        {/* PWA Install Button (Visible only if installable) */}
        {installPrompt && (
          <div className="absolute top-4 right-4 animate-fade-in">
             <button
               onClick={handleInstallClick}
               className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-wine-900 transition-colors shadow-lg"
             >
               <DownloadIcon />
               Installer l'App
             </button>
          </div>
        )}

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-wine-50 rounded-full mb-6 text-wine-900 border border-wine-100">
            <WineGlassIcon />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 mb-4 tracking-tight">
            Le Sommelier <span className="text-wine-800">IA</span>
          </h1>
          <p className="text-lg text-stone-500 font-light mb-8 max-w-2xl mx-auto">
            Découvrez les trésors du vignoble français. Décrivez vos envies ou scannez une étiquette.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
                <input
                type="text"
                value={state.query}
                onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                placeholder="Décrivez un vin..."
                className="w-full pl-6 pr-24 py-4 text-lg bg-white border-2 border-stone-200 rounded-full shadow-sm focus:outline-none focus:border-wine-500 focus:ring-4 focus:ring-wine-50 transition-all placeholder:text-stone-300 text-stone-800"
                />
                
                <div className="absolute right-2 flex gap-1 items-center">
                    <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="p-3 text-stone-400 hover:text-wine-700 hover:bg-stone-50 rounded-full transition-colors group relative"
                        title="Scanner ou Importer une étiquette"
                    >
                        <CameraIcon />
                        {/* Dot indicator for PC users */}
                        <span className="absolute top-2 right-2 w-2 h-2 bg-wine-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100"></span>
                    </button>
                    <button 
                    type="submit"
                    disabled={state.isLoading}
                    className="p-3 bg-wine-800 hover:bg-wine-900 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {state.isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <SearchIcon />
                    )}
                    </button>
                </div>
            </div>
          </form>

          {!state.hasSearched && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Bordeaux puissant", "Chablis minéral", "Champagne de vigneron", "Rouge léger pour l'été"].map((sug, i) => (
                <button 
                    key={i}
                    onClick={() => handleSuggestionClick(sug)}
                    className="text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-wine-700 transition-colors px-3 py-1 border border-stone-100 rounded-full hover:border-wine-200 bg-white"
                >
                    {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        
        {state.error && (
            <div className="text-center p-8 bg-red-50 text-red-800 rounded-lg border border-red-100 max-w-2xl mx-auto shadow-sm">
                <p className="font-bold mb-2">Oups !</p>
                <p>{state.error}</p>
            </div>
        )}

        {state.isLoading && !state.results.length && (
            <div className="text-center py-20">
                <p className="text-wine-900 font-serif text-xl animate-pulse">
                    {state.query === "Analyse d'étiquette en cours..." ? "Analyse de l'étiquette..." : "Le sommelier descend à la cave..."}
                </p>
            </div>
        )}

        {state.results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {state.results.map((wine, index) => (
                    <WineCard 
                        key={index} 
                        wine={wine} 
                        index={index} 
                        onClick={() => setSelectedWine(wine)}
                    />
                ))}
            </div>
        )}

        {state.hasSearched && !state.isLoading && state.results.length === 0 && !state.error && (
            <div className="text-center text-stone-400 py-12">
                <p>Aucun vin trouvé pour cette recherche.</p>
            </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 text-center text-stone-400 text-sm">
        <p>L'abus d'alcool est dangereux pour la santé, à consommer avec modération.</p>
        <p className="mt-2 text-xs">Propulsé par Google Gemini • Design par Le Sommelier IA</p>
      </footer>

      {/* Modals */}
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCameraCapture} 
      />
      
      <WineDetailModal 
        isOpen={!!selectedWine}
        wine={selectedWine}
        onClose={() => setSelectedWine(null)}
      />
    </div>
  );
}
