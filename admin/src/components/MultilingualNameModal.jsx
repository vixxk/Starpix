import React, { useState, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import { Translate, X, Check, Globe } from '@phosphor-icons/react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

export default function MultilingualNameModal({
  isOpen,
  onClose,
  initialName = '',
  initialTranslations = {},
  onSave,
  title = 'Multilingual Name Settings',
}) {
  const [sameForAll, setSameForAll] = useState(true);
  const [primaryName, setPrimaryName] = useState(initialName);
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    if (isOpen) {
      const baseName = initialName || '';
      setPrimaryName(baseName);

      // Convert initialTranslations if Map or object
      let initObj = {};
      if (initialTranslations && typeof initialTranslations === 'object') {
        if (initialTranslations instanceof Map) {
          initialTranslations.forEach((val, key) => {
            initObj[key] = val;
          });
        } else {
          initObj = { ...initialTranslations };
        }
      }

      // Check if all existing translations differ from baseName or each other to decide default sameForAll state
      const hasCustomTranslations = SUPPORTED_LANGUAGES.some(
        (lang) => initObj[lang.code] && initObj[lang.code] !== baseName
      );

      // By default ticket / selected
      setSameForAll(!hasCustomTranslations);

      const merged = {};
      SUPPORTED_LANGUAGES.forEach((lang) => {
        merged[lang.code] = initObj[lang.code] || baseName;
      });
      setTranslations(merged);
    }
  }, [isOpen, initialName, initialTranslations]);

  if (!isOpen) return null;

  const handlePrimaryNameChange = (val) => {
    setPrimaryName(val);
    if (sameForAll) {
      const updated = {};
      SUPPORTED_LANGUAGES.forEach((lang) => {
        updated[lang.code] = val;
      });
      setTranslations(updated);
    } else {
      setTranslations((prev) => ({
        ...prev,
        en: val,
      }));
    }
  };

  const handleTranslationChange = (code, val) => {
    setTranslations((prev) => ({
      ...prev,
      [code]: val,
    }));
    if (code === 'en') {
      setPrimaryName(val);
    }
  };

  const handleToggleSameForAll = (checked) => {
    setSameForAll(checked);
    if (checked) {
      const updated = {};
      SUPPORTED_LANGUAGES.forEach((lang) => {
        updated[lang.code] = primaryName;
      });
      setTranslations(updated);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const finalTrans = {};
    if (sameForAll) {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        finalTrans[lang.code] = primaryName;
      });
    } else {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        finalTrans[lang.code] = translations[lang.code] || primaryName;
      });
    }
    const mainName = translations.en || primaryName;
    onSave(mainName, finalTrans);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] bg-ink/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="modal-card max-w-lg w-full my-auto shadow-2xl border-2 border-ink">
          <div className="px-5 py-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
            <h3 className="display font-bold text-ink flex items-center gap-2 text-base">
              <Globe className="w-5 h-5 text-flame-600" weight="duotone" />
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper-100 rounded-[2px]"
            >
              <X className="w-5 h-5" weight="bold" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Same for All Languages Checkbox */}
            <div className="p-3 bg-flame-500/10 border border-flame-500/30 rounded-[2px] flex items-center justify-between cursor-pointer select-none">
              <label className="flex items-center gap-3 cursor-pointer w-full text-xs font-bold text-ink">
                <input
                  type="checkbox"
                  checked={sameForAll}
                  onChange={(e) => handleToggleSameForAll(e.target.checked)}
                  className="w-4 h-4 accent-flame-500 rounded-[2px] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-bold text-ink block">Same for all languages</span>
                  <span className="text-[11px] text-ink-soft font-normal block">
                    Use the same text across all supported language profiles (Checked by default)
                  </span>
                </div>
              </label>
            </div>

            {sameForAll ? (
              <div>
                <label className="field-label">Name (Same text for all 10 languages)</label>
                <input
                  type="text"
                  required
                  value={primaryName}
                  onChange={(e) => handlePrimaryNameChange(e.target.value)}
                  className="input"
                  placeholder="Enter name (e.g. Good Morning / शुभ प्रभात)"
                  autoFocus
                />
                <p className="text-[11px] text-ink-mute mt-1.5">
                  This text will automatically display for users in English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Punjabi & Malayalam.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-paper-200">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">Language Translations</span>
                  <span className="text-[11px] text-flame-600 font-semibold">{SUPPORTED_LANGUAGES.length} Languages</span>
                </div>

                {SUPPORTED_LANGUAGES.map((lang) => (
                  <div key={lang.code} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                    <div className="w-36 shrink-0 flex items-center gap-1.5 text-xs font-bold text-ink">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      <span className="text-ink-mute font-normal text-[11px]">({lang.nativeName})</span>
                    </div>
                    <input
                      type="text"
                      value={translations[lang.code] || ''}
                      onChange={(e) => handleTranslationChange(lang.code, e.target.value)}
                      className="input flex-1 py-1.5 text-xs"
                      placeholder={`Text in ${lang.nativeName}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-paper-200">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" weight="bold" /> Apply Names
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
