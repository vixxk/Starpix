import React, { useState } from 'react';
import {
  TextT,
  Image,
  SquaresFour,
  Trash,
  Plus,
  ArrowsOut,
} from '@phosphor-icons/react';

export default function CanvasEditor({ canvasConfig, onChange }) {
  const [selectedLayerId, setSelectedLayerId] = useState(
    canvasConfig?.layers?.[0]?.id || null
  );

  const layers = canvasConfig?.layers || [];

  const updateLayers = (newLayers) => {
    onChange({ ...canvasConfig, layers: newLayers });
  };

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
      zIndex: layers.length + 1,
    };

    if (type === 'text') {
      newLayer = {
        ...newLayer,
        defaultValue: 'Your Custom Text',
        fieldName: 'name',
        fontSize: 22,
        fontColor: '#FFFFFF',
        fontWeight: '700',
        height: 0.1,
      };
    } else if (type === 'photo') {
      newLayer = { ...newLayer, width: 0.65, height: 0.4 };
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

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const updateSelectedLayer = (field, value) => {
    if (!selectedLayerId) return;
    updateLayers(
      layers.map((l) => (l.id === selectedLayerId ? { ...l, [field]: value } : l))
    );
  };

  const numInput = (label, field, opts = {}) => (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="number"
        step={opts.step || '0.05'}
        min={opts.min}
        max={opts.max}
        value={selectedLayer[field]}
        onChange={(e) => updateSelectedLayer(field, parseFloat(e.target.value))}
        className="input"
      />
    </div>
  );

  return (
    <div className="bg-night-900 border border-night-600 rounded-2xl overflow-hidden shadow-panel">
      {/* Top toolbar */}
      <div className="px-4 py-3 bg-night-800/70 border-b border-night-600 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-night-200 uppercase tracking-wider flex items-center gap-2">
          <SquaresFour className="w-4 h-4 text-glow-400" weight="duotone" /> Canvas Editor · 9:16
        </span>
        <div className="flex items-center gap-2">
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
            <TextT className="w-3.5 h-3.5" weight="bold" /> Text Layer
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Layers list */}
        <div className="lg:w-56 xl:w-64 lg:border-r border-night-600 bg-night-850/40 p-4 order-2 lg:order-1">
          <h4 className="label mb-3">Canvas Layers</h4>
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:overflow-x-visible">
            {layers.length === 0 && (
              <p className="text-xs text-night-400 italic p-2 text-center">No layers added yet.</p>
            )}
            {layers.map((l, index) => (
              <div
                key={l.id}
                onClick={() => setSelectedLayerId(l.id)}
                className={`shrink-0 lg:shrink p-2.5 rounded-xl border text-xs font-medium cursor-pointer flex items-center justify-between gap-2 transition-all min-w-[130px] lg:min-w-0 ${
                  selectedLayerId === l.id
                    ? 'border-glow-500 bg-glow-500/10 text-glow-300'
                    : 'border-night-600 bg-night-900 text-night-200 hover:border-night-500'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {l.type === 'photo' && <Image className="w-4 h-4 text-sky-400" weight="duotone" />}
                  {l.type === 'text' && <TextT className="w-4 h-4 text-glow-400" weight="duotone" />}
                  <span className="capitalize truncate">
                    {l.type === 'text' ? `Text · ${l.fieldName}` : `Photo Box #${index + 1}`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(l.id);
                  }}
                  className="text-night-400 hover:text-red-400 p-0.5 shrink-0"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-night-950/[0.6] p-6 flex items-center justify-center overflow-auto relative order-1 lg:order-2 min-h-[420px]">
          <div className="relative">
            {/* Phone chrome accents */}
            <span className="absolute -inset-3 rounded-2xl bg-glow-500/5 -z-10" />
            <div
              className="w-[240px] sm:w-[280px] aspect-[9/16] bg-night-900 rounded-xl shadow-2xl relative border-2 border-glow-500/40 overflow-hidden flex flex-col justify-between"
              style={{
                backgroundImage: canvasConfig?.backgroundImage
                  ? `url(${canvasConfig.backgroundImage})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {layers.map((l) => {
                const isSelected = selectedLayerId === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLayerId(l.id)}
                    className={`absolute cursor-pointer transition-all flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-glow-400 ring-offset-1 ring-offset-night-950 z-30' : ''
                    }`}
                    style={{
                      left: `${(l.x - l.width / 2) * 100}%`,
                      top: `${(l.y - l.height / 2) * 100}%`,
                      width: `${l.width * 100}%`,
                      height: `${l.height * 100}%`,
                      zIndex: l.zIndex || 1,
                    }}
                  >
                    {l.type === 'photo' && (
                      <div className="w-full h-full bg-glow-500/15 border-2 border-dashed border-glow-500/60 rounded-lg flex flex-col items-center justify-center p-2 text-center text-glow-300">
                        <Image className="w-6 h-6 mb-1 opacity-80" weight="duotone" />
                        <span className="text-[10px] font-bold">User Photo Area</span>
                      </div>
                    )}
                    {l.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center justify-center text-center font-bold px-1"
                        style={{
                          fontSize: `${Math.max(10, (l.fontSize || 22) * 0.55)}px`,
                          color: l.fontColor || '#FFFFFF',
                        }}
                      >
                        {l.defaultValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-glow-500/20 border border-glow-500/40 flex items-center justify-center">
              <ArrowsOut className="w-3.5 h-3.5 text-glow-300" weight="bold" />
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="lg:w-64 xl:w-72 lg:border-l border-night-600 bg-night-850/40 p-4 order-3">
          <h4 className="label mb-3">Layer Properties</h4>
          {selectedLayer ? (
            <div className="space-y-3">
              {numInput('Center X', 'x', { min: 0, max: 1 })}
              {numInput('Center Y', 'y', { min: 0, max: 1 })}
              {numInput('Width', 'width', { min: 0.1, max: 1 })}
              {numInput('Height', 'height', { min: 0.05, max: 1 })}

              {selectedLayer.type === 'text' && (
                <>
                  <div>
                    <label className="field-label">Default Text</label>
                    <input
                      type="text"
                      value={selectedLayer.defaultValue}
                      onChange={(e) => updateSelectedLayer('defaultValue', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Field Identifier</label>
                    <input
                      type="text"
                      value={selectedLayer.fieldName}
                      onChange={(e) => updateSelectedLayer('fieldName', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Font Color</label>
                    <input
                      type="color"
                      value={selectedLayer.fontColor || '#FFFFFF'}
                      onChange={(e) => updateSelectedLayer('fontColor', e.target.value)}
                      className="w-full h-10 bg-night-900 border border-night-600 rounded-xl cursor-pointer p-1"
                    />
                  </div>
                  <div>
                    <label className="field-label">Font Size (px)</label>
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
    </div>
  );
}