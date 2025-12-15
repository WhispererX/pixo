import { useState } from 'react';
import { BiArrowToRight } from 'react-icons/bi';
import { ChromePicker } from 'react-color';
import { useAppStore } from '../store/appStore';
import './ColorsView.css';

interface ColorsViewProps {
  style?: React.CSSProperties;
}

function ColorsView({ style }: ColorsViewProps) {
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);
  const [primaryPickerPos, setPrimaryPickerPos] = useState({ top: 0, left: 0 });
  const [secondaryPickerPos, setSecondaryPickerPos] = useState({ top: 0, left: 0 });
  const { 
    primaryColor, 
    secondaryColor, 
    setPrimaryColor, 
    setSecondaryColor, 
    colorPalette, 
    addColorToPalette,
    swapColors 
  } = useAppStore();

  const parseRGBA = (hexColor: string): { hex: string; r: number; g: number; b: number; a: number } => {
    if (hexColor.startsWith('#')) {
      if (hexColor.length === 7) {
        const hex = hexColor;
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return { hex, r, g, b, a: 1 };
      }
      if (hexColor.length === 9) {
        const hex = hexColor.slice(0, 7);
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const a = parseInt(hexColor.slice(7, 9), 16) / 255;
        return { hex, r, g, b, a };
      }
    }
    return { hex: '#ffffff', r: 255, g: 255, b: 255, a: 1 };
  };

  const toRGBAHex = (r: number, g: number, b: number, a: number): string => {
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
    return `${hex}${alphaHex}`;
  };

  const primaryRGBA = parseRGBA(primaryColor);
  const secondaryRGBA = parseRGBA(secondaryColor);

  const handlePrimaryColorChange = (color: any) => {
    const rgba = color.rgb;
    setPrimaryColor(toRGBAHex(rgba.r, rgba.g, rgba.b, rgba.a !== undefined ? rgba.a : 1));
  };

  const handleSecondaryColorChange = (color: any) => {
    const rgba = color.rgb;
    setSecondaryColor(toRGBAHex(rgba.r, rgba.g, rgba.b, rgba.a !== undefined ? rgba.a : 1));
  };

  const handleColorClick = (color: string, e: React.MouseEvent) => {
    const hex = color.length === 9 ? color.substring(0, 7) : color;
    if (e.button === 0) {
      setPrimaryColor(hex);
    } else if (e.button === 2) {
      setSecondaryColor(hex);
    }
  };

  const handleAddToPalette = () => {
    addColorToPalette(primaryRGBA.hex);
  };

  const handlePrimarySwatchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const pickerHeight = 260;
    let top = rect.bottom + 8;
    if (top + pickerHeight > viewportHeight) {
      top = rect.top - pickerHeight - 8;
    }
    setPrimaryPickerPos({
      top,
      left: rect.left + rect.width / 2,
    });
    setShowSecondaryPicker(false);
    setShowPrimaryPicker(true);
  };

  const handleSecondarySwatchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const pickerHeight = 260;
    let top = rect.bottom + 8;
    if (top + pickerHeight > viewportHeight) {
      top = rect.top - pickerHeight - 8;
    }
    setSecondaryPickerPos({
      top,
      left: rect.left + rect.width / 2,
    });
    setShowPrimaryPicker(false);
    setShowSecondaryPicker(true);
  };

  return (
    <div className="colors-view" style={style}>
      <div className="colors-view-header">
        <span className="panel-title">Colors</span>
      </div>

      {/* Palette Grid */}
      <div className="palette-grid">
        {colorPalette.map((color, index) => (
          <div
            key={index}
            className="palette-color"
            style={{ backgroundColor: color }}
            onClick={(e) => handleColorClick(color, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleColorClick(color, { ...e, button: 2 } as React.MouseEvent);
            }}
            title={`${color}\nLeft: Primary | Right: Secondary`}
          />
        ))}
      </div>

      {/* Color Swatches */}
      <div className="colors-swatches-container">
        {/* Primary Color Swatch */}
        <div className="color-picker-section">
          <label className="color-label">Primary</label>
          <div className="color-swatch-wrapper">
            <button
              className="color-swatch"
              style={{ backgroundColor: primaryColor }}
              onClick={handlePrimarySwatchClick}
              title="Click to open color picker"
            />
            {showPrimaryPicker && (
              <>
                <div className="color-picker-backdrop" onClick={() => setShowPrimaryPicker(false)} />
                <div className="color-picker-popup" style={{ top: primaryPickerPos.top, left: primaryPickerPos.left }} onClick={(e) => e.stopPropagation()}>
                <ChromePicker
                  color={{
                    r: primaryRGBA.r,
                    g: primaryRGBA.g,
                    b: primaryRGBA.b,
                    a: primaryRGBA.a,
                  }}
                  onChange={handlePrimaryColorChange}
                  disableAlpha={false}
                />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <button className="swap-button" onClick={swapColors} title="Swap Colors">
          <BiArrowToRight />
        </button>

        {/* Secondary Color Swatch */}
        <div className="color-picker-section">
          <label className="color-label">Secondary</label>
          <div className="color-swatch-wrapper">
            <button
              className="color-swatch"
              style={{ backgroundColor: secondaryColor }}
              onClick={handleSecondarySwatchClick}
              title="Click to open color picker"
            />
            {showSecondaryPicker && (
              <>
                <div className="color-picker-backdrop" onClick={() => setShowSecondaryPicker(false)} />
                <div className="color-picker-popup" style={{ top: secondaryPickerPos.top, left: secondaryPickerPos.left }} onClick={(e) => e.stopPropagation()}>
                <ChromePicker
                  color={{
                    r: secondaryRGBA.r,
                    g: secondaryRGBA.g,
                    b: secondaryRGBA.b,
                    a: secondaryRGBA.a,
                  }}
                  onChange={handleSecondaryColorChange}
                  disableAlpha={false}
                />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <button className="add-palette-button" onClick={handleAddToPalette}>
        Add to Palette
      </button>
    </div>
  );
}

export default ColorsView;