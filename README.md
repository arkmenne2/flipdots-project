# 84x28 Raycaster Gallery

A modular raycaster engine built with vanilla JavaScript, featuring interactive gallery paintings and a clean, maintainable architecture.

## 🚀 Features

- **84x28 raycaster engine** with smooth wall rendering
- **6 interactive gallery paintings** that open URLs when viewed closely
- **Collision detection** with smooth player movement
- **Development minimap** showing player position and paintings
- **Three.js hardware acceleration** with 2D canvas fallback
- **Modular architecture** for easy maintenance and extension

## 📁 Project Structure

```
├── index.html          # Main HTML file with game loop
├── js/
│   ├── config.js       # Configuration constants
│   ├── world.js        # Map data and collision detection
│   ├── player.js       # Player state and input handling
│   ├── gallery.js      # Gallery painting interactions
│   └── engine.js       # Raycasting and rendering engine
└── README.md          # This file
```

## 🎮 Controls

- **WASD** or **Arrow Keys** - Move forward/backward, strafe left/right
- **Q/E** or **Left/Right Arrows** - Turn left/right
- **F** - Interact with floor items
- **Gallery Paintings** - Walk close and look directly at them to trigger

## 🛠️ Architecture

### Modular Design

The codebase is split into logical modules:

- **`config.js`** - All game constants and configuration values
- **`world.js`** - Map data, collision detection, and wall geometry
- **`player.js`** - Player state, movement, and input handling
- **`gallery.js`** - Interactive painting system
- **`engine.js`** - Core raycasting and rendering engine

### Key Components

1. **Raycasting Engine** - DDA algorithm for fast wall detection
2. **Performance Buffers** - Typed arrays for smooth rendering
3. **Angle Caching** - Optimized trigonometry calculations
4. **Wall Smoothing** - Multi-pass smoothing for cleaner edges
5. **Depth Smoothing** - Temporal smoothing for visual stability

## ⚡ Performance Features

- **Pre-computed geometry** - Wall corners calculated at startup
- **Cached trigonometry** - Sine/cosine values cached per frame
- **Optimized ray casting** - Efficient DDA stepping algorithm
- **Buffer reuse** - Typed arrays for performance-critical data
- **Smart invalidation** - Only recalculate when needed

## 🎨 Customization

### Adding Gallery Paintings

Edit `js/gallery.js` to add new paintings:

```javascript
export const galleryFrames = [
  { x: 11, y: 6, url: 'https://your-url.com' }, // Right wall
  // Add more paintings here
];
```

### Modifying the Map

Edit the map array in `js/world.js`:

```javascript
export const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,2,0,1],
  // Modify map layout here
  // 0 = walkable, 1 = wall, 2 = item1, 3 = item2
];
```

### Adjusting Game Settings

Modify constants in `js/config.js`:

```javascript
export const MOVE_SPEED = 2.2 / 15;        // Movement speed
export const TRIGGER_DISTANCE = 1.0;       // Painting trigger distance
export const FOV = Math.PI / 3;            // Field of view (60°)
```

## 🔧 Development

### Running Locally

1. Start a local HTTP server (required for ES6 modules):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

2. Open `http://localhost:8000` in your browser

### Browser Compatibility

- **Modern browsers** with ES6 module support
- **Three.js** for hardware acceleration (optional)
- **Canvas 2D** fallback for older browsers

## 📊 Technical Details

- **Resolution**: 84x28 pixels (scaled up for display)
- **Target FPS**: 15 (for consistent retro feel)
- **Ray casting**: DDA algorithm with 0.05 step size
- **Rendering**: Offscreen buffer with post-processing
- **Input**: Event-driven with anti-stuck mechanisms

## 🎯 Future Enhancements

- [ ] Texture mapping for walls
- [ ] Animated sprites
- [ ] Sound effects
- [ ] Multiple levels
- [ ] Save/load system
- [ ] Mobile touch controls

## 📄 License

Open source - feel free to modify and extend!

---


