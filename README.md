# Corporater ClickPath

Interactive guided tours for Corporater GRC applications. Think Supademo or Storylane, but fully integrated with Corporater.

## Quick Install

### Option 1: Download Release
1. Download `clickpath-extension.zip` from [Releases](https://github.com/sebegerritsen/clickpath/releases)
2. Extract the zip file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the extracted `dist` folder
7. Done! The extension icon appears in your toolbar

### Option 2: Clone & Build
```bash
git clone https://github.com/sebegerritsen/clickpath.git
cd clickpath
npm install
npm run build
```
Then load the `dist` folder in Chrome as described above.

## Features

- **Guided Tours**: Step-by-step walkthroughs with spotlight highlighting
- **Corporater Integration**: Tours and colors loaded from Corporater API
- **Session-Based Auth**: Uses your existing Corporater login (no extra credentials)
- **Auto-start Tours**: Tours can start automatically on first visit
- **Customizable Theme**: Colors pulled from Corporater configuration

## How It Works

The extension automatically:
1. Detects when you're on a Corporater page
2. Fetches tour definitions from `/api/clickpath/v1`
3. Applies theme colors from your Corporater configuration
4. Shows available tours via the help button (?) or keyboard shortcut

No configuration needed - just install and go!

## Corporater Setup

### API Endpoint

The extension calls `GET /CorpoWebserver/api/clickpath/v1` which returns:
- Theme colors (primary, background, text, etc.)
- Configuration (enableAutoStart, enableHelpButton)
- Tour definitions (JSON)

### Storing Tours

Tours are stored in Corporater list items under `t.84780`:
- `name`: Tour ID (e.g., "welcome-tour")
- `description`: Tour JSON definition

Example tour JSON:
```json
{
  "id": "welcome-tour",
  "version": "1.0.0",
  "name": "Welcome to Corporater",
  "trigger": {
    "mode": "auto",
    "autoConditions": { "firstVisit": true }
  },
  "pages": [{
    "urlPattern": "corporater",
    "urlMatchMode": "contains",
    "steps": [{
      "id": "welcome",
      "title": "Welcome!",
      "content": "Let's take a quick tour.",
      "highlightStyle": "none"
    }]
  }],
  "settings": {
    "allowSkip": true,
    "showProgress": true,
    "overlayOpacity": 0.75
  }
}
```

### Install Widget

Add the ClickPath install widget to any Corporater page to help users discover and install the extension. See `corporater/clickpath-install-widget.html`.

## Development

```bash
# Install dependencies
npm install

# Build (one-time)
npm run build

# Build in watch mode (rebuilds on changes)
npm run dev
```

After building, reload the extension in `chrome://extensions/` to see changes.

## Keyboard Shortcuts

- `Ctrl+Shift+T` (Windows/Linux) / `Cmd+Shift+T` (Mac): Start tour

## Project Structure

```
clickpath/
├── src/
│   ├── background/         # Service worker
│   ├── content/            # Content script & tour engine
│   ├── popup/              # Extension popup
│   ├── shared/             # Types & config
│   └── styles/             # Tour overlay CSS
├── corporater/             # Corporater scripts & widgets
├── public/                 # Static assets & manifest
├── tours/                  # Example tour definitions
└── dist/                   # Built extension (load this in Chrome)
```

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium-based)

## License

MIT
