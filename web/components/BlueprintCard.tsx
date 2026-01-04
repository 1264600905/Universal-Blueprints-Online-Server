import React, { useState } from 'react';
import { ThumbsUp, Download, Diamond, AlertCircle, Box, Layers } from 'lucide-react';
import { BlueprintDerived, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BlueprintCardProps {
  blueprint: BlueprintDerived;
  onClick: () => void;
  lang: Language;
}

const BlueprintCard: React.FC<BlueprintCardProps> = ({ blueprint, onClick, lang }) => {
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const t = TRANSLATIONS[lang];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);

    try {
      // 下载主图片
      const response = await fetch(blueprint.imageMain);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${blueprint.n}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div 
      className="group relative flex flex-col bg-rim-card border border-rim-border hover:border-rim-green transition-all duration-200 cursor-pointer overflow-hidden shadow-lg"
      onClick={onClick}
    >
      {/* Top Right: Mod Count Badge (Replaced Checkmark) */}
      <div 
        className={`absolute top-2 right-2 z-10 p-1 px-2 rounded shadow-sm opacity-90 flex items-center gap-1.5 text-xs font-bold border ${blueprint.m.length > 0 ? 'bg-rim-panel border-rim-border text-rim-text' : 'bg-rim-green text-black border-transparent'}`}
        title={`${blueprint.m.length} ${t.modsCount}`}
      >
        <Layers size={14} />
        <span>{blueprint.m.length}</span>
      </div>

      {/* Image Area */}
      <div className="relative aspect-[4/3] bg-black/40 overflow-hidden border-b border-rim-border">
        {imgError ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-rim-muted">
            <AlertCircle size={32} />
            <span className="text-xs mt-2">{t.imageMissing}</span>
          </div>
        ) : (
          <img 
            src={blueprint.imageMinimap} 
            alt={blueprint.n}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
                // Fallback to main image if minimap fails, then to error state
                const target = e.target as HTMLImageElement;
                if (target.src !== blueprint.imageMain) {
                    target.src = blueprint.imageMain;
                } else {
                    setImgError(true);
                }
            }}
          />
        )}

        {/* Featured Badge (Bottom Right) */}
        {blueprint.fe === 1 && (
             <div className="absolute bottom-2 right-2 drop-shadow-lg">
                <img
                  src="/Featured.png"
                  alt="Featured"
                  className="w-8 h-8 object-contain"
                />
            </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col gap-1 flex-grow">
        {/* Title and Author */}
        <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-rim-text leading-tight line-clamp-1 group-hover:text-white" title={blueprint.n}>
            {blueprint.n}
            </h3>
        </div>
        
        <div className="flex justify-between items-center text-xs text-rim-muted mb-2">
            <span>{t.author} <span className="text-rim-text">{blueprint.a === 'Unknown' ? t.unknown : blueprint.a}</span></span>
            <span className="text-rim-green font-mono">{blueprint.w}x{blueprint.h}</span>
        </div>

        {/* Stats Row */}
        <div className="mt-auto flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div className="flex items-center gap-4 text-rim-muted">
                <div className="flex items-center gap-1 hover:text-rim-text transition-colors">
                    <ThumbsUp size={14} className={blueprint.s_l > 0 ? "text-rim-text" : ""} />
                    <span>{blueprint.s_l}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-rim-text transition-colors">
                    <Download size={14} className={blueprint.s_dl > 0 ? "text-rim-text" : ""} />
                    <span>{blueprint.s_dl}</span>
                </div>
            </div>

            {/* Rating Smiley - Only if valid rating */}
            {blueprint.rating !== null && (
                <div className="flex items-center gap-1 text-rim-green font-bold">
                     <span>{Math.round(blueprint.rating)}%</span>
                </div>
            )}
            
            {/* Fallback dash if no rating */}
             {blueprint.rating === null && (
                <span className="text-rim-muted">-</span>
            )}
        </div>

        {/* Big Action Button */}
        <div
          className={`mt-2 w-full text-rim-text text-center py-1 text-xs border transition-colors rounded-sm cursor-pointer ${downloading ? 'bg-rim-muted text-black border-rim-muted' : 'bg-[#3a3a3a] hover:bg-[#4a4a4a] border-transparent hover:border-rim-muted'}`}
          onClick={handleDownload}
        >
            {downloading ? 'Downloading...' : t.download}
        </div>
      </div>
    </div>
  );
};

export default BlueprintCard;
