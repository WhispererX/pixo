import { useState, useEffect, useRef } from 'react';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  items: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }[];
  onClose: () => void;
}

function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x, y });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;

      if (newX + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 5;
      }
      
      if (newY + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 5;
      }

      if (newX < 0) newX = 5;
      if (newY < 0) newY = 5;

      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  if (!visible) return null;

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setVisible(false);
    onClose();
  };

  return (
    <>
      <div className="context-menu-backdrop" onClick={() => { setVisible(false); onClose(); }} />
      <div className="context-menu" ref={menuRef} style={{ top: `${position.y}px`, left: `${position.x}px` }}>
        {items.map((item, idx) => (
          <button
            key={idx}
            className="context-menu-item"
            onClick={() => handleItemClick(item.onClick)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default ContextMenu;
