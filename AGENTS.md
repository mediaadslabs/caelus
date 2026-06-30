# Caelus - Development Guide

## Build Commands
- `npm run build` - Full build (main + preload + renderer)
- `npm run build:main` - Build main process TypeScript
- `npm run build:preload` - Build preload script 
- `npm run build:renderer` - Build renderer with Vite
- `npm run dev` - Start dev mode (renderer hot-reload + electron)
- `npm run start` - Build and launch
- `npm run typecheck` - TypeScript type checking only

## Project Structure
- `src/main/` - Electron main process
- `src/preload/` - Preload scripts (context bridge)
- `src/renderer/` - React UI
- `src/shared/` - Shared types and constants
- `src/bangs/` - !Bangs JSON data
- `dist/` - Build output
- `resources/` - Icons and assets

## Architecture Notes
- Uses `<webview>` tags for tab content rendering
- IPC channels defined in `src/shared/ipc-channels.ts`
- Layout modes: classic, compact, vertical (via LayoutContext)
- Ad blocking via pattern matching in main process
- Session saved to `app.getPath('userData')/session.json`
- Database (settings, agents, extensions) saved to `app.getPath('userData')/database.json`
- Chrome extensions loaded via `session.loadExtension()` in main process
- AI agents use Ollama API (`/api/chat` and `/api/tags` endpoints)

## Features
- **Chrome Extensions**: Load/unload in Settings > Extensions
- **AI Agents**: Configure agents with system prompts, models, temperature in Settings > AI & Agents
- **Agent Panel**: Click the ◆ button in toolbar to open the AI chat panel
- **Ollama**: Configurable endpoint, fetch models button, per-agent model selection
- **Database**: All settings, agents, and extension config persisted to database.json

## Conventions
- TypeScript strict mode
- React with hooks (no class components)
- CSS custom properties for theming (defined in global.css)
- Inline styles with React.CSSProperties (no CSS-in-JS library)
