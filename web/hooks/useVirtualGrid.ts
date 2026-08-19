import { RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

interface VirtualGridOptions {
  itemCount: number;
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  minColumnWidth?: number;
  maxColumnCount?: number;
  gap?: number;
  cardImageAspectRatio?: number;
  cardContentHeight?: number;
  overscanRows?: number;
}

interface VirtualGridResult {
  columnCount: number;
  rowCount: number;
  rowHeight: number;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  offsetTop: number;
}

export const useVirtualGrid = ({
  itemCount,
  containerRef,
  enabled = true,
  minColumnWidth = 160,
  maxColumnCount = 6,
  gap = 16,
  cardImageAspectRatio = 4 / 3,
  cardContentHeight = 184,
  overscanRows = 3,
}: VirtualGridOptions): VirtualGridResult => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewport, setViewport] = useState({ scrollY: window.scrollY, height: window.innerHeight });

  const measureContainer = useCallback(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    setContainerWidth(current => current === width ? current : width);
  }, [containerRef]);

  useLayoutEffect(() => {
    if (!enabled) return;

    let frame = window.requestAnimationFrame(measureContainer);
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(() => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureContainer);
    });
    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [containerRef, enabled, itemCount, measureContainer]);

  useEffect(() => {
    let frame = 0;
    const updateViewport = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setViewport({ scrollY: window.scrollY, height: window.innerHeight });
      });
    };

    window.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return useMemo(() => {
    // When returning from a hash page, the grid can render for one frame before
    // its ref is measurable. Use a viewport-based fallback so it never flashes
    // as a single giant column during that frame.
    const fallbackWidth = Math.max(320, Math.min(1600, window.innerWidth - 32));
    const safeWidth = Math.max(containerWidth || fallbackWidth, 1);
    const columnCount = Math.max(1, Math.min(maxColumnCount, Math.floor((safeWidth + gap) / (minColumnWidth + gap))));
    const columnWidth = (safeWidth - gap * (columnCount - 1)) / columnCount;
    const rowHeight = Math.max(1, columnWidth / cardImageAspectRatio + cardContentHeight + gap);
    const rowCount = Math.ceil(itemCount / columnCount);
    const containerTop = containerRef.current?.getBoundingClientRect().top
      ? (containerRef.current?.getBoundingClientRect().top ?? 0) + viewport.scrollY
      : 0;
    const visibleTop = Math.max(0, viewport.scrollY - containerTop);
    const visibleBottom = Math.max(0, viewport.scrollY + viewport.height - containerTop);
    const visibleStartRow = Math.max(0, Math.floor(visibleTop / rowHeight));
    const visibleEndRow = Math.min(rowCount, Math.max(visibleStartRow + 1, Math.ceil(visibleBottom / rowHeight)));
    const startRow = Math.max(0, visibleStartRow - overscanRows);
    const endRow = Math.min(rowCount, visibleEndRow + overscanRows);

    return {
      columnCount,
      rowCount,
      rowHeight,
      totalHeight: Math.max(0, rowCount * rowHeight - gap),
      startIndex: Math.min(itemCount, startRow * columnCount),
      endIndex: Math.min(itemCount, endRow * columnCount),
      visibleStartIndex: Math.min(itemCount, visibleStartRow * columnCount),
      visibleEndIndex: Math.min(itemCount, visibleEndRow * columnCount),
      offsetTop: startRow * rowHeight,
    };
  }, [cardContentHeight, cardImageAspectRatio, containerRef, containerWidth, gap, itemCount, maxColumnCount, minColumnWidth, overscanRows, viewport]);
};
