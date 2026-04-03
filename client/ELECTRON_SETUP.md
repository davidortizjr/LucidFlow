# LucidFlow - Electron Setup

Your app is now configured to run as a desktop application using Electron! Here's how to use it:

## Installation

First, install the new dependencies:

```bash
cd client
npm install
```

This will install Electron, electron-builder, and other required packages.

## Development

To run your app in development mode with hot-reloading:

```bash
npm run dev:electron
```

This will:
1. Start the Vite dev server on `http://localhost:5173`
2. Wait for it to be ready
3. Launch Electron and connect to it

The app will open with dev tools enabled, and you'll be able to see hot updates as you make changes to your code.

## Building for Production

To build your app as a desktop application:

```bash
npm run build:electron
```

This will:
1. Build the React app with Vite
2. Build the Electron app using electron-builder
3. Create installers for Windows, macOS, and Linux in the `dist` folder

### Build outputs:
- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` installer and `.zip` archive
- **Linux**: `.AppImage` and `.deb` package

## File Structure

- `electron/main.js` - Main Electron process
- `electron/preload.js` - Security preload script
- `electron-builder.json` - Build configuration
- `src/` - Your React app code
- `dist/` - Built app (created after `npm run build`)

## Keyboard Shortcuts

In development mode:
- **F12** - Toggle DevTools
- **Ctrl+R** / **Cmd+R** - Reload app
- **Ctrl+Shift+R** / **Cmd+Shift+R** - Force reload
- **Ctrl+Q** / **Cmd+Q** - Quit app

## Troubleshooting

### Port 5173 already in use?
Change the port in `vite.config.ts` or kill the process using that port.

### Electron won't start?
Make sure your dev server is running first, then check the console for errors.

### Build not working?
Try cleaning and rebuilding:
```bash
rm -rf dist
npm run build:electron
```

You can now distribute your app as a proper desktop application!
