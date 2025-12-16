# Corporater ClickPath

Interactive guided tours for Corporater GRC applications. Think Supademo or Storylane, but fully integrated with Corporater.

## Features

- **Guided Tours**: Step-by-step walkthroughs with spotlight highlighting
- **Configurable Colors**: Theme colors can be set per client or pulled from Corporater
- **Corporater Integration**: Store tours and progress as Corporater objects
- **Cross-Environment Sync**: Tours work across any Corporater environment
- **Auto-start Tours**: Tours can start automatically on first visit
- **Installation Prompt**: CVO script to prompt users to install the extension

## Installation

### Development

```bash
# Install dependencies
npm install

# Build in watch mode
npm run dev

# Load extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

### Production

```bash
# Build for production
npm run build

# Package as .zip for Chrome Web Store
npm run package
```

## Corporater Setup

### 1. Run the Setup Script

Execute `corporater/setup-clickpath.ext` in Corporater to create:
- Choice lists for status values
- Configuration object with theme colors
- Example tour object

### 2. Configure Theme Colors

Edit the `ClickPath_Config` object in Corporater:
- `CP_PrimaryColor`: Main brand color (default: `#0066B3`)
- `CP_PrimaryDark`: Darker shade for hover states
- `CP_PrimaryLight`: Light background color
- `CP_BackgroundColor`: Tooltip background
- `CP_TextColor`: Main text color

### 3. Add Installation Prompt (Optional)

Embed `corporater/install-prompt.js` in a CustomVisualization object to show an install banner for users who don't have the extension.

## Creating Tours

### Store in Corporater

Create tour objects with ID prefix `CPT_`:

```extended
root.ce.add(ceRootObject,
    id := 'CPT_RiskTour',
    name := 'Risk Management Tour',
    CP_TourId := 'risk-tour',
    CP_Version := '1.0.0',
    CP_Status := t.CP_Status_Active,
    CP_TourDefinition := '{...tour JSON...}'
)
```

### Tour JSON Format

```json
{
  "id": "risk-tour",
  "version": "1.0.0",
  "name": "Risk Management Overview",
  "trigger": {
    "mode": "auto",
    "autoConditions": {
      "firstVisit": true,
      "userRole": ["Risk Manager"]
    }
  },
  "pages": [
    {
      "urlPattern": "/risk",
      "urlMatchMode": "contains",
      "steps": [
        {
          "id": "welcome",
          "title": "Welcome",
          "content": "Let's explore the risk module.",
          "highlightStyle": "none"
        },
        {
          "id": "risk-table",
          "element": ".risk-table",
          "title": "Risk Register",
          "content": "View all your risks here.",
          "position": "bottom"
        }
      ]
    }
  ],
  "settings": {
    "allowSkip": true,
    "showProgress": true,
    "overlayOpacity": 0.75,
    "theme": "corporater"
  }
}
```

### Step Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique step identifier |
| `element` | string | CSS selector for target element |
| `elementFallback` | string[] | Alternative selectors |
| `title` | string | Step title |
| `content` | string | Step description (HTML supported) |
| `position` | string | auto, top, bottom, left, right |
| `highlightStyle` | string | spotlight, outline, pulse, none |
| `interaction.clickThrough` | boolean | Allow clicking highlighted element |

## Project Structure

```
clickpath/
├── public/
│   ├── manifest.json       # Chrome extension manifest
│   ├── popup.html          # Extension popup
│   └── icons/              # Extension icons
├── src/
│   ├── background/
│   │   ├── service-worker.ts   # Background worker
│   │   └── api-client.ts       # Corporater API client
│   ├── content/
│   │   ├── content-script.ts   # Page injection
│   │   └── tour-engine.ts      # Tour rendering
│   ├── popup/
│   │   └── popup.ts            # Popup UI
│   ├── shared/
│   │   ├── types.ts            # TypeScript types
│   │   ├── theme.ts            # Theme system
│   │   └── config.ts           # Configuration
│   └── styles/
│       └── tour-overlay.css    # Tour UI styles
├── corporater/
│   ├── setup-clickpath.ext     # Corporater setup script
│   └── install-prompt.js       # CVO install prompt
├── tours/
│   └── example-tour.json       # Example tour
└── dist/                       # Build output
```

## API Integration

The extension connects to Corporater via the Extended API:

```typescript
// Configure in extension options
{
  apiUrl: 'http://localhost:3200',  // Extended API endpoint
  serverUrl: 'https://your-instance.corporater.dev/CorpoWebserver',
  username: 'user',
  password: 'pass'
}
```

Tours are synced every 5 minutes and cached locally for offline use.

## Keyboard Shortcuts

- `Ctrl+Shift+T` (Windows/Linux) / `Cmd+Shift+T` (Mac): Start/toggle tour

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium-based)

## Future Enhancements

- [ ] Visual tour editor
- [ ] Multi-page tours with navigation detection
- [ ] Rich content (markdown, images, videos)
- [ ] Branching paths and conditional steps
- [ ] Analytics dashboard
- [ ] Firefox support
