import React from 'react';
import { X, Copy, Calendar, Layers, Hash, FileText } from 'lucide-react';
import { BlueprintDerived, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BlueprintDetailProps {
  blueprint: BlueprintDerived;
  onClose: () => void;
  lang: Language;
}

const BlueprintDetail: React.FC<BlueprintDetailProps> = ({ blueprint, onClose, lang }) => {
  const t = TRANSLATIONS[lang];

  // Prevent click propagation to close modal when clicking inside content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const copyId = () => {
    navigator.clipboard.writeText(blueprint.id);
    alert(t.copied);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-rim-panel border border-rim-border w-full max-w-7xl max-h-[95vh] flex flex-col md:flex-row shadow-2xl rounded-sm overflow-hidden"
        onClick={handleContentClick}
      >
        {/* Left: Image Container (Larger area) */}
        <div className="w-full md:w-3/5 bg-black/60 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-rim-border min-h-[40vh] md:h-auto">
          <img 
            src={blueprint.imageMain} 
            alt={blueprint.n} 
            className="max-w-full max-h-full object-contain p-4"
          />
          {/* Close button for mobile inside image area */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden bg-black/50 text-white p-2 rounded-full hover:bg-rim-orange transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Right: Info Scrollable Area */}
        <div className="w-full md:w-2/5 flex flex-col bg-rim-panel text-rim-text h-full">
            
            {/* Header (Sticky-ish visual) */}
            <div className="p-6 pb-4 border-b border-rim-border bg-rim-panel shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{blueprint.n}</h2>
                        <p className="text-rim-green text-sm flex items-center gap-2">
                            <span className="text-rim-muted">{t.author}</span>
                            <span className="font-semibold text-white">{blueprint.a}</span>
                            <span className="w-1 h-1 bg-rim-muted rounded-full"></span>
                            <span className="bg-rim-border/50 px-2 py-0.5 rounded text-xs text-rim-muted border border-rim-border">{blueprint.c}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="hidden md:block text-rim-muted hover:text-white transition-colors p-1 hover:bg-rim-border rounded">
                        <X size={28} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Description Section */}
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-rim-muted uppercase tracking-wider mb-2">
                        <FileText size={16} /> {t.description}
                    </h3>
                    <div className="bg-black/20 p-4 rounded border border-rim-border/50 text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                        {blueprint.t ? blueprint.t : <span className="italic opacity-50">No description provided.</span>}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded border border-rim-border/50">
                        <span className="text-rim-muted block text-xs uppercase tracking-wider mb-1">{t.dimensions}</span>
                        <span className="text-xl font-mono text-white">{blueprint.w} x {blueprint.h}</span>
                    </div>
                     <div className="bg-black/20 p-3 rounded border border-rim-border/50">
                        <span className="text-rim-muted block text-xs uppercase tracking-wider mb-1">{t.downloads}</span>
                        <span className="text-xl font-mono text-white">{blueprint.s_dl}</span>
                    </div>
                     <div className="bg-black/20 p-3 rounded border border-rim-border/50">
                        <span className="text-rim-muted block text-xs uppercase tracking-wider mb-1">{t.likes}</span>
                        <span className="text-xl font-mono text-rim-green">{blueprint.s_l}</span>
                    </div>
                    <div className="bg-black/20 p-3 rounded border border-rim-border/50">
                        <span className="text-rim-muted block text-xs uppercase tracking-wider mb-1">{t.version}</span>
                        <span className="text-xl font-mono text-white">{blueprint.v}</span>
                    </div>
                </div>

                {/* Mods */}
                <div>
                    <h4 className="flex items-center gap-2 font-bold text-white mb-3 pb-1 border-b border-rim-border">
                        <Layers size={18} className="text-rim-orange" />
                        {t.reqMods} ({blueprint.m.length})
                    </h4>
                    {blueprint.m.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {blueprint.m.map((mod, idx) => (
                                <span key={idx} className="bg-black/40 border border-rim-border px-2 py-1 text-xs rounded text-rim-text" title={mod}>
                                    {mod}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-rim-green/10 border border-rim-green/20 text-rim-green px-3 py-2 rounded text-sm text-center">
                            {t.noMods}
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs text-rim-muted pt-2 border-t border-rim-border/30">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{t.uploaded}: <br/><span className="text-rim-text">{new Date(blueprint.dt).toLocaleDateString()}</span></span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{t.updated}: <br/><span className="text-rim-text">{new Date(blueprint.ut).toLocaleDateString()}</span></span>
                    </div>
                </div>
            </div>

            {/* Footer / ID Section (Fixed bottom) */}
            <div className="p-4 bg-[#151515] border-t border-rim-border shrink-0">
                 <div className="bg-black/40 p-3 rounded flex items-center justify-between border border-rim-border/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Hash size={16} className="text-rim-muted shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-rim-muted uppercase tracking-widest">Blueprint ID</span>
                            <code className="text-xs text-white truncate font-mono select-all">
                                {blueprint.id}
                            </code>
                        </div>
                    </div>
                    <button 
                        onClick={copyId}
                        className="ml-2 p-2 hover:bg-rim-card rounded transition-colors text-rim-green bg-rim-green/10 border border-rim-green/20"
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