# Directory Structure

## Root
- `client/` - Frontend React application.
- `server/` - Backend Express application.
- `mcp.json` - MCP server configuration.
- `skills-lock.json` - Agent skills lock file.

## Client
- `src/` - React source code.
- `dist/` - Production build output.
- `public/` - Static assets.
- `vite.config.js` - Vite configuration.
- `jest.config.cjs` - Jest testing configuration.

## Server
- `src/` - Express source code.
  - `models/` - Sequelize database models.
  - `index.js` - Server entry point.
  - `seed.js` - Database seed script.
- `database.sqlite` - SQLite database file.
- `.env` - Environment variables.
