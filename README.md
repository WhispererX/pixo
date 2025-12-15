# Pixo - Pixel Art Editor

A powerful, feature-rich pixel art editor built with Electron and React, inspired by Aseprite's design and functionality.

## Features

### Core Features
- **Tab-Based Interface**: Work on multiple sprites simultaneously with a clean tab-based UI, just like Aseprite
- **Home View**: Create new sprites, open existing files, and access recent files
- **Full Sprite Management**: Support for transparent, white, and black backgrounds

### Drawing Tools
- **Brush**: Paint with customizable brush sizes
- **Eraser**: Remove pixels from the current layer
- **Color Picker**: Sample colors directly from your artwork
- **Bucket Fill**: Fill contiguous areas with a single color
- **Line Tool**: Draw straight lines
- **Shape Tools**: Create rectangles and circles with outline and fill options
- **Move Tool**: Pan across the canvas
- **Zoom Tool**: Zoom in and out (1x to 32x)

### Layers & Colors
- **Advanced Layer Panel**: 
  - Add and delete layers (minimum 1 layer required)
  - Toggle layer visibility
  - Lock/unlock layers to prevent accidental edits
  - Adjust layer opacity (0-100%)
  - Rename layers
  - Full layer reordering support

- **Color Management**:
  - RGB color picker with sliders
  - Hex color input
  - Native color picker
  - Customizable color palette
  - Add colors to palette from the picker
  - Support for primary and secondary colors with instant swap

### Preview & Grid
- **Preview Panel**: Real-time preview of your sprite at actual size with transparency support
- **Grid Display**: Toggle grid visibility with zoom level-aware rendering
- **Checkerboard Background**: Visual indication of transparent areas

### File Management
- **Save/Load**: Save and load sprites in .pixo format
- **PNG Export**: Export your artwork as PNG files
- **Recent Files**: Quick access to recently opened files
- **Electron File Dialog**: Native file browser integration

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pixo.git
cd pixo
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run electron:dev
```

This command:
1. Compiles TypeScript for Electron
2. Starts the React dev server
3. Launches the Electron application with hot reload

### Building

Build the application for production:
```bash
npm run build
```

Compile Electron files only:
```bash
npm run electron:compile
```

Build the Electron app with electron-builder:
```bash
npm run electron:build
```

## Project Structure

```
pixo/
├── electron/                 # Electron main process
│   ├── main.ts              # Main Electron window setup
│   ├── preload.ts           # IPC bridge
│   └── tsconfig.json        # TypeScript config for Electron
├── src/                     # React application
│   ├── components/          # React components
│   │   ├── App.tsx          # Main app component
│   │   ├── TabBar.tsx       # Tab management
│   │   ├── HomeView.tsx     # Home/welcome screen
│   │   ├── SpriteEditor.tsx # Main editor layout
│   │   ├── Canvas.tsx       # Drawing canvas
│   │   ├── Toolbar.tsx      # Tool selection
│   │   ├── LayerPanel.tsx   # Layer management
│   │   ├── ColorPanel.tsx   # Color picker
│   │   ├── ColorPalette.tsx # Palette display
│   │   └── PreviewPanel.tsx # Live preview
│   ├── store/
│   │   └── appStore.ts      # Zustand state management
│   ├── types/
│   │   ├── index.ts         # Type definitions
│   │   └── electron.d.ts    # Electron API types
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── dist/                    # Built React app
├── dist-electron/           # Compiled Electron files
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript config
└── vite.config.ts          # Vite configuration
```

## Technology Stack

- **Framework**: Electron + React 18
- **Language**: TypeScript
- **State Management**: Zustand
- **Build Tool**: Vite
- **Styling**: CSS3

## Keyboard Shortcuts

| Key | Tool |
|-----|------|
| B | Brush |
| E | Eraser |
| I | Color Picker |
| G | Bucket Fill |
| H | Move |
| Z | Zoom |
| L | Line |
| R | Rectangle |
| C | Circle |
| O | Ellipse |
| T | Text (placeholder) |

## Features in Detail

### Drawing Experience
- Smooth pixel-perfect drawing with customizable brush sizes
- Real-time canvas rendering with pixel-perfect grid
- Undo/Redo support through browser history (expandable feature)
- Multi-layered composition with per-layer opacity

### Layer System
- Unlimited layers with named organization
- Layer visibility toggling
- Layer locking to prevent accidental modifications
- Opacity control for blending
- Layer-aware drawing operations

### Color Tools
- Intuitive color picker with RGB sliders and hex input
- Built-in color palette with presets
- Quick color swapping (primary/secondary)
- Sample colors directly from canvas with picker tool
- Palette customization

### File Formats

**.pixo Format** (JSON-based):
```json
{
  "id": "sprite-id",
  "name": "My Sprite",
  "width": 32,
  "height": 32,
  "backgroundColor": "#FFFFFF",
  "layers": [
    {
      "id": "layer-id",
      "name": "Layer 1",
      "visible": true,
      "opacity": 100,
      "pixels": {
        "0,0": "#FF0000"
      },
      "locked": false
    }
  ]
}
```

## Performance Considerations

- Canvas rendering optimized for pixel-perfect display
- Layer-based rendering for efficient updates
- Zoom levels 1x-32x for detailed work and overview
- Checkerboard rendering for transparency visualization

## Future Enhancements

- [ ] Undo/Redo system
- [ ] Animation/Frame support
- [ ] Selection tools (rectangle, lasso)
- [ ] Transform tools (scale, rotate, flip)
- [ ] Blend modes for layers
- [ ] Text tool implementation
- [ ] Pattern/stamp tools
- [ ] Dockable/resizable panels (like Aseprite)
- [ ] Keyboard shortcuts customization
- [ ] Dark/Light theme toggle
- [ ] Onion skin for animation
- [ ] Gradient tool

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

MIT License - feel free to use this project for personal and commercial purposes.

## Acknowledgments

Inspired by the excellent pixel art editor [Aseprite](https://www.aseprite.org/).