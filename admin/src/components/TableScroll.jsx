import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * TableScroll provides a synchronized top horizontal scrollbar directly above
 * the table header / first column, as well as distinct styled scrollbars,
 * allowing effortless left-to-right scrolling on desktop and mobile.
 */
export default function TableScroll({ children, className = '' }) {
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [topClientWidth, setTopClientWidth] = useState(0);
  const isSyncingTop = useRef(false);
  const isSyncingBottom = useRef(false);

  const updateDimensions = useCallback(() => {
    if (bottomScrollRef.current) {
      setScrollWidth(bottomScrollRef.current.scrollWidth);
      setClientWidth(bottomScrollRef.current.clientWidth);
    }
    if (topScrollRef.current) {
      setTopClientWidth(topScrollRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateDimensions();

    const handleResize = () => updateDimensions();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => updateDimensions());
    if (bottomScrollRef.current) {
      observer.observe(bottomScrollRef.current);
      if (bottomScrollRef.current.firstElementChild) {
        observer.observe(bottomScrollRef.current.firstElementChild);
      }
    }
    if (topScrollRef.current) {
      observer.observe(topScrollRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updateDimensions]);

  const handleTopScroll = () => {
    if (isSyncingTop.current) {
      isSyncingTop.current = false;
      return;
    }
    if (bottomScrollRef.current && topScrollRef.current) {
      isSyncingBottom.current = true;
      const maxBottom = bottomScrollRef.current.scrollWidth - bottomScrollRef.current.clientWidth;
      const maxTop = topScrollRef.current.scrollWidth - topScrollRef.current.clientWidth;
      if (maxTop > 0 && maxBottom > 0) {
        const ratio = topScrollRef.current.scrollLeft / maxTop;
        bottomScrollRef.current.scrollLeft = Math.round(ratio * maxBottom);
      } else {
        bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    }
  };

  const handleBottomScroll = () => {
    if (isSyncingBottom.current) {
      isSyncingBottom.current = false;
      return;
    }
    if (topScrollRef.current && bottomScrollRef.current) {
      isSyncingTop.current = true;
      const maxBottom = bottomScrollRef.current.scrollWidth - bottomScrollRef.current.clientWidth;
      const maxTop = topScrollRef.current.scrollWidth - topScrollRef.current.clientWidth;
      if (maxTop > 0 && maxBottom > 0) {
        const ratio = bottomScrollRef.current.scrollLeft / maxBottom;
        topScrollRef.current.scrollLeft = Math.round(ratio * maxTop);
      } else {
        topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
      }
    }
  };

  // Re-synchronize when dimensions or max scroll ranges change
  useEffect(() => {
    if (topScrollRef.current && bottomScrollRef.current) {
      const maxBottom = bottomScrollRef.current.scrollWidth - bottomScrollRef.current.clientWidth;
      const maxTop = topScrollRef.current.scrollWidth - topScrollRef.current.clientWidth;
      if (maxBottom > 0 && maxTop > 0) {
        const ratio = bottomScrollRef.current.scrollLeft / maxBottom;
        topScrollRef.current.scrollLeft = Math.round(ratio * maxTop);
      }
    }
  }, [scrollWidth, clientWidth, topClientWidth]);

  const maxScrollBottom = Math.max(0, scrollWidth - clientWidth);
  const hasOverflow = maxScrollBottom > 4;
  const topContentWidth = topClientWidth > 0 && maxScrollBottom > 0
    ? topClientWidth + maxScrollBottom
    : scrollWidth;

  return (
    <div className={`table-scroll-wrapper relative w-full ${className}`}>
      {/* Top horizontal scrollbar: placed directly above the first column / table headers */}
      {hasOverflow && (
        <div className="top-scrollbar-container bg-paper-100/90 border-2 border-b-0 border-ink rounded-t-[2px] px-2 py-1 flex items-center gap-2 shadow-sm">
          <span className="font-mono text-[9.5px] font-bold text-ink-mute uppercase tracking-widest shrink-0 flex items-center gap-1 select-none">
            ↔ Scroll Columns
          </span>
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="top-scrollbar-track flex-1 overflow-x-auto overflow-y-hidden"
            style={{ height: '14px' }}
          >
            <div style={{ width: `${topContentWidth}px`, height: '1px' }} />
          </div>
        </div>
      )}

      {/* Main table container */}
      <div
        ref={bottomScrollRef}
        onScroll={handleBottomScroll}
        className={`table-scroll ${hasOverflow ? 'rounded-t-none border-t-0' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}
