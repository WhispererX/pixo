import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { Tool } from '../types';
import { FiMove } from 'react-icons/fi';
import { BsEraser, BsEyedropper, BsPaintBucket, BsSearch, BsSlash, BsSquare } from 'react-icons/bs';
import { TbOvalVertical, TbWand, TbBrush, TbPencil, TbColorFilter, TbSparkles, TbRectangleFilled } from 'react-icons/tb';
import { MdOutlineSelectAll, MdAutoAwesome } from 'react-icons/md';
import ToolGroup, { ToolGroupDef } from './ToolGroup';
import { getShortcut, formatShortcut } from '../utils/shortcutManager';
import './Toolbar.css';

interface ToolbarProps {
  style?: React.CSSProperties;
}

function Toolbar({ style }: ToolbarProps) {
  const { selectedTool, setSelectedTool } = useAppStore();
  
  const [activeToolPerGroup, setActiveToolPerGroup] = useState<Record<string, Tool>>({
    selection: 'quickSelect',
    painting: 'brush',
    eraser: 'eraser',
    shapes: 'rectangle',
    fill: 'bucket',
    utility: 'move',
  });

  const handleSelectTool = (groupId: string, tool: Tool) => {
    setSelectedTool(tool);
    setActiveToolPerGroup(prev => ({ ...prev, [groupId]: tool }));
  };
  
  const toolGroups = useMemo<ToolGroupDef[]>(() => [
    {
      id: 'selection',
      tools: [
        { id: 'quickSelect', label: `Freehand Select (${formatShortcut(getShortcut('quickSelect'))})`, icon: <MdOutlineSelectAll /> },
        { id: 'rectangleSelect', label: `Rectangle Select (${formatShortcut(getShortcut('rectSelect'))})`, icon: <TbRectangleFilled /> },
        { id: 'magicWand', label: `Magic Wand (${formatShortcut(getShortcut('magicWand'))})`, icon: <TbWand /> },
      ]
    },
    {
      id: 'painting',
      tools: [
        { id: 'brush', label: `Brush (${formatShortcut(getShortcut('brush'))})`, icon: <TbBrush /> },
        { id: 'pencil', label: `Pencil (${formatShortcut(getShortcut('pencil'))})`, icon: <TbPencil /> },
        { id: 'colorReplace', label: 'Color Replace', icon: <TbColorFilter /> },
      ]
    },
    {
      id: 'eraser',
      tools: [
        { id: 'eraser', label: `Eraser (${formatShortcut(getShortcut('eraser'))})`, icon: <BsEraser /> },
        { id: 'magicEraser', label: 'Magic Eraser', icon: <TbSparkles /> },
      ]
    },
    {
      id: 'shapes',
      tools: [
        { id: 'rectangle', label: `Rectangle (${formatShortcut(getShortcut('rectangle'))})`, icon: <BsSquare /> },
        { id: 'ellipse', label: `Ellipse (${formatShortcut(getShortcut('ellipse'))})`, icon: <TbOvalVertical /> },
        { id: 'line', label: `Line (${formatShortcut(getShortcut('line'))})`, icon: <BsSlash /> },
      ]
    },
    {
      id: 'fill',
      tools: [
        { id: 'bucket', label: `Paint Bucket (${formatShortcut(getShortcut('bucket'))})`, icon: <BsPaintBucket /> },
      ]
    },
    {
      id: 'utility',
      tools: [
        { id: 'move', label: `Hand Tool (${formatShortcut(getShortcut('move'))})`, icon: <FiMove /> },
        { id: 'zoom', label: `Zoom (${formatShortcut(getShortcut('zoom'))})`, icon: <BsSearch /> },
        { id: 'picker', label: `Eyedropper (${formatShortcut(getShortcut('picker'))})`, icon: <BsEyedropper /> },
        { id: 'ai', label: `AI Generate (${formatShortcut(getShortcut('ai'))})`, icon: <MdAutoAwesome /> },
      ]
    },
  ], []);

  return (
    <div className="toolbar" style={style}>
      <div className="toolbar-section">
        <div className="tool-grid">
          {toolGroups.map((group) => (
            <ToolGroup
              key={group.id}
              group={group}
              selectedTool={selectedTool}
              activeTool={activeToolPerGroup[group.id]}
              onSelectTool={(tool) => handleSelectTool(group.id, tool)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
