import React, { useState, useMemo, useEffect } from 'react';
import { Search, RotateCw, Filter, Settings, Globe } from 'lucide-react';
import BlueprintCard from './components/BlueprintCard';
import BlueprintDetail from './components/BlueprintDetail';
import { useBlueprintData } from './hooks/useBlueprintData';
import { SortOption, BlueprintDerived, Language } from './types';
import { sortBlueprints } from './utils/blueprintUtils';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [lang, setLang] = useState<Language>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintDerived | null>(null);

  // --- Translation Helper ---
  const t = TRANSLATIONS[lang];

  // --- Initial Language Detection ---
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      setLang('cn');
    } else {
      setLang('en');
    }
  }, []);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'cn' : 'en');
  };

  // --- Data Hook ---
  const { blueprints, loading, error, refresh } = useBlueprintData();

  // --- Derived Data (Filters & Sorts) ---
  const categories = useMemo(() => {
    const cats = new Set(blueprints.map(b => b.c || 'Uncategorized'));
    return ['All', ...Array.from(cats).sort()];
  }, [blueprints]);

  const filteredAndSortedBlueprints = useMemo(() => {
    let result = blueprints;

    // Filter: Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.n.toLowerCase().includes(lower) || 
        b.a.toLowerCase().includes(lower) ||
        b.c.toLowerCase().includes(lower)
      );
    }

    // Filter: Category
    if (selectedCategory !== 'All') {
      result = result.filter(b => (b.c || 'Uncategorized') === selectedCategory);
    }

    // Sort
    return sortBlueprints(result, sortBy);

  }, [blueprints, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-rim-dark font-sans text-rim-text flex flex-col">
      {/* --- Header / Toolbar --- */}
      <header className="sticky top-0 z-40 bg-[#252526] border-b border-rim-border shadow-md">
        
        {/* Top Bar: Title & Language Switch */}
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                <Settings size={20} className="text-rim-green" />
                <span>{t.title}</span>
                <span className="text-xs font-normal text-rim-muted ml-2 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                    v1.2
                </span>
            </h1>

            {/* Language Switch */}
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 text-rim-muted hover:text-white px-3 py-1.5 rounded text-xs transition-colors border border-transparent hover:border-rim-border"
                title="Switch Language / 切换语言"
            >
                <Globe size={14} />
                <span className="font-bold">{lang === 'en' ? 'English' : '中文'}</span>
            </button>
        </div>

        {/* Control Bar: Search & Filters */}
        <div className="bg-[#1e1e1e] border-t border-rim-border/50 py-2">
            <div className="max-w-[1600px] mx-auto px-4 flex flex-col md:flex-row gap-3 items-center">
                
                {/* Search */}
                <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                    <span className="text-sm text-rim-muted hidden md:inline">
                       {lang === 'cn' ? '搜索:' : 'Search:'}
                    </span>
                    <div className="relative flex-grow md:w-64">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full bg-[#111] border border-rim-border text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:border-rim-orange transition-colors"
                        />
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rim-muted" />
                    </div>
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    
                    {/* Sort Dropdown */}
                    <div className="flex bg-rim-card border border-rim-border rounded overflow-hidden">
                        <div className="px-3 py-1.5 bg-[#333] text-rim-muted text-xs border-r border-rim-border flex items-center">
                           {t.sort}
                        </div>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-rim-card text-rim-text text-sm px-2 py-1.5 outline-none cursor-pointer hover:bg-[#333]"
                        >
                            <option value="newest">{t.sortNewest}</option>
                            <option value="score">{t.sortScore}</option>
                            <option value="downloads">{t.sortDownloads}</option>
                            <option value="likes">{t.sortLikes}</option>
                        </select>
                    </div>

                    {/* Category Dropdown */}
                    <div className="flex bg-rim-card border border-rim-border rounded overflow-hidden">
                         <div className="px-3 py-1.5 bg-[#333] text-rim-muted text-xs border-r border-rim-border flex items-center">
                           {t.category}
                        </div>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-rim-card text-rim-text text-sm px-2 py-1.5 outline-none cursor-pointer hover:bg-[#333] max-w-[150px]"
                        >
                            <option value="All">All</option>
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Refresh Button */}
                    <button 
                        onClick={refresh}
                        className="ml-auto md:ml-2 bg-[#333] hover:bg-[#444] text-rim-muted hover:text-white px-3 py-1.5 rounded border border-rim-border flex items-center gap-1 text-sm transition-all active:scale-95"
                    >
                        <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{loading ? t.refreshing : t.refresh}</span>
                    </button>
                </div>

            </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
            
            {/* Error State */}
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded mb-6 text-center">
                    <p className="font-bold">{t.error}</p>
                    <p className="text-sm opacity-80">{error}</p>
                    <p className="text-xs mt-2 text-rim-muted">Make sure index.json exists in the root directory.</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredAndSortedBlueprints.length === 0 && (
                <div className="text-center py-20 text-rim-muted">
                    <Filter size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg">{t.empty}</p>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredAndSortedBlueprints.map(bp => (
                    <BlueprintCard 
                        key={bp.id} 
                        blueprint={bp} 
                        onClick={() => setSelectedBlueprint(bp)} 
                        lang={lang}
                    />
                ))}
            </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-[#111] border-t border-rim-border py-4 text-center text-xs text-rim-muted">
        <p>{t.footer} &copy; {new Date().getFullYear()}</p>
        <p className="mt-1 opacity-50">{t.unofficial}</p>
      </footer>

      {/* --- Modal --- */}
      {selectedBlueprint && (
        <BlueprintDetail 
            blueprint={selectedBlueprint} 
            onClose={() => setSelectedBlueprint(null)} 
            lang={lang}
        />
      )}
    </div>
  );
};

export default App;
