import { useRef, useEffect, useState } from 'react';
import { FiX, FiMove } from 'react-icons/fi';
import { useAppStore } from '../store/appStore';
import './PreviewPanel.css';

interface PreviewPanelProps {
  spriteId: string;
}

function PreviewPanel({ spriteId }: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { sprites } = useAppStore();
  const sprite = sprites.get(spriteId);
  
  const [position, setPosition] = useState({ x: window.innerWidth - 250, y: window.innerHeight - 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!sprite || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = sprite.width;
    canvas.height = sprite.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (sprite.backgroundColor !== 'transparent') {
      ctx.fillStyle = sprite.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const checkerSize = 4;
      for (let y = 0; y < sprite.height; y += checkerSize) {
        for (let x = 0; x < sprite.width; x += checkerSize) {
          if ((Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0) {
            ctx.fillStyle = '#cccccc';
          } else {
            ctx.fillStyle = '#999999';
          }
          ctx.fillRect(x, y, checkerSize, checkerSize);
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
        ctx.fillRect(x, y, 1, 1);
      });
      
      ctx.globalAlpha = 1;
    });
  }, [sprite]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleWindowResize = () => {
      setPosition({
        x: Math.max(0, window.innerWidth - 250),
        y: Math.max(0, window.innerHeight - 250),
      });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!sprite || !isVisible) return null;

  return (
    <div
      ref={panelRef}
      className="preview-panel floating"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="preview-panel-header" onMouseDown={handleMouseDown}>
        <FiMove size={14} className="drag-icon" />
        <span className="panel-title">Preview</span>
        <button className="close-button" onClick={() => setIsVisible(false)}>
          <FiX size={14} />
        </button>
      </div>
      <div className="preview-content">
        <canvas ref={canvasRef} className="preview-canvas" />
        <div className="preview-info">
          {sprite.width} × {sprite.height}
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;
