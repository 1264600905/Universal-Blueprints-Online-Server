import React, { useEffect, useRef, useState } from 'react';
import { ThumbsUp, Download, AlertCircle, Layers, Clock, Tag } from 'lucide-react';
import { BlueprintListItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { formatBlueprintDate, resolveAssetUrl } from '../utils/blueprintUtils';
import { getCachedImageObjectUrl, ImageRequest, requestImage } from '../utils/imageLoadQueue';

interface BlueprintCardProps {
  blueprint: BlueprintListItem;
  onClick: () => void;
  lang: Language;
  imagePriority?: number;
}

type ImageStage = 'minimap' | 'main' | 'missing';

const getImageUrl = (blueprint: BlueprintListItem, stage: ImageStage) =>
  stage === 'main' ? blueprint.imageMain : blueprint.imageMinimap;

const BlueprintCard: React.FC<BlueprintCardProps> = ({ blueprint, onClick, lang, imagePriority = 0 }) => {
  const [imageStage, setImageStage] = useState<ImageStage>('minimap');
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(() => getCachedImageObjectUrl(blueprint.imageMinimap));
  const [imageLoading, setImageLoading] = useState(() => !getCachedImageObjectUrl(blueprint.imageMinimap));
  const [imageMissing, setImageMissing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const imageRequestRef = useRef<ImageRequest | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    let active = true;
    const imageUrl = getImageUrl(blueprint, imageStage);
    const cachedObjectUrl = getCachedImageObjectUrl(imageUrl);

    setImageMissing(false);
    setImageObjectUrl(cachedObjectUrl);
    setImageLoading(!cachedObjectUrl);

    if (cachedObjectUrl) return () => { active = false; };

    const request = requestImage(imageUrl, imagePriority);
    imageRequestRef.current = request;
    request.promise
      .then(objectUrl => {
        if (!active) return;
        setImageObjectUrl(objectUrl);
        setImageLoading(false);
      })
      .catch(error => {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (imageStage === 'minimap') {
          setImageStage('main');
        } else {
          setImageLoading(false);
          setImageMissing(true);
        }
      });

    return () => {
      active = false;
      if (imageRequestRef.current === request) imageRequestRef.current = null;
      request.cancel();
    };
  }, [blueprint, imageStage]);

  // Scrolling changes priority, not the image URL. Reprioritize the existing
  // queue entry instead of cancelling and restarting the network request.
  useEffect(() => {
    imageRequestRef.current?.setPriority(imagePriority);
  }, [imagePriority]);

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
      className="group relative flex h-full flex-col bg-rim-card rounded-2xl border border-rim-border hover:border-rim-green/50 transition-[border-color,box-shadow,transform] duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-xl hover:shadow-rim-green/5 md:hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Top Right: Mod Count Badge */}
      <div 
        className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-lg shadow-sm backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold border transition-colors ${blueprint.m.length > 0 ? 'bg-black/60 border-white/10 text-rim-text' : 'bg-rim-green/90 text-black border-transparent'}`}
        title={`${blueprint.m.length} ${t.modsCount}`}
      >
        <Layers size={12} />
        <span>{blueprint.m.length}</span>
      </div>

      {/* Image Area */}
      <div className="relative aspect-[4/3] bg-black/60 overflow-hidden border-b border-rim-border/50">
        <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] z-[1] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {imageMissing ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-rim-muted/50 bg-gradient-to-br from-white/[0.03] to-transparent">
            <AlertCircle size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-medium">{t.imageMissing}</span>
          </div>
        ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 overflow-hidden bg-[#11141a]">
                <div className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              </div>
            )}
            <img
              src={imageObjectUrl ?? undefined}
              alt={blueprint.n}
              decoding="async"
              className={`w-full h-full object-cover transition-[opacity,transform] duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'} group-hover:scale-105`}
            />
          </>
        )}

        {/* Featured Badge (Bottom Right) */}
        {blueprint.fe === 1 && (
             <div className="absolute bottom-3 right-3 z-10 drop-shadow-lg">
                <img
                  src={resolveAssetUrl('/Featured.png')}
                  alt="Featured"
                  className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
                />
            </div>
        )}

        {/* Architectural Medal (Bottom Left) */}
        {(blueprint.am || 0) === 1 && (
             <div className="absolute bottom-3 left-3 z-10 drop-shadow-lg" title={lang === 'cn' ? '建筑学勋章' : 'Architectural Medal'}>
                <img
                  src={resolveAssetUrl('/Medal.png')}
                  alt="Medal"
                  className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                />
            </div>
        )}
      </div>

      {/* Info Section */}
      <div className="h-[184px] p-4 flex flex-col gap-2 flex-grow bg-gradient-to-b from-rim-card to-[#15171d]">
        {/* Title */}
        <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-1 group-hover:text-rim-green transition-colors" title={blueprint.n}>
          {blueprint.n}
        </h3>
        
        {/* Author & Size */}
        <div className="flex justify-between items-center text-xs text-rim-muted">
            <span className="truncate pr-2">{t.author} <span className="text-rim-text font-medium">{blueprint.a === 'Unknown' ? t.unknown : blueprint.a}</span></span>
            <span className="text-rim-green/90 font-mono bg-rim-green/10 px-1.5 py-0.5 rounded border border-rim-green/20 whitespace-nowrap shrink-0">{blueprint.w}x{blueprint.h}</span>
        </div>

        {/* Time and Version */}
        <div className="flex justify-between items-center text-[10px] text-rim-muted/70 mt-1">
            <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-rim-muted/50" />
                <span>{formatBlueprintDate(blueprint.ut || blueprint.dt, lang)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-1.5 py-0.5 rounded">
                <Tag size={10} className="text-rim-muted/50" />
                <span>v{blueprint.v}</span>
            </div>
        </div>

        {/* Stats Row & Download */}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs border-t border-rim-border/50">
            <div className="flex items-center gap-3 text-rim-muted font-medium">
                <div className="flex items-center gap-1 hover:text-rim-green transition-colors" title={t.likes}>
                    <ThumbsUp size={14} className={blueprint.s_l > 0 ? "text-rim-green/70" : ""} />
                    <span>{blueprint.s_l}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-rim-text transition-colors" title={t.downloads}>
                    <Download size={14} className={blueprint.s_dl > 0 ? "text-white/70" : ""} />
                    <span>{blueprint.s_dl}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Rating Smiley - Only if valid rating */}
                {blueprint.rating !== null && (
                    <div className="flex items-center gap-1 text-rim-orange font-bold text-[11px] bg-rim-orange/10 px-1.5 py-0.5 rounded border border-rim-orange/20">
                         <span>{Math.round(blueprint.rating)}%</span>
                    </div>
                )}
                
                {/* Download Action Button */}
                <button
                  className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${downloading ? 'bg-rim-border text-rim-muted cursor-not-allowed' : 'bg-rim-green/10 text-rim-green hover:bg-rim-green hover:text-black hover:scale-110'}`}
                  onClick={handleDownload}
                  title={t.download}
                >
                    <Download size={14} className={downloading ? "animate-pulse" : ""} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintCard;
