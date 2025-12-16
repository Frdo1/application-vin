
import React, { useState, useEffect, useRef } from 'react';
import { searchWines, analyzeLabel } from './services/geminiService';
import { Wine, SearchState, ScanHistoryItem, UserTasting } from './types';
import WineCard from './components/WineCard';
import WineDetailModal from './components/WineDetailModal';
import CameraModal from './components/CameraModal';
import GameCanvas from './components/GameCanvas';
import BottomNav from './components/BottomNav';
import TastingSheet from './components/TastingSheet';

// Base de données locale pour l'autocomplétion (Top Vins & Appellations France)
const POPULAR_WINES = [
  "Château Margaux", "Petrus", "Romanée-Conti", "Château d'Yquem",
  "Château Lafite Rothschild", "Château Latour", "Château Haut-Brion",
  "Château Cheval Blanc", "Château Mouton Rothschild", "Château Ausone",
  "Château Angélus", "Château Pavie", "Château Palmer", "Château Lynch-Bages",
  "Château Pontet-Canet", "Château Montrose", "Château Cos d'Estournel",
  "Domaine Leflaive", "Domaine Leroy", "Domaine de la Romanée-Conti",
  "E. Guigal", "M. Chapoutier", "Louis Jadot", "Joseph Drouhin",
  "Bollinger", "Dom Pérignon", "Krug", "Roederer Cristal", "Salon",
  "Taittinger Comtes de Champagne", "Pol Roger Sir Winston Churchill",
  "Chablis Grand Cru", "Meursault", "Puligny-Montrachet", "Corton-Charlemagne",
  "Montrachet", "Chambertin", "Musigny", "Richebourg", "La Tâche",
  "Clos de Vougeot", "Echézeaux", "Pommard", "Volnay", "Nuits-Saint-Georges",
  "Gevrey-Chambertin", "Vosne-Romanée", "Châteauneuf-du-Pape", "Côte-Rôtie",
  "Hermitage", "Cornas", "Condrieu", "Saint-Joseph", "Crozes-Hermitage",
  "Bandol", "Sancerre", "Pouilly-Fumé", "Chinon", "Saumur-Champigny",
  "Vouvray", "Alsace Grand Cru", "Gewurztraminer", "Riesling",
  "Jura Vin Jaune", "Château-Chalon", "Pessac-Léognan", "Saint-Émilion",
  "Pomerol", "Sauternes", "Margaux", "Pauillac", "Saint-Estèphe", "Saint-Julien",
  "Champagne", "Provence Rosé", "Tavel", "Morgon", "Moulin-à-Vent"
];

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

const GameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
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

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'search' | 'cellar' | 'history'>('search');

  // App States
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });
  
  // State pour la pagination (Charger plus)
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const [cellar, setCellar] = useState<Wine[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isTastingOpen, setIsTastingOpen] = useState(false);
  
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // State pour l'autocomplétion
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Load persistence
  useEffect(() => {
    const savedCellar = localStorage.getItem('sommelier_cellar');
    if (savedCellar) setCellar(JSON.parse(savedCellar));

    const savedHistory = localStorage.getItem('sommelier_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save persistence when changed
  useEffect(() => {
    localStorage.setItem('sommelier_cellar', JSON.stringify(cellar));
  }, [cellar]);

  useEffect(() => {
    localStorage.setItem('sommelier_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Click outside to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.query.trim()) return;
    setShowSuggestions(false); // Cache les suggestions au lancement

    // Reset complet pour une nouvelle recherche
    setState(prev => ({ ...prev, results: [], isLoading: true, error: null, hasSearched: true }));
    setIsMoreLoading(false);
    
    try {
      const wines = await searchWines(state.query);
      setState(prev => ({ ...prev, results: wines, isLoading: false }));
    } catch (error: any) {
      console.error("App Error:", error);
      let message = "Une erreur est survenue lors de la consultation du sommelier.";
      
      if (error.message === "MISSING_API_KEY") {
        message = "Configuration manquante : Clé API non trouvée.";
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: message
      }));
    }
  };

  const handleLoadMore = async () => {
      if (!state.query || isMoreLoading) return;
      
      setIsMoreLoading(true);
      try {
          // On passe les noms des vins actuels pour les exclure de la prochaine page
          const currentNames = state.results.map(w => w.name);
          const newWines = await searchWines(state.query, currentNames);
          
          if (newWines.length === 0) {
              // Optionnel : Gérer le cas où il n'y a plus de résultats (ex: Toast)
          } else {
              setState(prev => ({
                  ...prev,
                  results: [...prev.results, ...newWines]
              }));
          }
      } catch (e) {
          console.error("Erreur chargement page suivante", e);
      } finally {
          setIsMoreLoading(false);
      }
  };

  const processImageAnalysis = async (imageBase64: string) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      hasSearched: true,
      query: "Analyse d'étiquette en cours...",
      results: [] 
    }));
    setIsMoreLoading(false);

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
        message = "Configuration requise : Clé API manquante.";
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
    
    // Save to History (Limit to 10 to save space)
    const newItem: ScanHistoryItem = {
        id: Date.now(),
        date: Date.now(),
        imageBase64: imageBase64
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10));

    // Switch to search view if not already
    setCurrentView('search');

    await processImageAnalysis(imageBase64);
  };

  const handleHistoryItemClick = async (item: ScanHistoryItem) => {
      setCurrentView('search');
      await processImageAnalysis(item.imageBase64);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setHistory(prev => prev.filter(item => item.id !== id));
  };

  // Ajout / Suppression simple (utilisé depuis la recherche)
  const toggleCellar = (wine: Wine) => {
      const exists = cellar.find(w => w.name === wine.name);
      if (exists) {
          setCellar(prev => prev.filter(w => w.name !== wine.name));
      } else {
          // Ajout avec quantité 1 par défaut
          setCellar(prev => [{...wine, dateAdded: Date.now(), quantity: 1}, ...prev]);
      }
  };

  // Gestion de stock (utilisé depuis la Cave)
  const updateQuantity = (wine: Wine, change: number) => {
    setCellar(prev => {
        return prev.map(w => {
            if (w.name === wine.name) {
                const newQty = (w.quantity || 1) + change;
                return { ...w, quantity: newQty };
            }
            return w;
        }).filter(w => (w.quantity || 0) > 0); // Si la quantité tombe à 0, on retire le vin
    });
  };

  const handleSaveTasting = (tasting: UserTasting) => {
    if (!selectedWine) return;

    // Mise à jour du vin avec la note de dégustation
    const updatedWine: Wine = { ...selectedWine, userTasting: tasting };

    // Si le vin est déjà dans la cave, on le met à jour
    const inCellar = cellar.find(w => w.name === selectedWine.name);
    if (inCellar) {
        setCellar(prev => prev.map(w => w.name === selectedWine.name ? updatedWine : w));
    } else {
        // Sinon, on l'ajoute à la cave
        setCellar(prev => [{ ...updatedWine, dateAdded: Date.now(), quantity: 1 }, ...prev]);
    }

    // Mise à jour de l'état local du vin sélectionné pour refléter les changements
    setSelectedWine(updatedWine);
  };

  const handleStartTasting = () => {
    // Ferme le modal de détail et ouvre la fiche de dégustation
    setIsTastingOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Set query state synchronously so the user sees it
    setState(prev => ({ ...prev, query: suggestion }));
    setShowSuggestions(false);
    
    // Trigger search manually but using the new query value (passed directly to avoid stale state issues)
    // We replicate handleSearch logic here briefly or just call it if we could pass event.
    // Simpler: Reuse logic
    (async () => {
         setState(prev => ({ ...prev, query: suggestion, results: [], isLoading: true, error: null, hasSearched: true }));
         setIsMoreLoading(false);
         try {
           const wines = await searchWines(suggestion);
           setState(prev => ({ ...prev, results: wines, isLoading: false }));
         } catch (error: any) {
             setState(prev => ({ ...prev, isLoading: false, error: "Erreur lors de la recherche." }));
         }
    })();
  };

  // Helper de normalisation (retire les accents)
  const normalize = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Calcul des suggestions filtrées
  const filteredSuggestions = state.query.length > 1
    ? POPULAR_WINES.filter(w => {
        const query = normalize(state.query);
        const name = normalize(w);
        if (name.startsWith(query)) return true;
        const words = name.split(/[\s'-]+/);
        return words.some(word => word.startsWith(query));
      }).slice(0, 5)
    : [];

  // DASHBOARD CALCULATIONS
  const totalBottles = cellar.reduce((acc, wine) => acc + (wine.quantity || 1), 0);
  
  // Estimation valeur (extraction très basique "45€" -> 45)
  const totalValue = cellar.reduce((acc, wine) => {
     const priceString = wine.priceRange || "0";
     const match = priceString.match(/(\d+)/);
     const price = match ? parseInt(match[0]) : 0;
     return acc + (price * (wine.quantity || 1));
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 selection:bg-wine-200 selection:text-wine-900 pb-24">
      
      {/* --- VUE RECHERCHE --- */}
      {currentView === 'search' && (
        <>
            <header className="relative bg-white border-b border-stone-200 pt-16 pb-12 px-4 shadow-sm animate-fade-in">
                {/* Install Button */}
                {installPrompt && (
                <div className="absolute top-4 right-4 z-40">
                    <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-wine-900 transition-colors shadow-lg"
                    >
                    <DownloadIcon />
                    Installer
                    </button>
                </div>
                )}
                
                {/* Game Button */}
                <div className="absolute top-4 left-4 z-40">
                    <button
                    onClick={() => setIsGameOpen(true)}
                    className="flex items-center gap-2 bg-stone-100 text-stone-600 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-wine-100 hover:text-wine-700 transition-colors border border-stone-200"
                    title="Jeu de la Vendange"
                    >
                    <GameIcon />
                    <span className="hidden sm:inline">Jeu</span>
                    </button>
                </div>

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

                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto z-30">
                    <div className="relative flex items-center">
                        <input
                        type="text"
                        value={state.query}
                        onChange={(e) => {
                            setState(prev => ({ ...prev, query: e.target.value }));
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Décrivez un vin..."
                        className="w-full pl-6 pr-24 py-4 text-lg bg-white border-2 border-stone-200 rounded-full shadow-sm focus:outline-none focus:border-wine-500 focus:ring-4 focus:ring-wine-50 transition-all placeholder:text-stone-300 text-stone-800"
                        autoComplete="off"
                        />
                        
                        <div className="absolute right-2 flex gap-1 items-center">
                            <button
                                type="button"
                                onClick={() => setIsCameraOpen(true)}
                                className="p-3 text-stone-400 hover:text-wine-700 hover:bg-stone-50 rounded-full transition-colors group relative"
                                title="Scanner ou Importer une étiquette"
                            >
                                <CameraIcon />
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

                    {showSuggestions && filteredSuggestions.length > 0 && (
                    <div ref={suggestionRef} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-fade-in z-50">
                        <ul>
                        {filteredSuggestions.map((suggestion, index) => (
                            <li key={index}>
                            <button
                                type="button"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full text-left px-6 py-3 hover:bg-stone-50 text-stone-700 font-serif border-b border-stone-50 last:border-0 transition-colors flex items-center gap-3"
                            >
                                <span className="text-stone-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                </span>
                                {suggestion}
                            </button>
                            </li>
                        ))}
                        </ul>
                    </div>
                    )}
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

            <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
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
                    <div className="flex flex-col gap-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {state.results.map((wine, index) => (
                                <WineCard 
                                    key={index} 
                                    wine={wine} 
                                    index={index} 
                                    onClick={() => setSelectedWine(wine)}
                                    isInCellar={cellar.some(c => c.name === wine.name)}
                                    onToggleCellar={(e) => {
                                        e.stopPropagation();
                                        toggleCellar(wine);
                                    }}
                                    isCellarMode={false}
                                />
                            ))}
                        </div>
                        
                        {/* Pagination / Load More Button */}
                        {!state.isLoading && (
                            <div className="flex justify-center pb-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isMoreLoading}
                                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md hover:border-wine-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isMoreLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-stone-300 border-t-wine-600 rounded-full animate-spin"></div>
                                            <span className="text-stone-500 font-serif italic">Recherche en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon />
                                            <span className="text-stone-800 font-serif font-bold group-hover:text-wine-800 transition-colors">Voir d'autres vins</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {state.hasSearched && !state.isLoading && state.results.length === 0 && !state.error && (
                    <div className="text-center text-stone-400 py-12">
                        <p>Aucun vin trouvé pour cette recherche.</p>
                    </div>
                )}
            </main>
        </>
      )}

      {/* --- VUE CAVE (DASHBOARD) --- */}
      {currentView === 'cellar' && (
        <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
             <header className="mb-8">
                 <div className="text-center mb-8">
                     <h1 className="text-4xl font-serif font-bold text-stone-900">Ma Cave</h1>
                 </div>

                 {/* DASHBOARD STATS */}
                 {cellar.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center">
                             <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Références</span>
                             <span className="text-2xl font-serif font-bold text-stone-800 mt-1">{cellar.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center">
                             <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Bouteilles</span>
                             <span className="text-2xl font-serif font-bold text-wine-800 mt-1">{totalBottles}</span>
                        </div>
                        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col items-center">
                             <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Valeur Estimée</span>
                             <span className="text-2xl font-serif font-bold text-stone-800 mt-1">{totalValue} €</span>
                        </div>
                    </div>
                 )}
             </header>

             {cellar.length === 0 ? (
                 <div className="text-center py-20 px-6 bg-white rounded-2xl border border-stone-200 shadow-sm mx-auto max-w-md">
                     <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3M12 15.75h3M12 7.5v-3h-3v3M12 7.5H4.875c-.621 0-1.125.504-1.125 1.125v1.125c0 .621.504 1.125 1.125 1.125h.375m3 0h12m-12 0v7.625c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V10.875m-9 0H3.375" />
                        </svg>
                     </div>
                     <p className="text-stone-800 font-bold mb-2">Votre cave est vide</p>
                     <p className="text-stone-500 text-sm mb-6">Recherchez ou scannez des vins et appuyez sur le cœur pour les ajouter ici.</p>
                     <button 
                        onClick={() => setCurrentView('search')}
                        className="bg-wine-800 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-wine-900 transition-colors"
                     >
                         Trouver un vin
                     </button>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cellar.map((wine, index) => (
                        <WineCard 
                            key={`cellar-${index}`} 
                            wine={wine} 
                            index={index} 
                            onClick={() => setSelectedWine(wine)}
                            isInCellar={true}
                            onToggleCellar={(e) => {
                                e.stopPropagation();
                                toggleCellar(wine);
                            }}
                            isCellarMode={true}
                            onUpdateQuantity={(change) => updateQuantity(wine, change)}
                        />
                    ))}
                </div>
             )}
        </div>
      )}

      {/* --- VUE HISTORIQUE --- */}
      {currentView === 'history' && (
        <div className="flex-grow container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
            <header className="mb-8 text-center">
                 <h1 className="text-4xl font-serif font-bold text-stone-900">Historique</h1>
                 <p className="text-stone-500 mt-2">Vos {history.length} derniers scans</p>
            </header>
            
            {history.length === 0 ? (
                <div className="text-center py-20 px-6">
                    <p className="text-stone-400">Aucun scan récent. Utilisez la caméra pour commencer.</p>
                    <button 
                        onClick={() => setIsCameraOpen(true)}
                        className="mt-4 bg-stone-900 text-white px-6 py-2 rounded-full font-bold text-sm"
                     >
                         Ouvrir la caméra
                     </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {history.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => handleHistoryItemClick(item)}
                            className="group relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-200 cursor-pointer"
                        >
                            <img src={item.imageBase64} alt="Scan" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                <span className="opacity-0 group-hover:opacity-100 bg-white text-stone-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                                    Analyser
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                                <p className="text-white text-[10px] font-bold text-right">
                                    {new Date(item.date).toLocaleDateString()}
                                </p>
                            </div>
                            
                            {/* Bouton de suppression (Croix) */}
                            <button
                                onClick={(e) => deleteHistoryItem(e, item.id)}
                                className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors z-20"
                                title="Supprimer de l'historique"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        cellarCount={totalBottles} 
      />

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
        isInCellar={selectedWine ? cellar.some(w => w.name === selectedWine.name) : false}
        onToggleCellar={toggleCellar}
        onStartTasting={handleStartTasting}
      />

      {selectedWine && (
          <TastingSheet
              isOpen={isTastingOpen}
              onClose={() => setIsTastingOpen(false)}
              wine={selectedWine}
              onSave={handleSaveTasting}
          />
      )}

      <GameCanvas
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
      />
    </div>
  );
}
