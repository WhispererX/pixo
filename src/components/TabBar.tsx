import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import './TabBar.css';

function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, reorderTabs } = useAppStore();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    
    if (tabId === 'home') return;
    
    removeTab(tabId);
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId) return;

    const tabIds = tabs.map(t => t.id);
    const draggedIndex = tabIds.indexOf(draggedTabId);
    const targetIndex = tabIds.indexOf(targetTabId);

    const newTabIds = [...tabIds];
    newTabIds.splice(draggedIndex, 1);
    newTabIds.splice(targetIndex, 0, draggedTabId);

    reorderTabs(newTabIds);
    setDraggedTabId(null);
  };

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, tab.id)}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-title">
            {tab.modified && '• '}
            {tab.title}
          </span>
          {tab.id !== 'home' && (
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(e, tab.id)}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default TabBar;
