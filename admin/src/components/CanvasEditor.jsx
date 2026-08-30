import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextT,
  Image,
  SquaresFour,
  Trash,
  Plus,
  ArrowsOut,
  ArrowsOutCardinal,
} from '@phosphor-icons/react';

const getPhotoShapeStyles = (shape) => {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%', clipPath: 'circle(50% at 50% 50%)' };
    case 'diamond':
      return { borderRadius: '0px', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'hexagon':
      return { borderRadius: '0px', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
    case 'star':
      return { borderRadius: '0px', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
    case 'heart':
      return { borderRadius: '0px', clipPath: 'polygon(50% 15%, 65% 0%, 85% 0%, 100% 15%, 100% 35%, 50% 90%, 0% 35%, 0% 15%, 15% 0%, 35% 0%)' };
    case 'rounded':
      return { borderRadius: '24px', clipPath: 'inset(0 round 20%)' };
    case 'rectangle':
    default:
      return { borderRadius: '2px', clipPath: 'none' };
  }
};

export default function CanvasEditor({
  canvasConfig,
  value,
  mainMedia,
  previewAsset,
  thumbnail,
  footers = [],
  onFootersChange,
  onChange,
}) {
  // Accept both `canvasConfig` (legacy) and `value` (newer call sites)
  if (value !== undefined && canvasConfig === undefined) {
    canvasConfig = value;
  }

  const templateMedia =
    canvasConfig?.backgroundImage || mainMedia || previewAsset || thumbnail;

  const isVideoMediaUrl = (url) => {
    if (!url) return false;
    return Boolean(url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || url.includes('/video/') || url.includes('.mp4'));
  };

  const isVideo = isVideoMediaUrl(templateMedia);
  const [selectedLayerId, setSelectedLayerId] = useState(
    canvasConfig?.layers?.[0]?.id || null
  );

  const [activeFooterIdx, setActiveFooterIdx] = useState(-1);
  const previewFooter = footers && footers.length > 0 && activeFooterIdx >= 0 && activeFooterIdx < footers.length
    ? footers[activeFooterIdx]
    : null;

  const footerLayer = previewFooter
    ? {
        id: 'footer_layer',
        type: 'footer',
        x: previewFooter.x !== undefined ? previewFooter.x : 0.5,
        y: previewFooter.y !== undefined ? previewFooter.y : (1 - (previewFooter.heightPercent || 40) / 200),
        width: previewFooter.width !== undefined ? previewFooter.width : 1.0,
        height: previewFooter.height !== undefined ? previewFooter.height : ((previewFooter.heightPercent || 40) / 100),
        zIndex: previewFooter.zIndex || 10,
      }
    : null;

  const canvasRef = useRef(null);
  const dragRef = useRef(null); // stores active drag/resize metadata

  const [domCanvasWidth, setDomCanvasWidth] = useState(280);

  useEffect(() => {
    if (!canvasRef.current) return;
    const updateWidth = () => {
      if (canvasRef.current) {
        setDomCanvasWidth(canvasRef.current.clientWidth || 280);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const layers = (canvasConfig?.layers || []).filter(
    (l) => l.type === 'photo' || (l.type === 'text' && l.fieldName === 'name')
  );

  const updateLayers = useCallback((newLayers) => {
    onChange({ ...canvasConfig, layers: newLayers });
  }, [canvasConfig, onChange]);

  const addLayer = (type) => {
    const newId = `layer_${Date.now()}`;
    let newLayer = {
      id: newId,
      type,
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.3,
      rotation: 0,
      opacity: 1,
      zIndex: type === 'text' ? 20 + layers.length * 5 : 15 + layers.length * 5,
    };

    if (type === 'text') {
      newLayer = {
        ...newLayer,
        defaultValue: 'User Name',
        fieldName: 'name',
        fontSize: 22,
        fontColor: '#FFFFFF',
        fontWeight: '700',
        textAlign: 'left',
        height: 0.1,
      };
    } else if (type === 'photo') {
      newLayer = { ...newLayer, width: 0.65, height: 0.4, shape: 'rectangle' };
    }

    const updated = [...layers, newLayer];
    updateLayers(updated);
    setSelectedLayerId(newId);
  };

  const removeLayer = (id) => {
    const updated = layers.filter((l) => l.id !== id);
    updateLayers(updated);
    if (selectedLayerId === id) setSelectedLayerId(updated[0]?.id || null);
  };

  const getEffectiveLayer = useCallback(
    (l) => {
      if (!l) return null;
      if (l.type === 'text' && activeFooterIdx >= 0 && activeFooterIdx < footers.length) {
        const curF = footers[activeFooterIdx];
        if (curF && curF.userNamePosition && curF.userNamePosition.x !== undefined) {
          return { ...l, ...curF.userNamePosition };
        }
      }
      return l;
    },
    [activeFooterIdx, footers]
  );

  const baseSelectedLayer = selectedLayerId === 'footer_layer'
    ? footerLayer
    : layers.find((l) => l.id === selectedLayerId);
  const selectedLayer = getEffectiveLayer(baseSelectedLayer);

  const updateSelectedLayer = (field, val) => {
    if (selectedLayerId === 'footer_layer') {
      if (!onFootersChange || activeFooterIdx < 0 || activeFooterIdx >= footers.length) return;
      const nextFooters = [...footers];
      const curF = { ...nextFooters[activeFooterIdx], [field]: val };
      if (field === 'height') {
        curF.heightPercent = Math.round(val * 100);
      }
      nextFooters[activeFooterIdx] = curF;
      onFootersChange(nextFooters);
      return;
    }

    if (!selectedLayerId) return;

    const targetLayer = layers.find((l) => l.id === selectedLayerId);
    if (targetLayer && targetLayer.type === 'text' && activeFooterIdx >= 0 && activeFooterIdx < footers.length) {
      if (!onFootersChange) return;
      const nextFooters = [...footers];
      const curF = { ...nextFooters[activeFooterIdx] };
      const currentUserNamePos = curF.userNamePosition || {
        x: targetLayer.x,
        y: targetLayer.y,
        width: targetLayer.width,
        height: targetLayer.height,
        fontSize: targetLayer.fontSize || 22,
        fontColor: targetLayer.fontColor || '#FFFFFF',
        fontWeight: targetLayer.fontWeight || '700',
        textAlign: targetLayer.textAlign || 'left',
      };
      curF.userNamePosition = {
        ...currentUserNamePos,
        [field]: val,
      };
      nextFooters[activeFooterIdx] = curF;
      onFootersChange(nextFooters);
      return;
    }

    updateLayers(
      layers.map((l) => (l.id === selectedLayerId ? { ...l, [field]: val } : l))
    );
  };

  // ── Drag & Resize logic ───────────────────────────────────────
  const startDrag = (e, layer, action = 'move') => {
    e.stopPropagation();
    setSelectedLayerId(layer.id);

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    dragRef.current = {
      action, // 'move' or 'resize-se'
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      initialLayerX: layer.x,
      initialLayerY: layer.y,
      initialWidth: layer.width,
      initialHeight: layer.height,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;

    const {
      action,
      layerId,
      startX,
      startY,
      initialLayerX,
      initialLayerY,
      initialWidth,
      initialHeight,
      canvasWidth,
      canvasHeight,
    } = dragRef.current;

    const dx = (e.clientX - startX) / canvasWidth;
    const dy = (e.clientY - startY) / canvasHeight;

    if (layerId === 'footer_layer') {
      if (!onFootersChange || activeFooterIdx < 0 || activeFooterIdx >= footers.length) return;
      const nextFooters = [...footers];
      const curF = { ...nextFooters[activeFooterIdx] };
      if (action === 'move') {
        curF.x = Math.max(-0.5, Math.min(1.5, Math.round((initialLayerX + dx) * 100) / 100));
        curF.y = Math.max(-0.5, Math.min(1.8, Math.round((initialLayerY + dy) * 100) / 100));
      } else if (action === 'resize-se') {
        curF.width = Math.max(0.1, Math.min(1.5, Math.round((initialWidth + dx) * 100) / 100));
        curF.height = Math.max(0.05, Math.min(1.5, Math.round((initialHeight + dy) * 100) / 100));
        curF.heightPercent = Math.round(curF.height * 100);
      }
      nextFooters[activeFooterIdx] = curF;
      onFootersChange(nextFooters);
      return;
    }

    const targetLayer = layers.find((l) => l.id === layerId);
    if (targetLayer && targetLayer.type === 'text' && activeFooterIdx >= 0 && activeFooterIdx < footers.length) {
      if (!onFootersChange) return;
      const nextFooters = [...footers];
      const curF = { ...nextFooters[activeFooterIdx] };
      const currentUserNamePos = curF.userNamePosition || {
        x: targetLayer.x,
        y: targetLayer.y,
        width: targetLayer.width,
        height: targetLayer.height,
        fontSize: targetLayer.fontSize || 22,
        fontColor: targetLayer.fontColor || '#FFFFFF',
        fontWeight: targetLayer.fontWeight || '700',
        textAlign: targetLayer.textAlign || 'left',
      };
      let nextPos = { ...currentUserNamePos };
      if (action === 'move') {
        nextPos.x = Math.max(-0.5, Math.min(1.5, Math.round((initialLayerX + dx) * 100) / 100));
        nextPos.y = Math.max(-0.5, Math.min(1.8, Math.round((initialLayerY + dy) * 100) / 100));
      } else if (action === 'resize-se') {
        nextPos.width = Math.max(0.08, Math.min(1, Math.round((initialWidth + dx) * 100) / 100));
        nextPos.height = Math.max(0.04, Math.min(1, Math.round((initialHeight + dy) * 100) / 100));
      }
      curF.userNamePosition = nextPos;
      nextFooters[activeFooterIdx] = curF;
      onFootersChange(nextFooters);
      return;
    }

    if (action === 'move') {
      const newX = Math.max(-0.5, Math.min(1.5, Math.round((initialLayerX + dx) * 100) / 100));
      const newY = Math.max(-0.5, Math.min(1.8, Math.round((initialLayerY + dy) * 100) / 100));

      onChange({
        ...canvasConfig,
        layers: (canvasConfig?.layers || []).map((l) =>
          l.id === layerId ? { ...l, x: newX, y: newY } : l
        ),
      });
    } else if (action === 'resize-se') {
      const newW = Math.max(0.08, Math.min(1, Math.round((initialWidth + dx) * 100) / 100));
      const newH = Math.max(0.04, Math.min(1, Math.round((initialHeight + dy) * 100) / 100));

      onChange({
        ...canvasConfig,
        layers: (canvasConfig?.layers || []).map((l) =>
          l.id === layerId ? { ...l, width: newW, height: newH } : l
        ),
      });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const numInput = (label, field, opts = {}) => (
    <div>
      <label className="field-label !text-paper-100">{label}</label>
      <input
        type="number"
        step={opts.step || '0.01'}
        min={opts.min}
        max={opts.max}
        value={selectedLayer ? selectedLayer[field] : ''}
        onChange={(e) => updateSelectedLayer(field, parseFloat(e.target.value) || 0)}
        className="input"
      />
    </div>
  );

  return (
    <div className="bg-night-900 border-2 border-ink rounded-[2px] overflow-hidden">
      {/* Top toolbar */}
      <div className="px-4 py-3 bg-night-800/70 border-b border-night-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-night-200 uppercase tracking-wider flex items-center gap-2">
            <SquaresFour className="w-4 h-4 text-flame-400" weight="duotone" /> Canvas Editor · 9:16 (Interactive Drag & Resize)
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => addLayer('photo')}
            className="btn-secondary !py-1.5 !px-3 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" /> Photo Slot
          </button>
          <button
            type="button"
            onClick={() => addLayer('text')}
            className="btn-secondary !py-1.5 !px-3 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" weight="bold" /> Name Layer
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Layers list */}
        <div className="lg:w-56 xl:w-64 lg:border-r border-night-600 bg-night-850/40 p-4 order-2 lg:order-1">
          <h4 className="label !text-paper-50/70 mb-3">Canvas Layers</h4>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:overflow-x-visible">
            {footerLayer && (
              <div
                onClick={() => setSelectedLayerId('footer_layer')}
                className={`shrink-0 lg:shrink p-2.5 rounded-[2px] border-2 text-xs font-medium cursor-pointer flex items-center justify-between gap-2 transition-all min-w-[130px] lg:min-w-0 ${
                  selectedLayerId === 'footer_layer'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-night-600 bg-night-900 text-amber-400 hover:border-amber-500/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <SquaresFour className="w-4 h-4 text-amber-400" weight="duotone" />
                  <span className="truncate font-bold text-amber-300">
                    Footer · {previewFooter.name || `Footer ${activeFooterIdx + 1}`}
                  </span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                  z:{footerLayer.zIndex || 10}
                </span>
              </div>
            )}

            {layers.length === 0 && !footerLayer && (
              <p className="text-xs text-night-400 italic p-2 text-center">No layers added yet.</p>
            )}

            {layers.map((l, index) => (
              <div
                key={l.id}
                onClick={() => setSelectedLayerId(l.id)}
                className={`shrink-0 lg:shrink p-2.5 rounded-[2px] border-2 text-xs font-medium cursor-pointer flex items-center justify-between gap-2 transition-all min-w-[130px] lg:min-w-0 ${
                  selectedLayerId === l.id
                    ? 'border-flame-500 bg-flame-500/15 text-flame-300'
                    : 'border-night-600 bg-night-900 text-night-200 hover:border-flame-500/60'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {l.type === 'photo' && <Image className="w-4 h-4 text-sky-400" weight="duotone" />}
                  {l.type === 'text' && <TextT className="w-4 h-4 text-flame-400" weight="duotone" />}
                  <span className="capitalize truncate">
                    {l.type === 'text' ? `Text · ${l.fieldName}` : `Photo Box #${index + 1}`}
                  </span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-night-800 text-night-300 text-[10px] font-mono font-bold">
                    z:{l.zIndex || 15}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(l.id);
                    }}
                    className="text-night-400 hover:text-red-400 p-0.5"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Canvas Preview */}
        <div className="flex-1 bg-night-950/[0.6] p-6 flex flex-col items-center justify-center overflow-auto relative order-1 lg:order-2 min-h-[440px] select-none">
          <div className="relative">
            {/* Phone frame container */}
            <span className="absolute -inset-3 rounded-[2px] bg-flame-500/10 -z-10" />
            <div
              ref={canvasRef}
              className="w-[240px] sm:w-[280px] aspect-[9/16] bg-night-900 rounded-[2px] border-2 border-flame-500/60 overflow-hidden relative"
            >
              {/* Uploaded Template Background Asset */}
              {templateMedia && (
                isVideo ? (
                  <video
                    src={templateMedia}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <img
                    src={templateMedia}
                    alt="Template Background"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                )
              )}

              {/* Draggable Footer Layer Overlay */}
              {footerLayer && (
                <div
                  onPointerDown={(e) => startDrag(e, footerLayer, 'move')}
                  className={`absolute cursor-move group transition-shadow ${
                    selectedLayerId === 'footer_layer'
                      ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-night-950 z-20'
                      : 'hover:ring-1 hover:ring-amber-500/50 z-10'
                  }`}
                  style={{
                    left: `${(footerLayer.x - footerLayer.width / 2) * 100}%`,
                    top: `${(footerLayer.y - footerLayer.height / 2) * 100}%`,
                    width: `${footerLayer.width * 100}%`,
                    height: `${footerLayer.height * 100}%`,
                    zIndex: footerLayer.zIndex || 10,
                  }}
                >
                  {previewFooter.videoAsset && (
                    isVideoMediaUrl(previewFooter.videoAsset) ? (
                      <video
                        src={previewFooter.videoAsset}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full pointer-events-none"
                        style={{
                          objectFit: previewFooter.objectFit || 'contain',
                        }}
                      />
                    ) : (
                      <img
                        src={previewFooter.videoAsset}
                        alt="Footer Overlay Preview"
                        className="w-full h-full pointer-events-none"
                        style={{
                          objectFit: previewFooter.objectFit || 'contain',
                        }}
                      />
                    )
                  )}

                  {/* Move handle */}
                  {selectedLayerId === 'footer_layer' && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-black px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold shadow-sm pointer-events-none flex items-center gap-1">
                      <ArrowsOutCardinal className="w-3 h-3" weight="bold" /> Footer Overlay
                    </div>
                  )}

                  {/* Resize handle */}
                  {selectedLayerId === 'footer_layer' && (
                    <div
                      onPointerDown={(e) => startDrag(e, footerLayer, 'resize-se')}
                      className="absolute -bottom-2 -right-2 w-5 h-5 bg-amber-500 border-2 border-white rounded-[2px] cursor-se-resize flex items-center justify-center shadow-md z-40 hover:scale-125 transition-transform"
                      title="Drag to resize footer overlay"
                    >
                      <ArrowsOut className="w-3 h-3 text-black" weight="bold" />
                    </div>
                  )}
                </div>
              )}

              {/* Photo and Text Canvas Layers */}
              {layers.map((rawL) => {
                const l = getEffectiveLayer(rawL);
                const isSelected = selectedLayerId === l.id;
                return (
                  <div
                    key={l.id}
                    onPointerDown={(e) => startDrag(e, l, 'move')}
                    className={`absolute cursor-move group transition-shadow ${
                      isSelected ? 'ring-2 ring-flame-400 ring-offset-1 ring-offset-night-950 z-30' : 'hover:ring-1 hover:ring-flame-500/50'
                    }`}
                    style={{
                      left: `${(l.x - l.width / 2) * 100}%`,
                      top: `${(l.y - l.height / 2) * 100}%`,
                      width: `${l.width * 100}%`,
                      height: `${l.height * 100}%`,
                      zIndex: l.zIndex || 15,
                    }}
                  >
                    {l.type === 'photo' && (
                      <div
                        className="w-full h-full bg-flame-500/20 border-2 border-dashed border-flame-400 flex flex-col items-center justify-center p-2 text-center text-flame-300 overflow-hidden"
                        style={getPhotoShapeStyles(l.shape || 'rectangle')}
                      >
                        <Image className="w-6 h-6 mb-1 opacity-90" weight="duotone" />
                        <span className="text-[10px] font-bold tracking-wide">User Photo Area</span>
                        {l.shape && l.shape !== 'rectangle' && (
                          <span className="text-[9px] uppercase font-mono font-bold text-flame-200 bg-flame-500/40 px-1 py-0.5 mt-0.5 rounded">
                            {l.shape}
                          </span>
                        )}
                      </div>
                    )}
                    {l.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center font-bold px-1 select-none pointer-events-none"
                        style={{
                          fontSize: `${Math.max(10, (l.fontSize || 22) * (domCanvasWidth / 375))}px`,
                          color: l.fontColor || '#FFFFFF',
                          fontFamily: l.fontFamily || 'inherit',
                          textAlign: l.textAlign || 'left',
                          justifyContent: l.textAlign === 'right' ? 'flex-end' : l.textAlign === 'center' ? 'center' : 'flex-start',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {l.defaultValue || 'User Name'}
                      </div>
                    )}

                    {/* Move indicator handle */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 bg-flame-500 text-white p-0.5 rounded-[2px] shadow-sm pointer-events-none">
                        <ArrowsOutCardinal className="w-3 h-3" weight="bold" />
                      </div>
                    )}

                    {/* Resize Handle (bottom-right corner) */}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => startDrag(e, l, 'resize-se')}
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-flame-500 border-2 border-white rounded-[2px] cursor-se-resize flex items-center justify-center shadow-md z-40 hover:scale-125 transition-transform"
                        title="Drag to resize layer"
                      >
                        <ArrowsOut className="w-3 h-3 text-white" weight="bold" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-center text-night-400 font-medium mt-2">
              💡 Click & drag Photo, Text, or Footer layer to move • Drag corner handle <ArrowsOut className="w-3 h-3 inline text-flame-400" /> to resize
            </p>
          </div>
        </div>

        {/* Layer Properties Sidebar */}
        <div className="lg:w-64 xl:w-72 lg:border-l border-night-600 bg-night-850/40 p-4 order-3">
          <h4 className="label !text-paper-50/70 mb-3">Layer Properties</h4>
          {selectedLayer ? (
            <div className="space-y-3">
              {selectedLayerId === 'footer_layer' && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300 font-bold mb-2">
                  Editing: {previewFooter.name || 'Footer Overlay'}
                </div>
              )}

              {selectedLayer.type === 'text' && activeFooterIdx >= 0 && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300 space-y-1 mb-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>📍 Name Position for: {previewFooter?.name || `Footer ${activeFooterIdx + 1}`}</span>
                  </div>
                  <p className="text-[10px] text-amber-200/80">
                    Positions & sizes set here apply specifically when this footer is selected by the user.
                  </p>
                  {previewFooter?.userNamePosition && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!onFootersChange || activeFooterIdx < 0 || activeFooterIdx >= footers.length) return;
                        const nextFooters = [...footers];
                        const curF = { ...nextFooters[activeFooterIdx] };
                        delete curF.userNamePosition;
                        nextFooters[activeFooterIdx] = curF;
                        onFootersChange(nextFooters);
                      }}
                      className="mt-1 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      ↺ Reset to Default Position
                    </button>
                  )}
                </div>
              )}

              {numInput('Center X (-0.5 to 1.5)', 'x', { min: -0.5, max: 1.5 })}
              {numInput('Center Y (-0.5 to 1.8)', 'y', { min: -0.5, max: 1.8 })}
              {numInput('Width (0.05 to 1.5)', 'width', { min: 0.05, max: 1.5 })}
              {numInput('Height (0.05 to 1.5)', 'height', { min: 0.05, max: 1.5 })}
              {numInput('Layer Stacking Depth (Z-Index 1-50)', 'zIndex', { min: 1, max: 50, step: '1' })}

              <div className="flex gap-2 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => updateSelectedLayer('zIndex', Math.max(1, (selectedLayer.zIndex || 10) - 2))}
                  className="bg-night-900 border-2 border-night-600 hover:border-flame-500 text-flame-400 font-bold py-1.5 px-2 text-[11px] rounded flex-1 text-center transition-colors shadow-sm"
                  title="Move behind other layers"
                >
                  ↓ Send Backward
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedLayer('zIndex', Math.min(50, (selectedLayer.zIndex || 10) + 2))}
                  className="bg-night-900 border-2 border-night-600 hover:border-flame-500 text-flame-400 font-bold py-1.5 px-2 text-[11px] rounded flex-1 text-center transition-colors shadow-sm"
                  title="Bring in front of other layers"
                >
                  ↑ Bring Forward
                </button>
              </div>

              {selectedLayer.type === 'photo' && (
                <div>
                  <label className="field-label !text-paper-100">Photo Box Shape Mask</label>
                  <select
                    value={selectedLayer.shape || 'rectangle'}
                    onChange={(e) => updateSelectedLayer('shape', e.target.value)}
                    className="select font-bold text-xs"
                  >
                    <option value="rectangle">Square / Rectangle (Default)</option>
                    <option value="circle">Circle / Oval</option>
                    <option value="diamond">Diamond</option>
                    <option value="hexagon">Hexagon</option>
                    <option value="star">5-Point Star</option>
                    <option value="heart">Heart</option>
                    <option value="rounded">Rounded Squircle</option>
                  </select>
                  <p className="text-[10px] text-night-400 mt-1">
                    Clips user photo into this shape without squishing or resizing image aspect ratio.
                  </p>
                </div>
              )}

              {selectedLayer.type === 'text' && (
                <>
                  <div>
                    <label className="field-label !text-paper-100">Default Text</label>
                    <input
                      type="text"
                      value={selectedLayer.defaultValue}
                      onChange={(e) => updateSelectedLayer('defaultValue', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="field-label !text-paper-100">Field Identifier</label>
                    <input
                      type="text"
                      value={selectedLayer.fieldName}
                      onChange={(e) => updateSelectedLayer('fieldName', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="field-label !text-paper-100">Font Color</label>
                    <input
                      type="color"
                      value={selectedLayer.fontColor || '#FFFFFF'}
                      onChange={(e) => updateSelectedLayer('fontColor', e.target.value)}
                      className="w-full h-10 bg-night-900 border-2 border-night-600 rounded-[2px] cursor-pointer p-1"
                    />
                  </div>
                  <div>
                    <label className="field-label !text-paper-100">Font Size (px)</label>
                    <input
                      type="number"
                      value={selectedLayer.fontSize || 22}
                      onChange={(e) => updateSelectedLayer('fontSize', parseInt(e.target.value, 10))}
                      className="input"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-night-400 italic">Select a layer to adjust properties.</p>
          )}
        </div>
      </div>

      {/* Active Footer Control Section under CANVAS EDITOR */}
      {footers && footers.length > 0 && (
        <div className="px-4 py-3 bg-night-950 border-t border-night-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-night-200 uppercase tracking-wider">Active Footer Preview:</span>
            <select
              value={activeFooterIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setActiveFooterIdx(idx);
                if (idx >= 0) setSelectedLayerId('footer_layer');
              }}
              className="bg-night-900 border border-night-600 text-flame-400 font-bold px-3 py-1.5 rounded-[2px] text-xs cursor-pointer focus:outline-none focus:border-flame-500"
            >
              <option value={-1} className="bg-night-900 text-paper-300">None (No Footer Preview)</option>
              {footers.map((f, idx) => (
                <option key={idx} value={idx} className="bg-night-900 text-white">
                  {f.name || `Footer ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-night-400 font-medium">
            Currently previewing: <strong className="text-flame-400">{activeFooterIdx >= 0 && footers[activeFooterIdx] ? (footers[activeFooterIdx].name || `Footer ${activeFooterIdx + 1}`) : 'None'}</strong>
          </span>
        </div>
      )}
    </div>
  );
}