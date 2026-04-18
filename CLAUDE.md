# Avatar RPG — Claude Code Context

## Project Overview
Web-based RPG character management system inspired by Avatar: The Last Airbender. Single-player focused with simple authentication (character name), skill trees, and JSON import/export.

## Current State
- **Prototype files:** `index.html`, `patch.js.txt` (monolithic HTML/JS)
- **Game data:** `Initial Files/*.json` (skill definitions for Fire, Water, Earth, Air, No-Bending)
- **Target:** Split into modern frontend/backend architecture

## Tech Stack
- **Frontend:** HTML5 + CSS3 + JavaScript (ES6+) — sem frameworks, interface clean baseada no `avatar_rpg_v6.html`
- **Backend:** Netlify Functions (serverless) + Supabase (PostgreSQL + Auth)

## Key Game Mechanics
- **Attributes:** FOR, AGI, CHI, PER, RES, ESP
- **Max level:** 40, 3 points per level
- **Elements:** Fire, Water, Earth, Air, No-Bending
- **Skill tiers:** 1-4 (Beginner → Legendary)
- **Derived stats:** Health, Chi Max, Spirit Max, Defense, Dodge

## Development Priorities
1. MVP: Character sheet, skill tree viewer, auto-save, JSON import/export
2. Import system: Validate/generate skill JSON via AI prompts
3. GM tools: Encounter builder, combat simulator (future)

## Working Style
- Iterative development over perfect architecture
- Auto-save is critical (2s debounce)
- Content import must be plug-and-play
- Portuguese (PT-BR) preferred for user-facing text
