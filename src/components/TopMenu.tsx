import MenuBar from './MenuBar';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';

interface TopMenuProps {
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpen?: () => void;
  onExport?: () => void;
  onResizeCanvas?: (width: number, height: number) => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onRotate90CW?: () => void;
  onRotate90CCW?: () => void;
  onFillSelection?: () => void;
  onStrokeSelection?: () => void;
  onOutlineSelection?: () => void;
  onDuplicateSprite?: () => void;
  onTrimCanvas?: () => void;
  onSelectAll?: () => void;
  isEditing: boolean;
}

function TopMenu({ 
  onSave,
  onSaveAs,
  onOpen,
  onExport, 
  onResizeCanvas,
  onFlipHorizontal,
  onFlipVertical,
  onRotate90CW,
  onRotate90CCW,
  onFillSelection,
  onStrokeSelection,
  onOutlineSelection,
  onDuplicateSprite,
  onTrimCanvas,
  onSelectAll,
  isEditing 
}: TopMenuProps) {
  const { activeTabId, tabs, sprites, addTab, addSprite, setActiveTab } = useAppStore();

  const handleNewSprite = (width: number, height: number, name: string) => {
    const spriteId = uuidv4();
    const defaultLayer = {
      id: uuidv4(),
      name: 'Layer 1',
      visible: true,
      opacity: 1,
      pixels: new Map<string, string>(),
      locked: false,
    };

    // Create new sprite
    addSprite({
      id: spriteId,
      name,
      width,
      height,
      backgroundColor: '#FFFFFF',
      layers: [defaultLayer],
      activeLayerId: defaultLayer.id,
    });

    // Create new tab
    const newTab = {
      id: uuidv4(),
      type: 'sprite' as const,
      title: name,
      spriteId,
      modified: false,
    };

    addTab(newTab);
    setActiveTab(newTab.id);
  };

  if (!isEditing) return null;

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const currentSpriteId = activeTab?.spriteId;
  let currentWidth = 32;
  let currentHeight = 32;
  if (currentSpriteId) {
    const sprite = sprites.get(currentSpriteId);
    if (sprite) {
      currentWidth = sprite.width;
      currentHeight = sprite.height;
    }
  }

  return (
    <MenuBar
      onNewSprite={handleNewSprite}
      onSave={onSave || (() => {})}
      onSaveAs={onSaveAs || (() => {})}
      onOpen={onOpen || (() => {})}
      onExport={onExport || (() => {})}
      onResizeCanvas={onResizeCanvas}
      onFlipHorizontal={onFlipHorizontal}
      onFlipVertical={onFlipVertical}
      onRotate90CW={onRotate90CW}
      onRotate90CCW={onRotate90CCW}
      onFillSelection={onFillSelection}
      onStrokeSelection={onStrokeSelection}
      onOutlineSelection={onOutlineSelection}
      onDuplicateSprite={onDuplicateSprite}
      onTrimCanvas={onTrimCanvas}
      onSelectAll={onSelectAll}
      currentSpriteWidth={currentWidth}
      currentSpriteHeight={currentHeight}
      currentSpriteId={currentSpriteId}
    />
  );
}

export default TopMenu;
