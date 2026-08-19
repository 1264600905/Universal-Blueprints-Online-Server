import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface BlueprintImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const BlueprintImageViewer: React.FC<BlueprintImageViewerProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.1;
    const delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center overflow-hidden animate-in fade-in duration-200"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Toolbar */}
      <div className="absolute top-4 right-4 z-[70] flex items-center gap-2">
        <button onClick={handleZoomOut} className="p-2 bg-black/50 text-white rounded-full hover:bg-rim-panel transition-colors" title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <button onClick={handleReset} className="p-2 bg-black/50 text-white rounded-full hover:bg-rim-panel transition-colors" title="Reset View">
          <Maximize size={20} />
        </button>
        <button onClick={handleZoomIn} className="p-2 bg-black/50 text-white rounded-full hover:bg-rim-panel transition-colors" title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <div className="w-px h-6 bg-rim-border mx-1"></div>
        <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full hover:bg-rim-orange transition-colors" title="Close">
          <X size={24} />
        </button>
      </div>

      {/* Image Area */}
      <div 
        className={`w-full h-full flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="max-w-full max-h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default BlueprintImageViewer;