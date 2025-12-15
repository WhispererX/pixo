import { useEffect, useRef } from 'react';
import { useAppStore } from './store/appStore';
import TabBar from './components/TabBar';
import TopMenu from './components/TopMenu';
import HomeView from './components/HomeView';
import SpriteEditor from './components/SpriteEditor';
import './App.css';
import { handleOpenPath } from './utils/menuActions';

function App() {
  const { tabs, activeTabId } = useAppStore();
  const spriteEditorRef = useRef<any>(null);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isEditing = activeTab?.type === 'sprite' && activeTab.spriteId;

  const handleSave = () => {
    spriteEditorRef.current?.handleSave();
  };

  const handleSaveAs = () => {
    spriteEditorRef.current?.handleSaveAs();
  };

  const handleOpen = () => {
    spriteEditorRef.current?.handleOpen();
  };

  const handleExport = () => {
    spriteEditorRef.current?.handleExport();
  };

  const handleResizeCanvas = (width: number, height: number) => {
    spriteEditorRef.current?.handleResizeCanvas(width, height);
  };

  const handleFlipHorizontal = () => {
    spriteEditorRef.current?.handleFlipHorizontal();
  };

  const handleFlipVertical = () => {
    spriteEditorRef.current?.handleFlipVertical();
  };

  const handleRotate90CW = () => {
    spriteEditorRef.current?.handleRotate90CW();
  };

  const handleRotate90CCW = () => {
    spriteEditorRef.current?.handleRotate90CCW();
  };

  const handleFillSelection = () => {
    spriteEditorRef.current?.handleFillSelection();
  };

  const handleStrokeSelection = () => {
    spriteEditorRef.current?.handleStrokeSelection();
  };

  const handleOutlineSelection = () => {
    spriteEditorRef.current?.handleOutlineSelection();
  };

  const handleDuplicateSprite = () => {
    spriteEditorRef.current?.handleDuplicateSprite();
  };

  const handleTrimCanvas = () => {
    spriteEditorRef.current?.handleTrimCanvas();
  };

  const handleSelectAll = () => {
    spriteEditorRef.current?.handleSelectAll();
  };

  // Listen for OS-level open-file events from Electron main
  useEffect(() => {
    if (!window.electronAPI?.onOpenFile) return;
    const unsubscribe = window.electronAPI.onOpenFile((filePath) => {
      // Ensure UI is ready to accept a new tab
      setTimeout(() => handleOpenPath(filePath), 0);
    });
    return () => { try { unsubscribe?.(); } catch {} };
  }, []);

  return (
    <div className="app">
      <TopMenu 
        isEditing={!!isEditing}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onOpen={handleOpen}
        onExport={handleExport}
        onResizeCanvas={handleResizeCanvas}
        onFlipHorizontal={handleFlipHorizontal}
        onFlipVertical={handleFlipVertical}
        onRotate90CW={handleRotate90CW}
        onRotate90CCW={handleRotate90CCW}
        onFillSelection={handleFillSelection}
        onStrokeSelection={handleStrokeSelection}
        onOutlineSelection={handleOutlineSelection}
        onDuplicateSprite={handleDuplicateSprite}
        onTrimCanvas={handleTrimCanvas}
        onSelectAll={handleSelectAll}
      />
      <TabBar />
      <div className="app-content">
        {activeTab?.type === 'home' && <HomeView />}
        {isEditing && (
          <SpriteEditor ref={spriteEditorRef} spriteId={activeTab.spriteId!} />
        )}
      </div>
    </div>
  );
}

export default App;
