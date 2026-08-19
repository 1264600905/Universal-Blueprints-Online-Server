import React from 'react';
import { Search, RotateCw, Settings, Globe, Filter } from 'lucide-react';
import { SortOption, TimeFilterOption, Language, CategoryCount, FilterCounts } from '../types';
import { getDisplayCategoryName } from '../utils/blueprintUtils';
import { APP_VERSION, TRANSLATIONS } from '../constants';

interface RemoteToolbarProps {
  lang: Language;
  toggleLanguage: () => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  timeRange: TimeFilterOption;
  setTimeRange: (val: TimeFilterOption) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: CategoryCount[];
  filterCounts: FilterCounts;
  loading: boolean;
  refresh: () => void;
  onOpenMobileFilter: () => void;
  onOpenAgreement: () => void;
  onOpenSponsorship: () => void;
  onOpenTutorial: () => void;
}

const RemoteToolbar: React.FC<RemoteToolbarProps> = ({
  lang, toggleLanguage, searchTerm, setSearchTerm,
  sortBy, setSortBy, timeRange, setTimeRange,
  selectedCategory, setSelectedCategory, categories, filterCounts,
  loading, refresh, onOpenMobileFilter, onOpenAgreement, onOpenSponsorship, onOpenTutorial
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-40 bg-rim-panel/95 backdrop-blur border-b border-rim-border shadow-md">
      {/* Top Bar: Title & Language Switch */}
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2.5">
              <div className="bg-rim-green/10 p-1.5 rounded-lg border border-rim-green/20">
                  <Settings size={20} className="text-rim-green" />
              </div>
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{t.title}</span>
              <span className="text-[10px] font-mono text-rim-green/80 ml-2 bg-rim-green/10 px-2 py-0.5 rounded border border-rim-green/20">
                  v{APP_VERSION}
              </span>
          </h1>

          {/* Agreement & Language Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTutorial}
              className="hidden sm:inline-flex items-center rounded-lg border border-white/5 bg-black/30 px-3 py-1.5 text-xs font-semibold text-rim-muted hover:border-rim-green/30 hover:text-white transition-all"
            >
              {t.tutorial}
            </button>
            <button
              onClick={onOpenSponsorship}
              className="hidden sm:inline-flex items-center rounded-lg border border-rim-orange/20 bg-rim-orange/10 px-3 py-1.5 text-xs font-semibold text-rim-orange hover:bg-rim-orange/20 transition-all"
            >
              {t.sponsorship}
            </button>
            <button
              onClick={onOpenAgreement}
              className="hidden sm:inline-flex items-center rounded-lg border border-white/5 bg-black/30 px-3 py-1.5 text-xs font-semibold text-rim-muted hover:border-rim-green/30 hover:text-white transition-all"
            >
              {t.agreement}
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-black/40 hover:bg-rim-border text-rim-muted hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all border border-white/5 hover:border-white/10"
              title="Switch Language / 切换语言"
          >
              <Globe size={14} className={lang === 'cn' ? 'text-rim-orange' : 'text-blue-400'} />
              <span className="font-bold">{lang === 'en' ? 'English' : '中文'}</span>
            </button>
          </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-black/20 border-t border-rim-border/50 py-3">
          <div className="max-w-[1600px] mx-auto px-4 flex flex-col md:flex-row gap-4 items-center">
              
              {/* Search */}
              <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                  <div className="relative w-full md:w-72 group">
                      <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={t.searchPlaceholder}
                          className="w-full bg-rim-dark/50 border border-rim-border text-white text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-rim-green/50 focus:ring-1 focus:ring-rim-green/50 transition-all"
                      />
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rim-muted group-focus-within:text-rim-green/80 transition-colors" />
                  </div>
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto hidden md:flex">
                  
                  {/* Sort Dropdown */}
                  <div className="flex bg-rim-dark/50 border border-rim-border rounded-lg overflow-hidden focus-within:border-rim-muted/50 transition-colors">
                      <div className="px-3 py-2 bg-black/40 text-rim-muted text-xs border-r border-rim-border flex items-center font-medium">
                         {t.sort}
                      </div>
                      <select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="bg-transparent text-rim-text text-sm px-3 py-2 outline-none cursor-pointer hover:bg-white/5 transition-colors"
                      >
                          <option className="bg-rim-panel" value="popularity">{t.sortPopularity} ({filterCounts.sort.popularity})</option>
                          <option className="bg-rim-panel" value="newest">{t.sortNewest} ({filterCounts.sort.newest})</option>
                          <option className="bg-rim-panel" value="downloads">{t.sortDownloads} ({filterCounts.sort.downloads})</option>
                          <option className="bg-rim-panel" value="likes">{t.sortLikes} ({filterCounts.sort.likes})</option>
                          <option className="bg-rim-panel" value="featured">{t.sortFeatured} ({filterCounts.sort.featured})</option>
                          <option className="bg-rim-panel" value="medal">{t.sortMedal} ({filterCounts.sort.medal})</option>
                      </select>
                  </div>

                  {/* Time Range Dropdown */}
                  <div className="flex bg-rim-dark/50 border border-rim-border rounded-lg overflow-hidden focus-within:border-rim-muted/50 transition-colors">
                       <div className="px-3 py-2 bg-black/40 text-rim-muted text-xs border-r border-rim-border flex items-center font-medium">
                         {t.timeRange}
                      </div>
                      <select 
                          value={timeRange} 
                          onChange={(e) => setTimeRange(e.target.value as TimeFilterOption)}
                          className="bg-transparent text-rim-text text-sm px-3 py-2 outline-none cursor-pointer hover:bg-white/5 transition-colors"
                      >
                          <option className="bg-rim-panel" value="all">{t.timeAll} ({filterCounts.time.all})</option>
                          <option className="bg-rim-panel" value="last7Days">{t.time7d} ({filterCounts.time.last7Days})</option>
                          <option className="bg-rim-panel" value="last15Days">{t.time15d} ({filterCounts.time.last15Days})</option>
                          <option className="bg-rim-panel" value="last30Days">{t.time30d} ({filterCounts.time.last30Days})</option>
                          <option className="bg-rim-panel" value="last3Months">{t.time3m} ({filterCounts.time.last3Months})</option>
                          <option className="bg-rim-panel" value="last6Months">{t.time6m} ({filterCounts.time.last6Months})</option>
                          <option className="bg-rim-panel" value="lastYear">{t.time1y} ({filterCounts.time.lastYear})</option>
                      </select>
                  </div>

                  {/* Category Dropdown */}
                  <div className="flex bg-rim-dark/50 border border-rim-border rounded-lg overflow-hidden focus-within:border-rim-muted/50 transition-colors">
                       <div className="px-3 py-2 bg-black/40 text-rim-muted text-xs border-r border-rim-border flex items-center font-medium">
                         {t.category}
                      </div>
                      <select 
                          value={selectedCategory} 
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="bg-transparent text-rim-text text-sm px-3 py-2 outline-none cursor-pointer hover:bg-white/5 transition-colors max-w-[200px]"
                      >
                          {categories.map(c => (
                            <option className="bg-rim-panel" key={c.name} value={c.name}>
                              {getDisplayCategoryName(c.name, lang)} ({c.count})
                            </option>
                          ))}
                      </select>
                  </div>

                  {/* Refresh Button */}
                  <button 
                      onClick={refresh}
                      className="ml-auto md:ml-2 bg-rim-dark/50 hover:bg-rim-border text-rim-muted hover:text-white px-4 py-2 rounded-lg border border-rim-border flex items-center gap-2 text-sm transition-all active:scale-95"
                  >
                      <RotateCw size={14} className={loading ? 'animate-spin text-rim-green' : ''} />
                      <span className="hidden sm:inline font-medium">{loading ? t.refreshing : t.refresh}</span>
                  </button>
              </div>

              {/* Mobile Filter Toggle */}
              <div className="flex w-full md:hidden gap-3">
                <button
                    onClick={onOpenMobileFilter}
                    className="flex-1 flex items-center justify-center gap-2 bg-rim-dark/50 hover:bg-rim-border text-white px-4 py-2 rounded-lg border border-rim-border text-sm font-medium transition-colors"
                >
                    <Filter size={16} className="text-rim-orange" />
                    {t.filters}
                </button>
                <button
                    onClick={onOpenTutorial}
                    className="flex items-center justify-center bg-rim-dark/50 hover:bg-rim-border text-rim-muted hover:text-white px-3 py-2 rounded-lg border border-rim-border text-sm transition-colors"
                    title={t.tutorial}
                >
                    <span>{t.tutorial}</span>
                </button>
                <button
                    onClick={onOpenSponsorship}
                    className="flex items-center justify-center bg-rim-orange/10 hover:bg-rim-orange/20 text-rim-orange px-3 py-2 rounded-lg border border-rim-orange/20 text-sm transition-colors"
                    title={t.sponsorship}
                >
                    <span>{t.sponsorship}</span>
                </button>
                <button
                    onClick={onOpenAgreement}
                    className="flex items-center justify-center bg-rim-dark/50 hover:bg-rim-border text-rim-muted hover:text-white px-3 py-2 rounded-lg border border-rim-border text-sm transition-colors"
                    title={t.agreement}
                >
                    <span className="sm:hidden">{t.agreement}</span>
                </button>
                <button 
                    onClick={refresh}
                    className="bg-rim-dark/50 hover:bg-rim-border text-rim-muted hover:text-white px-4 py-2 rounded-lg border border-rim-border flex items-center justify-center transition-all active:scale-95"
                >
                    <RotateCw size={18} className={loading ? 'animate-spin text-rim-green' : ''} />
                </button>
              </div>
          </div>
      </div>
    </header>
  );
};

export default RemoteToolbar;