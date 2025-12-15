import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import './Canvas.css';

interface CanvasProps {
  spriteId: string;
}

function Canvas({ spriteId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [shapeDrawButton, setShapeDrawButton] = useState<number>(0);
  const [drawButton, setDrawButton] = useState<number>(0);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [selectionMoveStart, setSelectionMoveStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionMoveOffset, setSelectionMoveOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [quickSelectMode, setQuickSelectMode] = useState<'new' | 'add' | 'subtract'>('new');
  const [marchingAntsOffset, setMarchingAntsOffset] = useState(0);

  const {
    sprites,
    selectedTool,
    primaryColor,
    secondaryColor,
    zoom,
    setZoom,
    showGrid,
    gridColor,
    gridSize,
    gridOpacity,
    setPixel,
    clearPixel,
    fillArea,
    setPrimaryColor,
    toolOptions,
    pushHistory,
    selectedPixels,
    setSelection,
    addToSelection,
    removeFromSelection,
  } = useAppStore();

  const sprite = sprites.get(spriteId);

  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, pixels: Set<string>, zoomLevel: number, offset: number = 0) => {
    if (pixels.size === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const pixelArray: [number, number][] = [];
    pixels.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      pixelArray.push([x, y]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    const width = maxX - minX + 2;
    const height = maxY - minY + 2;
    const grid = Array(height).fill(null).map(() => Array(width).fill(false));
    
    pixelArray.forEach(([x, y]) => {
      grid[y - minY + 1][x - minX + 1] = true;
    });

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -offset;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    
    const drawnSegments = new Set<string>();
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const isSelected = grid[row] && grid[row][col];
        
        const top = row === 0 ? false : grid[row - 1][col];
        const bottom = row === height - 1 ? false : grid[row + 1]?.[col];
        const left = col === 0 ? false : grid[row][col - 1];
        const right = col === width - 1 ? false : grid[row][col + 1];
        
        const worldX = col + minX - 1;
        const worldY = row + minY - 1;
        const x = worldX * zoomLevel;
        const y = worldY * zoomLevel;
        
        if (isSelected) {
          if (!top) {
            const key = `h${worldX},${worldY}`;
            if (!drawnSegments.has(key)) {
              drawnSegments.add(key);
              ctx.moveTo(x, y);
              ctx.lineTo(x + zoomLevel, y);
            }
          }
          if (!bottom) {
            const key = `h${worldX},${worldY + 1}`;
            if (!drawnSegments.has(key)) {
              drawnSegments.add(key);
              ctx.moveTo(x, y + zoomLevel);
              ctx.lineTo(x + zoomLevel, y + zoomLevel);
            }
          }
          if (!left) {
            const key = `v${worldX},${worldY}`;
            if (!drawnSegments.has(key)) {
              drawnSegments.add(key);
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + zoomLevel);
            }
          }
          if (!right) {
            const key = `v${worldX + 1},${worldY}`;
            if (!drawnSegments.has(key)) {
              drawnSegments.add(key);
              ctx.moveTo(x + zoomLevel, y);
              ctx.lineTo(x + zoomLevel, y + zoomLevel);
            }
          }
        }
      }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    if (!sprite || !canvasRef.current || !previewCanvasRef.current || !cursorCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = sprite.width * zoom;
    canvas.height = sprite.height * zoom;
    previewCanvas.width = sprite.width * zoom;
    previewCanvas.height = sprite.height * zoom;
    cursorCanvas.width = sprite.width * zoom;
    cursorCanvas.height = sprite.height * zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (sprite.backgroundColor !== 'transparent') {
      ctx.fillStyle = sprite.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = '#cccccc';
          } else {
            ctx.fillStyle = '#999999';
          }
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
    }

    sprite.layers.forEach((layer) => {
      if (!layer.visible) return;
      
      const opacity = layer.opacity / 100;
      ctx.globalAlpha = opacity;

      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      });
      
      ctx.globalAlpha = 1;
    });

    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = gridColor;
      ctx.globalAlpha = gridOpacity;
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= sprite.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= sprite.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(canvas.width, y * zoom);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
    }

    if (selectedPixels.size > 0) {
      drawSelectionOutline(ctx, selectedPixels, zoom, marchingAntsOffset);
    }
  }, [sprite, zoom, showGrid, gridColor, gridSize, gridOpacity, selectedPixels, marchingAntsOffset]);

  const drawCursorPreview = useCallback(() => {
    if (!cursorCanvasRef.current || !sprite || !cursorPos) {
      if (cursorCanvasRef.current) {
        const ctx = cursorCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cursorCanvasRef.current.width, cursorCanvasRef.current.height);
      }
      return;
    }
    
    const cursorCanvas = cursorCanvasRef.current;
    const ctx = cursorCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    if (selectedTool === 'brush' || selectedTool === 'eraser' || selectedTool === 'pencil') {
      const brushSize = toolOptions.brushSize;
      const halfSize = Math.floor((brushSize - 1) / 2);
      const radius = (brushSize - 1) / 2;

      ctx.globalAlpha = 0.4;
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          if (selectedTool === 'brush' || selectedTool === 'eraser') {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > radius + 0.0001) continue;
          }
          const px = cursorPos.x + dx;
          const py = cursorPos.y + dy;
          if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
            ctx.fillStyle = selectedTool === 'brush' ? primaryColor : (selectedTool === 'pencil' ? primaryColor : '#ffffff');
            ctx.fillRect(px * zoom, py * zoom, zoom, zoom);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }, [cursorPos, selectedTool, toolOptions.brushSize, primaryColor, sprite, zoom]);

  useEffect(() => {
    drawCursorPreview();
  }, [drawCursorPreview]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarchingAntsOffset((prev) => (prev + 1) % 8);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getPixelCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!canvasRef.current || !sprite) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);
    
    if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) {
      return null;
    }
    
    return { x, y };
  };

  const drawPixel = (x: number, y: number, color: string, erase: boolean = false) => {
    if (!sprite) return;
    
    if (selectedPixels.size > 0 && !selectedPixels.has(`${x},${y}`)) {
      return;
    }
    
    const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    const brushSize = toolOptions.brushSize;
    const halfSize = Math.floor((brushSize - 1) / 2);
 
    const useCircularMask = selectedTool === 'brush';
    const radius = (brushSize - 1) / 2;

    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        if (useCircularMask) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radius + 0.0001) continue;
        }

        const px = x + dx;
        const py = y + dy;
        
        if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
          if (erase || selectedTool === 'eraser') {
            clearPixel(spriteId, activeLayer.id, px, py);
          } else {
            setPixel(spriteId, activeLayer.id, px, py, color);
          }
        }
      }
    }
  };

  const magicErase = (startX: number, startY: number) => {
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    if (selectedPixels.size > 0 && !selectedPixels.has(`${startX},${startY}`)) return;

    const startPixel = activeLayer.pixels.get(`${startX},${startY}`);
    if (!startPixel) return;

    const visited = new Set<string>();
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const pixelsToErase: { x: number; y: number }[] = [];

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const pixelColor = activeLayer.pixels.get(key);
      if (pixelColor !== startPixel) continue;

      if (selectedPixels.size > 0 && !selectedPixels.has(key)) continue;

      pixelsToErase.push({ x, y });

      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < sprite.width &&
          neighbor.y >= 0 &&
          neighbor.y < sprite.height &&
          !visited.has(`${neighbor.x},${neighbor.y}`)
        ) {
          queue.push(neighbor);
        }
      }
    }

    pixelsToErase.forEach(({ x, y }) => clearPixel(spriteId, activeLayer.id, x, y));
  };

  const selectionFromFlood = (startX: number, startY: number, addMode: boolean = false, subtractMode: boolean = false) => {
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
    if (!activeLayer) return;

    const startPixel = activeLayer.pixels.get(`${startX},${startY}`);
    if (!startPixel) return;

    const visited = new Set<string>();
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const selectedSet = new Set<string>();
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const pixelColor = activeLayer.pixels.get(key);
      if (pixelColor !== startPixel) continue;

      selectedSet.add(key);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < sprite.width &&
          neighbor.y >= 0 &&
          neighbor.y < sprite.height &&
          !visited.has(`${neighbor.x},${neighbor.y}`)
        ) {
          queue.push(neighbor);
        }
      }
    }

    if (subtractMode) {
      const newSel = new Set<string>(selectedPixels);
      selectedSet.forEach(p => newSel.delete(p));
      let minSX = Infinity, minSY = Infinity, maxSX = -Infinity, maxSY = -Infinity;
      newSel.forEach((key) => { const [x,y]=key.split(',').map(Number); minSX=Math.min(minSX,x); minSY=Math.min(minSY,y); maxSX=Math.max(maxSX,x); maxSY=Math.max(maxSY,y); });
      setSelection(newSel, newSel.size>0 ? { x: minSX, y: minSY, width: maxSX-minSX+1, height: maxSY-minSY+1 } : null);
    } else if (addMode) {
      const newSel = new Set<string>(selectedPixels);
      selectedSet.forEach(p => newSel.add(p));
      let minSX = Infinity, minSY = Infinity, maxSX = -Infinity, maxSY = -Infinity;
      newSel.forEach((key) => { const [x,y]=key.split(',').map(Number); minSX=Math.min(minSX,x); minSY=Math.min(minSY,y); maxSX=Math.max(maxSX,x); maxSY=Math.max(maxSY,y); });
      setSelection(newSel, newSel.size>0 ? { x: minSX, y: minSY, width: maxSX-minSX+1, height: maxSY-minSY+1 } : null);
    } else {
      setSelection(selectedSet, {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      });
    }
  };

  const drawLine = (x0: number, y0: number, x1: number, y1: number, color: string, erase: boolean = false) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      drawPixel(x0, y0, color, erase);

      if (x0 === x1 && y0 === y1) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  };

  const drawRectangle = (x0: number, y0: number, x1: number, y1: number, color: string) => {
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    if (toolOptions.shapeFill) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          setPixel(spriteId, activeLayer.id, x, y, color);
        }
      }
    }
    
    if (toolOptions.shapeOutline) {
      for (let x = minX; x <= maxX; x++) {
        setPixel(spriteId, activeLayer.id, x, minY, color);
        setPixel(spriteId, activeLayer.id, x, maxY, color);
      }
      for (let y = minY; y <= maxY; y++) {
        setPixel(spriteId, activeLayer.id, minX, y, color);
        setPixel(spriteId, activeLayer.id, maxX, y, color);
      }
    }
  };

  const drawEllipse = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    if (!sprite) return;
    
    const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    const cx = Math.floor((x1 + x2) / 2);
    const cy = Math.floor((y1 + y2) / 2);
    const rx = Math.floor(Math.abs(x2 - x1) / 2);
    const ry = Math.floor(Math.abs(y2 - y1) / 2);
    
    if (rx === 0 && ry === 0) {
      if (cx >= 0 && cx < sprite.width && cy >= 0 && cy < sprite.height) {
        setPixel(spriteId, activeLayer.id, cx, cy, color);
      }
      return;
    }

    const plotEllipsePixel = (x: number, y: number) => {
      if (x >= 0 && x < sprite.width && y >= 0 && y < sprite.height) {
        setPixel(spriteId, activeLayer.id, x, y, color);
      }
    };

    if (toolOptions.shapeFill) {
      for (let y = -ry; y <= ry; y++) {
        for (let x = -rx; x <= rx; x++) {
          const normX = x / (rx || 1);
          const normY = y / (ry || 1);
          if (normX * normX + normY * normY <= 1) {
            plotEllipsePixel(cx + x, cy + y);
          }
        }
      }
    }
    
    if (toolOptions.shapeOutline) {
      let x = 0;
      let y = ry;
      let rx2 = rx * rx;
      let ry2 = ry * ry;
      let twoRx2 = 2 * rx2;
      let twoRy2 = 2 * ry2;
      let p;
      let px = 0;
      let py = twoRx2 * y;

      plotEllipsePixel(cx + x, cy + y);
      plotEllipsePixel(cx - x, cy + y);
      plotEllipsePixel(cx + x, cy - y);
      plotEllipsePixel(cx - x, cy - y);

      p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
      while (px < py) {
        x++;
        px += twoRy2;
        if (p < 0) {
          p += ry2 + px;
        } else {
          y--;
          py -= twoRx2;
          p += ry2 + px - py;
        }
        plotEllipsePixel(cx + x, cy + y);
        plotEllipsePixel(cx - x, cy + y);
        plotEllipsePixel(cx + x, cy - y);
        plotEllipsePixel(cx - x, cy - y);
      }

      p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
      while (y > 0) {
        y--;
        py -= twoRx2;
        if (p > 0) {
          p += rx2 - py;
        } else {
          x++;
          px += twoRy2;
          p += rx2 - py + px;
        }
        plotEllipsePixel(cx + x, cy + y);
        plotEllipsePixel(cx - x, cy + y);
        plotEllipsePixel(cx + x, cy - y);
        plotEllipsePixel(cx - x, cy - y);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button === 2 && selectedPixels.size > 0) {
      e.preventDefault();
      setSelection(new Set<string>(), null);
      return;
    }

    if (selectedTool === 'move') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (selectedTool === 'zoom') {
      const newZoom = e.button === 0 
        ? Math.min(32, zoom + 2) 
        : Math.max(1, zoom - 2);
      setZoom(newZoom);
      return;
    }

    const coords = getPixelCoords(e);
    if (!coords || !sprite) return;

    const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    const color = e.button === 0 ? primaryColor : secondaryColor;

    if ((selectedTool === 'rectangleSelect' || selectedTool === 'quickSelect') && selectedPixels.size > 0) {
      const key = `${coords.x},${coords.y}`;
      if (selectedPixels.has(key)) {
        setIsMovingSelection(true);
        setSelectionMoveStart(coords);
        setSelectionMoveOffset({ dx: 0, dy: 0 });
        return;
      }
    }

    pushHistory(spriteId, activeLayer.id, activeLayer.pixels);

    setIsDrawing(true);
    setDragStart(coords);
    setDrawButton(e.button);

    if (selectedTool === 'brush') {
      drawPixel(coords.x, coords.y, color);
    } else if (selectedTool === 'pencil') {
      setPixel(spriteId, activeLayer.id, coords.x, coords.y, color);
    } else if (selectedTool === 'eraser') {
      drawPixel(coords.x, coords.y, color, true);
    } else if (selectedTool === 'magicEraser') {
      magicErase(coords.x, coords.y);
    } else if (selectedTool === 'colorReplace') {
      const startPixel = activeLayer.pixels.get(`${coords.x},${coords.y}`);
      if (startPixel) {
        const visited = new Set<string>();
        const queue: { x: number; y: number }[] = [{ x: coords.x, y: coords.y }];

        while (queue.length > 0) {
          const { x, y } = queue.shift()!;
          const key = `${x},${y}`;

          if (visited.has(key)) continue;
          visited.add(key);

          const pixelColor = activeLayer.pixels.get(key);
          if (pixelColor !== startPixel) continue;

          if (selectedPixels.size === 0 || selectedPixels.has(key)) {
            setPixel(spriteId, activeLayer.id, x, y, color);
          }

          const neighbors = [
            { x: x + 1, y },
            { x: x - 1, y },
            { x, y: y + 1 },
            { x, y: y - 1 },
          ];

          for (const neighbor of neighbors) {
            if (
              neighbor.x >= 0 &&
              neighbor.x < sprite.width &&
              neighbor.y >= 0 &&
              neighbor.y < sprite.height &&
              !visited.has(`${neighbor.x},${neighbor.y}`)
            ) {
              queue.push(neighbor);
            }
          }
        }
      }
    } else if (selectedTool === 'bucket') {
      if (selectedPixels.size > 0 && !selectedPixels.has(`${coords.x},${coords.y}`)) {
      } else if (selectedPixels.size > 0) {
        const targetColor = activeLayer.pixels.get(`${coords.x},${coords.y}`) || 'transparent';
        const stack: { x: number; y: number }[] = [{ x: coords.x, y: coords.y }];
        const visited = new Set<string>();
        while (stack.length > 0) {
          const { x, y } = stack.pop()!;
          const key = `${x},${y}`;
          if (visited.has(key)) continue;
          if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) continue;
          if (!selectedPixels.has(key)) continue;
          const currentColor = activeLayer.pixels.get(key) || 'transparent';
          if (currentColor !== targetColor) continue;
          visited.add(key);
          setPixel(spriteId, activeLayer.id, x, y, color);
          stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
        }
      } else {
        fillArea(spriteId, activeLayer.id, coords.x, coords.y, color);
      }
    } else if (selectedTool === 'picker') {
      const pixelColor = activeLayer.pixels.get(`${coords.x},${coords.y}`);
      if (pixelColor) {
        setPrimaryColor(pixelColor);
      }
    } else if (selectedTool === 'rectangleSelect') {
      setShapeDrawButton(e.button);
    } else if (selectedTool === 'quickSelect') {
      const subtractMode = e.shiftKey && e.ctrlKey;
      const addMode = e.shiftKey && !e.ctrlKey;
      
      if (subtractMode) {
        setQuickSelectMode('subtract');
      } else if (addMode) {
        setQuickSelectMode('add');
      } else {
        setSelection(new Set(), null);
        setQuickSelectMode('new');
      }
      setDragStart(coords);
    } else if (selectedTool === 'magicWand') {
      const subtractMode = e.shiftKey && e.ctrlKey;
      const addMode = e.shiftKey && !e.ctrlKey;
      selectionFromFlood(coords.x, coords.y, addMode, subtractMode);
    } else if (['line', 'rectangle', 'circle', 'ellipse'].includes(selectedTool)) {
      setShapeDrawButton(e.button);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getPixelCoords(e);
    setCursorPos(coords);
    if (coords) {
      (document as any)._pixoLastCursorPos = coords;
    }

    if (isPanning && dragStart) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (isMovingSelection && selectionMoveStart) {
      if (coords) {
        const dx = coords.x - selectionMoveStart.x;
        const dy = coords.y - selectionMoveStart.y;
        setSelectionMoveOffset({ dx, dy });
        drawPreviewSelectionOffset(dx, dy);
      }
      return;
    }

    if (!isDrawing || !dragStart) return;
    
    if (!coords) return;

    const color = drawButton === 0 ? primaryColor : secondaryColor;

    if (selectedTool === 'brush') {
      drawLine(dragStart.x, dragStart.y, coords.x, coords.y, color);
      setDragStart(coords);
      drawPreview();
    } else if (selectedTool === 'pencil') {
      drawLine(dragStart.x, dragStart.y, coords.x, coords.y, color);
      setDragStart(coords);
      drawPreview();
    } else if (selectedTool === 'eraser') {
      drawLine(dragStart.x, dragStart.y, coords.x, coords.y, color, true);
      setDragStart(coords);
      drawPreview();
    } else if (selectedTool === 'rectangleSelect') {
      drawPreview(dragStart, coords);
    } else if (selectedTool === 'quickSelect' && dragStart && coords) {
      const brushSize = toolOptions.brushSize;
      const halfSize = Math.floor((brushSize - 1) / 2);
      const radius = (brushSize - 1) / 2;
      const sprWidth = sprite ? sprite.width : 0;
      const sprHeight = sprite ? sprite.height : 0;
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radius + 0.0001) continue;
          const px = coords.x + dx;
          const py = coords.y + dy;
          if (px >= 0 && px < sprWidth && py >= 0 && py < sprHeight) {
            if (quickSelectMode === 'subtract') {
              removeFromSelection(px, py);
            } else {
              addToSelection(px, py);
            }
          }
        }
      }
      drawPreview(dragStart, coords);
    } else if (selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'ellipse') {
      drawPreview(dragStart, coords);
    }
  };

  const drawPreviewSelectionOffset = (dx: number, dy: number) => {
    if (!previewCanvasRef.current || !sprite) return;
    const previewCtx = previewCanvasRef.current.getContext('2d');
    const mainCanvas = canvasRef.current;
    if (!previewCtx || !mainCanvas) return;
    previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    previewCtx.drawImage(mainCanvas, 0, 0);
    
    const offsetPixels = new Set<string>();
    selectedPixels.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < sprite.width && ny >= 0 && ny < sprite.height) {
        offsetPixels.add(`${nx},${ny}`);
      }
    });
    drawSelectionOutline(previewCtx, offsetPixels, zoom, marchingAntsOffset);
  };

  const drawPreview = (start?: { x: number; y: number } | null, end?: { x: number; y: number } | null) => {
    if (!canvasRef.current || !previewCanvasRef.current || !sprite) return;

    const mainCtx = canvasRef.current.getContext('2d');
    const previewCtx = previewCanvasRef.current.getContext('2d');
    if (!mainCtx || !previewCtx) return;

    previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    previewCtx.drawImage(canvasRef.current, 0, 0);

    if (start && end && (selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'ellipse' || selectedTool === 'rectangleSelect')) {
      const previewColor = shapeDrawButton === 0 ? primaryColor : secondaryColor;
      previewCtx.fillStyle = previewColor;
      previewCtx.globalAlpha = 1.0;

      if (selectedTool === 'rectangleSelect') {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        previewCtx.strokeStyle = '#ffffff';
        previewCtx.lineWidth = 1;
        previewCtx.globalAlpha = 1;
        previewCtx.setLineDash([2, 2]);
        previewCtx.strokeRect(minX * zoom, minY * zoom, (maxX - minX + 1) * zoom, (maxY - minY + 1) * zoom);
        previewCtx.setLineDash([]);
      }

      if (selectedTool === 'line') {
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        const sx = start.x < end.x ? 1 : -1;
        const sy = start.y < end.y ? 1 : -1;
        let err = dx - dy;
        let x = start.x;
        let y = start.y;

        while (true) {
          const brushSize = toolOptions.brushSize;
          const halfSize = Math.floor((brushSize - 1) / 2);
          const radius = (brushSize - 1) / 2;
          for (let dy2 = -halfSize; dy2 <= halfSize; dy2++) {
            for (let dx2 = -halfSize; dx2 <= halfSize; dx2++) {
              const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
              if (dist > radius + 0.0001) continue;
              const px = x + dx2;
              const py = y + dy2;
              if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
                previewCtx.fillRect(px * zoom, py * zoom, zoom, zoom);
              }
            }
          }
          if (x === end.x && y === end.y) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x += sx; }
          if (e2 < dx) { err += dx; y += sy; }
        }
      } else if (selectedTool === 'rectangle') {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        if (toolOptions.shapeFill) {
          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              previewCtx.fillRect(x * zoom, y * zoom, zoom, zoom);
            }
          }
        } else if (toolOptions.shapeOutline) {
          for (let x = minX; x <= maxX; x++) {
            previewCtx.fillRect(x * zoom, minY * zoom, zoom, zoom);
            previewCtx.fillRect(x * zoom, maxY * zoom, zoom, zoom);
          }
          for (let y = minY; y <= maxY; y++) {
            previewCtx.fillRect(minX * zoom, y * zoom, zoom, zoom);
            previewCtx.fillRect(maxX * zoom, y * zoom, zoom, zoom);
          }
        }
      } else if (selectedTool === 'circle' || selectedTool === 'ellipse') {
        const cx = Math.floor((start.x + end.x) / 2);
        const cy = Math.floor((start.y + end.y) / 2);
        const rx = Math.floor(Math.abs(end.x - start.x) / 2);
        const ry = Math.floor(Math.abs(end.y - start.y) / 2);

        const plotPreviewPixel = (x: number, y: number) => {
          if (x >= 0 && x < sprite.width && y >= 0 && y < sprite.height) {
            previewCtx.fillRect(x * zoom, y * zoom, zoom, zoom);
          }
        };

        if (toolOptions.shapeFill) {
          for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
              const normX = x / (rx || 1);
              const normY = y / (ry || 1);
              if (normX * normX + normY * normY <= 1) {
                plotPreviewPixel(cx + x, cy + y);
              }
            }
          }
        }

        if (toolOptions.shapeOutline) {
          let x = 0;
          let y = ry;
          let rx2 = rx * rx;
          let ry2 = ry * ry;
          let twoRx2 = 2 * rx2;
          let twoRy2 = 2 * ry2;
          let p;
          let px = 0;
          let py = twoRx2 * y;

          plotPreviewPixel(cx + x, cy + y);
          plotPreviewPixel(cx - x, cy + y);
          plotPreviewPixel(cx + x, cy - y);
          plotPreviewPixel(cx - x, cy - y);

          p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
          while (px < py) {
            x++;
            px += twoRy2;
            if (p < 0) {
              p += ry2 + px;
            } else {
              y--;
              py -= twoRx2;
              p += ry2 + px - py;
            }
            plotPreviewPixel(cx + x, cy + y);
            plotPreviewPixel(cx - x, cy + y);
            plotPreviewPixel(cx + x, cy - y);
            plotPreviewPixel(cx - x, cy - y);
          }

          p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
          while (y > 0) {
            y--;
            py -= twoRx2;
            if (p > 0) {
              p += rx2 - py;
            } else {
              x++;
              px += twoRy2;
              p += rx2 - py + px;
            }
            plotPreviewPixel(cx + x, cy + y);
            plotPreviewPixel(cx - x, cy + y);
            plotPreviewPixel(cx + x, cy - y);
            plotPreviewPixel(cx - x, cy - y);
          }
        }
      }
      
      previewCtx.globalAlpha = 1;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
      return;
    }

    if (isMovingSelection && selectionMoveStart) {
      const coords = getPixelCoords(e);
      const dx = coords ? coords.x - selectionMoveStart.x : selectionMoveOffset.dx;
      const dy = coords ? coords.y - selectionMoveStart.y : selectionMoveOffset.dy;
      if (sprite) {
        const activeLayer = sprite.layers.find((l) => l.id === sprite.activeLayerId);
        if (activeLayer && !activeLayer.locked) {
          const originalKeys = Array.from(selectedPixels);
          const moves: { from: string; to: string; color: string | undefined }[] = [];
          originalKeys.forEach((key) => {
            const [x, y] = key.split(',').map(Number);
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < sprite.width && ny >= 0 && ny < sprite.height) {
              const color = activeLayer.pixels.get(key);
              moves.push({ from: key, to: `${nx},${ny}`, color });
            }
          });
          moves.forEach(m => {
            const [fx, fy] = m.from.split(',').map(Number);
            clearPixel(spriteId, activeLayer.id, fx, fy);
          });
          moves.forEach(m => {
            const [tx, ty] = m.to.split(',').map(Number);
            if (m.color) setPixel(spriteId, activeLayer.id, tx, ty, m.color);
          });
          const newSel = new Set<string>();
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          originalKeys.forEach((key) => {
            const [x, y] = key.split(',').map(Number);
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < sprite.width && ny >= 0 && ny < sprite.height) {
              const nk = `${nx},${ny}`;
              newSel.add(nk);
              minX = Math.min(minX, nx);
              minY = Math.min(minY, ny);
              maxX = Math.max(maxX, nx);
              maxY = Math.max(maxY, ny);
            }
          });
          setSelection(newSel, {
            x: isFinite(minX) ? minX : 0,
            y: isFinite(minY) ? minY : 0,
            width: isFinite(maxX) && isFinite(minX) ? (maxX - minX + 1) : 0,
            height: isFinite(maxY) && isFinite(minY) ? (maxY - minY + 1) : 0,
          });
        }
      }
      setIsMovingSelection(false);
      setSelectionMoveStart(null);
      setSelectionMoveOffset({ dx: 0, dy: 0 });
      if (previewCanvasRef.current) {
        const previewCtx = previewCanvasRef.current.getContext('2d');
        if (previewCtx) previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
      return;
    }

    if (!isDrawing || !dragStart) return;
    
    const coords = getPixelCoords(e);
    if (!coords) {
      setIsDrawing(false);
      setDragStart(null);
      if (previewCanvasRef.current) {
        const previewCtx = previewCanvasRef.current.getContext('2d');
        if (previewCtx) previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
      setSelection(new Set<string>(), null);
      return;
    }

    const color = e.button === 0 ? primaryColor : secondaryColor;

    if (selectedTool === 'rectangleSelect') {
      const minX = Math.min(dragStart.x, coords.x);
      const maxX = Math.max(dragStart.x, coords.x);
      const minY = Math.min(dragStart.y, coords.y);
      const maxY = Math.max(dragStart.y, coords.y);
      const addMode = (e as any).shiftKey && !(e as any).ctrlKey;
      const subtractMode = (e as any).shiftKey && (e as any).ctrlKey;
      
      const newPixels = new Set<string>();
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          newPixels.add(`${x},${y}`);
        }
      }
      
      if (addMode) {
        newPixels.forEach(p => addToSelection(...p.split(',').map(Number) as [number, number]));
        const allSel = new Set<string>(selectedPixels);
        newPixels.forEach(p => allSel.add(p));
        let minSX = Infinity, minSY = Infinity, maxSX = -Infinity, maxSY = -Infinity;
        allSel.forEach((key) => { const [x,y]=key.split(',').map(Number); minSX=Math.min(minSX,x); minSY=Math.min(minSY,y); maxSX=Math.max(maxSX,x); maxSY=Math.max(maxSY,y); });
        setSelection(allSel, allSel.size>0 ? { x: minSX, y: minSY, width: maxSX-minSX+1, height: maxSY-minSY+1 } : null);
      } else if (subtractMode) {
        newPixels.forEach(p => removeFromSelection(...p.split(',').map(Number) as [number, number]));
        const allSel = new Set<string>(selectedPixels);
        newPixels.forEach(p => allSel.delete(p));
        let minSX = Infinity, minSY = Infinity, maxSX = -Infinity, maxSY = -Infinity;
        allSel.forEach((key) => { const [x,y]=key.split(',').map(Number); minSX=Math.min(minSX,x); minSY=Math.min(minSY,y); maxSX=Math.max(maxSX,x); maxSY=Math.max(maxSY,y); });
        setSelection(allSel, allSel.size>0 ? { x: minSX, y: minSY, width: maxSX-minSX+1, height: maxSY-minSY+1 } : null);
      } else {
        let minSX = Infinity, minSY = Infinity, maxSX = -Infinity, maxSY = -Infinity;
        newPixels.forEach((key) => { const [x,y]=key.split(',').map(Number); minSX=Math.min(minSX,x); minSY=Math.min(minSY,y); maxSX=Math.max(maxSX,x); maxSY=Math.max(maxSY,y); });
        setSelection(newPixels, newPixels.size>0 ? { x: minSX, y: minSY, width: maxSX-minSX+1, height: maxSY-minSY+1 } : null);
      }
    } else if (selectedTool === 'line') {
      drawLine(dragStart.x, dragStart.y, coords.x, coords.y, color);
    } else if (selectedTool === 'rectangle') {
      drawRectangle(dragStart.x, dragStart.y, coords.x, coords.y, color);
    } else if (selectedTool === 'circle' || selectedTool === 'ellipse') {
      drawEllipse(dragStart.x, dragStart.y, coords.x, coords.y, color);
    }

    setIsDrawing(false);
    setDragStart(null);
    setShapeDrawButton(0);
    setDrawButton(0);
    
    if (previewCanvasRef.current) {
      const previewCtx = previewCanvasRef.current.getContext('2d');
      if (previewCtx) previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const coords = getPixelCoords(e);
    setCursorPos(coords);
  };

    const handleMouseLeave = () => {
      setCursorPos(null);
      if (!['line', 'rectangle', 'circle', 'ellipse'].includes(selectedTool)) {
        setIsDrawing(false);
        setDragStart(null);
      }
    };


  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey) {
      const { toolOptions, setToolOptions } = useAppStore.getState();
      const newBrushSize = e.deltaY > 0 
        ? Math.max(1, toolOptions.brushSize - 1) 
        : Math.min(50, toolOptions.brushSize + 1);
      setToolOptions({ brushSize: newBrushSize });
    } else {
      const delta = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.max(1, Math.min(32, zoom + delta));
      setZoom(newZoom);
    }
  }, [setZoom, zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const wheelListener = (event: WheelEvent) => handleWheel(event);
    el.addEventListener('wheel', wheelListener, { passive: false });
    return () => el.removeEventListener('wheel', wheelListener);
  }, [handleWheel]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <div className="canvas-wrapper" style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        cursor: selectedTool === 'move' ? 'grab' : isPanning ? 'grabbing' : 'crosshair',
      }}>
        <canvas
          ref={canvasRef}
          className="canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(e) => e.preventDefault()}
        />
        <canvas
          ref={previewCanvasRef}
          className="canvas canvas-preview"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />
        <canvas
          ref={cursorCanvasRef}
          className="canvas canvas-cursor"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default Canvas;
