import React, { useState } from 'react';
import { X } from 'lucide-react';
import { t } from '../../i18n';

interface ColorPickerProps {
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#000000', '#FFFFFF',
];

const STORAGE_KEY = 'diary_saved_colors';

const getSavedColors = (): string[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ onColorSelect, onClose }) => {
  const [hexInput, setHexInput] = useState('#000000');
  const [savedColors, setSavedColors] = useState<string[]>(() => getSavedColors());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    // 只允许输入 # 和 十六进制数字
    if (!value.startsWith('#')) {
      value = '#';
    }
    if (value.length > 7) {
      value = value.slice(0, 7);
    }
    setHexInput(value);
  };

  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  const handleSaveColor = () => {
    if (isValidHex(hexInput)) {
      const normalized = hexInput.toUpperCase();
      const newSavedColors = savedColors.includes(normalized)
        ? savedColors
        : [normalized, ...savedColors].slice(0, 20); // 最多保存20个颜色
      setSavedColors(newSavedColors);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedColors));
    }
  };

  const handleDeleteColor = (color: string) => {
    const newSavedColors = savedColors.filter((c) => c !== color);
    setSavedColors(newSavedColors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedColors));
  };

  const handleSelectColor = (color: string) => {
    setHexInput(color);
    if (isValidHex(color)) {
      onColorSelect(color);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('Text Color')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title={t('Cancel')}
          >
            <X size={20} />
          </button>
        </div>

        {/* 颜色输入框 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('Color Hex Value')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hexInput}
              onChange={handleInputChange}
              placeholder="#000000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <div
              className="w-10 h-10 rounded border-2 border-gray-300"
              style={{ backgroundColor: isValidHex(hexInput) ? hexInput : '#ffffff' }}
            />
          </div>
        </div>

        {/* 预设颜色板 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('Preset Colors')}</label>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleSelectColor(color)}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* 已保存的颜色 */}
        {savedColors.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{t('Saved Colors')}</label>
            <div className="grid grid-cols-6 gap-2">
              {savedColors.map((color) => (
                <div key={color} className="relative group">
                  <button
                    onClick={() => handleSelectColor(color)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  <button
                    onClick={() => handleDeleteColor(color)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    title={t('Delete')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              if (isValidHex(hexInput)) {
                handleSaveColor();
              }
            }}
            disabled={!isValidHex(hexInput)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('Save Color')}
          </button>
          <button
            onClick={() => {
              if (isValidHex(hexInput)) {
                onColorSelect(hexInput);
                onClose();
              }
            }}
            disabled={!isValidHex(hexInput)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('Apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
