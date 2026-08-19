import React, { useState, useRef } from 'react';
import { X, Copy, Calendar, Layers, Hash, FileText, ExternalLink, Loader2, AlertCircle, Maximize2, Download, ThumbsUp, ZoomIn, ZoomOut } from 'lucide-react';
import { BlueprintListItem, BlueprintDetailData, Language, ModInfo } from '../types';
import { TRANSLATIONS } from '../constants';
import { formatBlueprintDate } from '../utils/blueprintUtils';

interface BlueprintDetailProps {
  blueprint: BlueprintListItem;
  detailData: BlueprintDetailData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenImageViewer: () => void;
  lang: Language;
}

const BlueprintDetail: React.FC<BlueprintDetailProps> = ({ 
  blueprint, detailData, loading, error, onClose, onOpenImageViewer, lang 
}) => {
  const t = TRANSLATIONS[lang];

  // Zoom and Drag States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Prevent click propagation to close modal when clicking inside content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const copyId = () => {
    navigator.clipboard.writeText(blueprint.id);
    alert(t.copied);
  };

  // Image Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.1;
    const delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const modsList: ModInfo[] = detailData?.mods?.length && detailData.mods.length > 0 
      ? detailData.mods 
      : blueprint.m.map(pkgId => ({ packageId: pkgId, name: pkgId }));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-6 md:p-10 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-rim-panel border border-white/10 w-full max-w-7xl max-h-[95vh] flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/5"
        onClick={handleContentClick}
      >
        {/* Left: Image Container (Larger area) */}
        <div 
          className="w-full md:w-[55%] lg:w-[60%] bg-[#0a0a0c] relative flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5 min-h-[35vh] shrink-0 md:shrink md:h-auto group overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[1] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <img 
            src={blueprint.imageMain} 
            alt={blueprint.n} 
            className="max-w-full max-h-full object-contain p-4 md:p-8 select-none pointer-events-none"
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          />
          {/* Close button for mobile inside image area */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden bg-black/60 text-white p-2.5 rounded-full hover:bg-rim-orange transition-colors z-10 backdrop-blur-sm"
          >
            <X size={20} />
          </button>
          
          {/* Quick Zoom Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button onClick={handleZoomIn} className="bg-black/60 text-white p-2 rounded-full hover:bg-white/20 backdrop-blur-sm" title="Zoom In"><ZoomIn size={16} /></button>
            <button onClick={handleZoomOut} className="bg-black/60 text-white p-2 rounded-full hover:bg-white/20 backdrop-blur-sm" title="Zoom Out"><ZoomOut size={16} /></button>
            {scale !== 1 && (
                <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm hover:bg-white/20">{t.reset}</button>
             )}
          </div>

          {/* Fullscreen Image Button */}
          <button
            onClick={onOpenImageViewer}
            className="absolute bottom-6 right-6 bg-black/70 text-white p-3 rounded-full hover:bg-rim-green hover:text-black hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 backdrop-blur-sm shadow-lg"
            title="View Full Image"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Right: Info Scrollable Area */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col bg-rim-panel text-rim-text flex-1 min-h-0 relative">
            
            {/* Header (Sticky-ish visual) */}
            <div className="p-6 md:p-8 pb-5 border-b border-white/5 bg-rim-panel/95 backdrop-blur shrink-0 z-10">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight tracking-tight">{blueprint.n}</h2>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-sm">
                            <div className="flex items-center gap-1.5">
                                <span className="text-rim-muted">{t.author}</span>
                                <span className="font-semibold text-rim-text">{blueprint.a}</span>
                            </div>
                            <span className="w-1 h-1 bg-rim-muted/50 rounded-full"></span>
                            <span className="bg-white/5 px-2.5 py-1 rounded-md text-xs font-medium text-rim-muted border border-white/10 tracking-wide uppercase">{blueprint.c}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="hidden md:flex text-rim-muted/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full shrink-0 mt-1">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-rim-panel to-[#111216]">
                
                {/* Description Section */}
                <div className="bg-black/30 p-5 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-rim-muted uppercase tracking-wider">
                            <FileText size={16} className="text-rim-orange" /> {t.description}
                        </h3>
                        {loading && <Loader2 size={14} className="animate-spin text-rim-muted" />}
                    </div>
                    <div className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                        {error ? (
                            <div className="text-rim-orange flex items-center gap-2">
                                <AlertCircle size={16} />
                                <span>{t.failedToLoad}</span>
                            </div>
                        ) : loading && !detailData ? (
                            <span className="italic opacity-50">{t.loadingDetails}</span>
                        ) : detailData?.description ? (
                            detailData.description
                        ) : (
                            <span className="italic opacity-50">{t.noDescription}</span>
                        )}
                    </div>
                </div>

                {/* Reference URL (if available) */}
                {detailData?.referenceUrl && (
                    <div className="pt-2">
                        <a 
                            href={detailData.referenceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-rim-orange hover:text-white transition-colors bg-rim-orange/10 border border-rim-orange/20 px-3 py-1.5 rounded-full"
                        >
                            <ExternalLink size={14} />
                            {t.tutorialVideo}: {detailData.referenceUrlName || detailData.referenceUrl}
                        </a>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                        <span className="text-rim-muted text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Maximize2 size={12}/>{t.dimensions}</span>
                        <span className="text-lg font-mono text-white tracking-tight">{blueprint.w} <span className="text-rim-muted text-sm mx-1">x</span> {blueprint.h}</span>
                    </div>
                     <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                        <span className="text-rim-muted text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Download size={12}/>{t.downloads}</span>
                        <span className="text-lg font-mono text-white tracking-tight">{blueprint.s_dl}</span>
                    </div>
                     <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                        <span className="text-rim-muted text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><ThumbsUp size={12}/>{t.likes}</span>
                        <span className="text-lg font-mono text-rim-green tracking-tight">{blueprint.s_l}</span>
                    </div>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                        <span className="text-rim-muted text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Hash size={12}/>{t.version}</span>
                        <span className="text-lg font-mono text-white tracking-tight">{blueprint.v}</span>
                    </div>
                </div>

                {/* Mods */}
                <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                    <h4 className="flex items-center gap-2 font-bold text-white mb-4 pb-2 border-b border-white/10">
                        <Layers size={18} className="text-rim-green" />
                        {t.reqMods} 
                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-mono ml-1">
                          {modsList.length}
                        </span>
                    </h4>
                    {modsList.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {modsList.map((mod, idx) => {
                                const isOfficial = mod.packageId.toLowerCase().startsWith('ludeon.rimworld');
                                return (
                                  <span 
                                    key={idx} 
                                    className={`border transition-colors px-2.5 py-1 text-xs rounded-md ${
                                      isOfficial 
                                        ? 'bg-rim-green/10 border-rim-green/30 text-rim-green hover:border-rim-green/50' 
                                        : 'bg-black/50 border-white/10 text-gray-300 hover:border-white/20'
                                    }`} 
                                    title={mod.packageId}
                                  >
                                      {mod.name}
                                  </span>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-rim-green/5 border border-rim-green/10 text-rim-green/80 px-3 py-2.5 rounded-lg text-sm text-center font-medium">
                            {t.noMods}
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="flex flex-row justify-between bg-black/20 p-4 rounded-xl border border-white/5 text-xs text-rim-muted/80">
                    <div className="flex items-center gap-2.5">
                        <Calendar size={14} className="text-rim-muted" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider">{t.uploaded}</span>
                            <span className="text-white font-medium">{formatBlueprintDate(blueprint.dt, lang)}</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2.5">
                        <Calendar size={14} className="text-rim-muted" />
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase tracking-wider">{t.updated}</span>
                            <span className="text-white font-medium">{formatBlueprintDate(blueprint.ut || blueprint.dt, lang)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / ID Section (Fixed bottom) */}
            <div className="p-5 bg-rim-panel border-t border-white/5 shrink-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                 <div className="bg-[#0a0a0c] p-3 rounded-xl flex items-center justify-between border border-white/5 ring-1 ring-white/5">
                    <div className="flex items-center gap-4 overflow-hidden px-2">
                        <div className="bg-white/5 p-2 rounded-lg">
                            <Hash size={16} className="text-rim-muted shrink-0" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-rim-muted uppercase tracking-widest font-bold mb-0.5">{t.blueprintId}</span>
                            <code className="text-sm text-white/90 truncate font-mono select-all">
                                {blueprint.id}
                            </code>
                        </div>
                    </div>
                    <button 
                        onClick={copyId}
                        className="ml-3 p-2.5 hover:bg-rim-green/20 hover:text-rim-green hover:scale-105 rounded-lg transition-all text-rim-green/80 bg-rim-green/10 border border-rim-green/20"
                        title={t.copyId}
                    >
                        <Copy size={18} />
                    </button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintDetail;