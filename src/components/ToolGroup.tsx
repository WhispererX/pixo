import { useState, useRef, useEffect } from 'react';
import { Tool } from '../types';
import './ToolGroup.css';

export interface ToolDef {
  id: Tool;
  label: string;
  icon: JSX.Element;
}

export interface ToolGroupDef {
  id: string;
  tools: ToolDef[];
}

interface ToolGroupProps {
  group: ToolGroupDef;
  selectedTool: Tool;
  activeTool: Tool;
  onSelectTool: (tool: Tool) => void;
}

function ToolGroup({ group, selectedTool, activeTool, onSelectTool }: ToolGroupProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [submenuPos, setSubmenuPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const currentTool = group.tools.find(t => t.id === activeTool) || group.tools[0];
  const hasMultipleTools = group.tools.length > 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        submenuRef.current &&
        !submenuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowSubmenu(false);
      }
    };

    if (showSubmenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSubmenu]);

  const handleClick = () => {
    onSelectTool(currentTool.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!hasMultipleTools) return;
    
    e.preventDefault();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setSubmenuPos({
        x: rect.right + 5,
        y: rect.top
      });
      setShowSubmenu(true);
    }
  };

  const handleSubmenuToolClick = (tool: ToolDef) => {
    onSelectTool(tool.id);
    setShowSubmenu(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`tool-button ${selectedTool === currentTool.id ? 'active' : ''} ${hasMultipleTools ? 'grouped' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={currentTool.label}
      >
        {currentTool.icon}
        {hasMultipleTools && <span className="group-indicator">▸</span>}
      </button>

      {showSubmenu && (
        <div
          ref={submenuRef}
          className="tool-submenu"
          style={{
            position: 'fixed',
            left: `${submenuPos.x}px`,
            top: `${submenuPos.y}px`
          }}
        >
          {group.tools.map(tool => (
            <button
              key={tool.id}
              className={`submenu-tool ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => handleSubmenuToolClick(tool)}
              title={tool.label}
            >
              {tool.icon}
              <span className="submenu-label">{tool.label.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default ToolGroup;
