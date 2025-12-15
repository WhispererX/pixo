import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Layer } from '../types';
import { FiEye, FiEyeOff, FiLock, FiUnlock, FiPlus, FiMoreVertical } from 'react-icons/fi';
import ContextMenu from './ContextMenu';
import LayerPropertiesDialog from './LayerPropertiesDialog';
import './LayerPanel.css';

interface LayerPanelProps {
  spriteId: string;
  style?: React.CSSProperties;
}

interface ContextMenuState {
  layerId: string;
  x: number;
  y: number;
}

function LayerPanel({ spriteId, style }: LayerPanelProps) {
  const { sprites, addLayer, removeLayer, updateLayer, setActiveLayer, reorderLayers } = useAppStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [propertiesDialog, setPropertiesDialog] = useState<{ layerId: string; name: string; opacity: number } | null>(null);
  const sprite = sprites.get(spriteId);

  if (!sprite) return null;

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${sprite.layers.length + 1}`,
      visible: true,
      opacity: 100,
      pixels: new Map(),
      locked: false,
    };
    addLayer(spriteId, newLayer);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (sprite.layers.length > 1) {
      removeLayer(spriteId, layerId);
    }
  };

  const handleToggleVisibility = (layerId: string) => {
    const layer = sprite.layers.find((l) => l.id === layerId);
    if (layer) {
      updateLayer(spriteId, layerId, { visible: !layer.visible });
    }
  };

  const handleToggleLock = (layerId: string) => {
    const layer = sprite.layers.find((l) => l.id === layerId);
    if (layer) {
      updateLayer(spriteId, layerId, { locked: !layer.locked });
    }
  };

  const handlePropertiesConfirm = (name: string, opacity: number) => {
    if (propertiesDialog) {
      updateLayer(spriteId, propertiesDialog.layerId, { name, opacity });
      setPropertiesDialog(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) return;

    const layerIds = sprite!.layers.map(l => l.id);
    const draggedIndex = layerIds.indexOf(draggedLayerId);
    const targetIndex = layerIds.indexOf(targetLayerId);

    const newLayerIds = [...layerIds];
    newLayerIds.splice(draggedIndex, 1);
    newLayerIds.splice(targetIndex, 0, draggedLayerId);

    reorderLayers(spriteId, newLayerIds);
    setDraggedLayerId(null);
  };

  const handleMergeDown = (layerId: string) => {
    const layerIndex = sprite!.layers.findIndex(l => l.id === layerId);
    if (layerIndex === 0) return;

    const currentLayer = sprite!.layers[layerIndex];
    const belowLayer = sprite!.layers[layerIndex - 1];

    const mergedPixels = new Map(belowLayer.pixels);
    currentLayer.pixels.forEach((color, key) => {
      mergedPixels.set(key, color);
    });

    updateLayer(spriteId, belowLayer.id, { pixels: mergedPixels });
    removeLayer(spriteId, layerId);
  };

  const handleMergeUp = (layerId: string) => {
    const layerIndex = sprite!.layers.findIndex(l => l.id === layerId);
    if (layerIndex === sprite!.layers.length - 1) return;

    const currentLayer = sprite!.layers[layerIndex];
    const aboveLayer = sprite!.layers[layerIndex + 1];

    const mergedPixels = new Map(currentLayer.pixels);
    aboveLayer.pixels.forEach((color, key) => {
      mergedPixels.set(key, color);
    });

    updateLayer(spriteId, currentLayer.id, { pixels: mergedPixels });
    removeLayer(spriteId, aboveLayer.id);
  };

  return (
    <div className="layer-panel" style={style}>
      <div className="layer-panel-header">
        <span className="panel-title">Layers</span>
        <button className="icon-button" onClick={handleAddLayer} title="Add Layer">
          <FiPlus size={18} />
        </button>
      </div>

      <div className="layer-list">
        {[...sprite.layers].reverse().map((layer) => {
          const isActive = layer.id === sprite.activeLayerId;
          
          return (
            <div
              key={layer.id}
              className={`layer-item ${isActive ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, layer.id)}
              onClick={() => setActiveLayer(spriteId, layer.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ layerId: layer.id, x: e.clientX, y: e.clientY });
              }}
            >
              <div className="layer-main-row">
                <div className="layer-controls">
                  <button
                    className={`layer-icon-button ${layer.visible ? '' : 'disabled'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(layer.id);
                    }}
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                  </button>
                  <button
                    className={`layer-icon-button ${layer.locked ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLock(layer.id);
                    }}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? <FiLock size={14} /> : <FiUnlock size={14} />}
                  </button>
                </div>

                <input
                  type="text"
                  className="layer-name"
                  value={layer.name}
                  disabled
                  onClick={(e) => e.stopPropagation()}
                />

                <button
                  className="layer-more-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setContextMenu({ layerId: layer.id, x: e.clientX, y: e.clientY });
                  }}
                  title="More Options"
                >
                  <FiMoreVertical size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: 'Properties',
              onClick: () => {
                const layer = sprite!.layers.find((l) => l.id === contextMenu.layerId);
                if (layer) {
                  setPropertiesDialog({ layerId: layer.id, name: layer.name, opacity: layer.opacity });
                }
                setContextMenu(null);
              },
            },
            {
              label: 'Merge Down',
              onClick: () => handleMergeDown(contextMenu.layerId),
              disabled: sprite!.layers.findIndex((l) => l.id === contextMenu.layerId) === 0,
            },
            {
              label: 'Merge Up',
              onClick: () => handleMergeUp(contextMenu.layerId),
              disabled: sprite!.layers.findIndex((l) => l.id === contextMenu.layerId) === sprite!.layers.length - 1,
            },
            {
              label: 'Lock',
              onClick: () => {
                const layer = sprite!.layers.find((l) => l.id === contextMenu.layerId);
                if (layer && !layer.locked) {
                  handleToggleLock(contextMenu.layerId);
                }
              },
              disabled: sprite!.layers.find((l) => l.id === contextMenu.layerId)?.locked,
            },
            {
              label: 'Unlock',
              onClick: () => {
                const layer = sprite!.layers.find((l) => l.id === contextMenu.layerId);
                if (layer && layer.locked) {
                  handleToggleLock(contextMenu.layerId);
                }
              },
              disabled: !sprite!.layers.find((l) => l.id === contextMenu.layerId)?.locked,
            },
            {
              label: 'Delete',
              onClick: () => handleDeleteLayer(contextMenu.layerId),
              disabled: sprite!.layers.length <= 1,
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {propertiesDialog && (
        <LayerPropertiesDialog
          layerName={propertiesDialog.name}
          layerOpacity={propertiesDialog.opacity}
          onConfirm={handlePropertiesConfirm}
          onCancel={() => setPropertiesDialog(null)}
        />
      )}
    </div>
  );
}

export default LayerPanel;
