# Loupe Project

A Notion-style rich-text editor with AI fact-checking using Plate.js and FastAPI.

## Features

- Rich-text editing with Plate.js
- AI-powered fact-checking on selected text
- Page management (create, edit, delete, share)
- Dark mode toggle
- Drag-and-drop block reordering
- Public page sharing

## Technologies

- Frontend: React + TypeScript + Plate.js
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL
- AI: Google Gemini API

## Setup

1. Clone the repository
2. Ensure Docker and Docker Compose are installed
3. Copy `.env` in backend and set your GEMINI_API_KEY
4. Run `docker-compose up --build`

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Database: localhost:5433

## Usage

- Create and edit pages with rich text formatting
- Select text and use the AI fact-check option from the toolbar
- Share pages publicly with unique URLs
- Toggle dark mode in the UI