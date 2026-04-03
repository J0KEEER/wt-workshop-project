# Architecture & Patterns

## Overview
The project follows a decoupled **Client-Server Architecture** with a React frontend and an Express backend. Communication happens over HTTP/REST and WebSockets (Socket.io).

## Backend (Server)
- **Pattern**: Layered (Controller-Model-Repository pattern implied by Sequelize).
- **Data Access**: Sequelize ORM interacting with a local SQLite database (`database.sqlite`).
- **Communication**: REST API for CRUD; Socket.io for live updates.
- **Middleware**: Authentication (JWT), Error handling, Request validation.

## Frontend (Client)
- **Pattern**: Component-based architecture with React.
- **Routing**: Client-side routing via React Router.
- **API Layers**: Axios-based service modules for backend communication.
- **Real-time**: WebSocket integration for dashboard metrics/live info.

## Data Flow
1. User interacts with React Components.
2. Components call Axios services.
3. Services hit Express API endpoints.
4. Express controllers use Sequelize models to query SQLite.
5. Live updates are pushed back via Socket.io.
