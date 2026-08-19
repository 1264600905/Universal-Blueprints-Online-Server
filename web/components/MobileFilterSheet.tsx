import React from 'react';
import { X } from 'lucide-react';
import { SortOption, TimeFilterOption, Language, CategoryCount, FilterCounts } from '../types';
import { getDisplayCategoryName } from '../utils/blueprintUtils';
import { TRANSLATIONS } from '../constants';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  timeRange: TimeFilterOption;
  setTimeRange: (val: TimeFilterOption) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: CategoryCount[];
  filterCounts: FilterCounts;
}

const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  isOpen, onClose, lang,
  sortBy, setSortBy, timeRange, setTimeRange,
  selectedCategory, setSelectedCategory, categories, filterCounts
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div 
        className="w-full bg-rim-panel border-t border-rim-border rounded-t-xl p-4 md:p-6 pb-8 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide">{t.filters}</h2>
          <button onClick={onClose} className="p-2 text-rim-muted hover:text-white rounded-full hover:bg-rim-border/50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Sort Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-rim-muted uppercase tracking-wider">{t.sort}</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-rim-card border border-rim-border text-rim-text text-base px-4 py-3 rounded-lg outline-none focus:border-rim-green/50 transition-colors"
            >
              <option value="popularity">{t.sortPopularity} ({filterCounts.sort.popularity})</option>
              <option value="newest">{t.sortNewest} ({filterCounts.sort.newest})</option>
              <option value="downloads">{t.sortDownloads} ({filterCounts.sort.downloads})</option>
              <option value="likes">{t.sortLikes} ({filterCounts.sort.likes})</option>
              <option value="featured">{t.sortFeatured} ({filterCounts.sort.featured})</option>
              <option value="medal">{t.sortMedal} ({filterCounts.sort.medal})</option>
            </select>
          </div>

          {/* Time Range Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-rim-muted uppercase tracking-wider">{t.timeRange}</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as TimeFilterOption)}
              className="bg-rim-card border border-rim-border text-rim-text text-base px-4 py-3 rounded-lg outline-none focus:border-rim-green/50 transition-colors"
            >
              <option value="all">{t.timeAll} ({filterCounts.time.all})</option>
              <option value="last7Days">{t.time7d} ({filterCounts.time.last7Days})</option>
              <option value="last15Days">{t.time15d} ({filterCounts.time.last15Days})</option>
              <option value="last30Days">{t.time30d} ({filterCounts.time.last30Days})</option>
              <option value="last3Months">{t.time3m} ({filterCounts.time.last3Months})</option>
              <option value="last6Months">{t.time6m} ({filterCounts.time.last6Months})</option>
              <option value="lastYear">{t.time1y} ({filterCounts.time.lastYear})</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-rim-muted uppercase tracking-wider">{t.category}</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-rim-card border border-rim-border text-rim-text text-base px-4 py-3 rounded-lg outline-none focus:border-rim-green/50 transition-colors"
            >
              {categories.map((c: CategoryCount) => (
                <option key={c.name} value={c.name}>
                  {getDisplayCategoryName(c.name, lang)} ({c.count})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-6 bg-rim-green/90 hover:bg-rim-green text-black font-bold py-3.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(74,222,128,0.2)] active:scale-[0.98]"
          >
            {t.applyFilters}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterSheet;