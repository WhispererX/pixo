import { useAppStore } from '../store/appStore';
import './ToolOptions.css';

function ToolOptions() {
  const { selectedTool, toolOptions, setToolOptions } = useAppStore();

  const needsBrushSize = ['brush', 'pencil', 'eraser', 'magicEraser', 'line', 'quickSelect'].includes(selectedTool);
  const needsShapeOptions = ['rectangle', 'ellipse'].includes(selectedTool);

  if (!needsBrushSize && !needsShapeOptions) {
    return null;
  }

  return (
    <div className="tool-options">
      {needsBrushSize && (
        <>
          <label className="tool-option-label">
            Size:
            <input
              type="number"
              min="1"
              max="50"
              value={toolOptions.brushSize}
              onChange={(e) => setToolOptions({ brushSize: parseInt(e.target.value) || 1 })}
              className="tool-option-number"
            />
          </label>
        </>
      )}

      {needsShapeOptions && (
        <>
          <label className="tool-option-checkbox">
            <input
              type="radio"
              checked={toolOptions.shapeOutline && !toolOptions.shapeFill}
              onChange={() => setToolOptions({ shapeOutline: true, shapeFill: false })}
              name="shape-mode"
            />
            Outline
          </label>
          <label className="tool-option-checkbox">
            <input
              type="radio"
              checked={toolOptions.shapeFill}
              onChange={() => setToolOptions({ shapeOutline: false, shapeFill: true })}
              name="shape-mode"
            />
            Fill
          </label>
        </>
      )}
    </div>
  );
}

export default ToolOptions;
