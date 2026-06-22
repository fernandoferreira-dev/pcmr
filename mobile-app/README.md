# Mobile Application
React-based web application for mobile users with responsive design.
## Development
```bash
npm install
npm run dev
```
## Building
```bash
npm run build
```
Output goes to `dist/` directory.
## Features
- React 19 with TypeScript
- Vite for fast development
- Responsive design for mobile
- API integration with backend
## Docker
Built automatically by Docker Compose on port 3001.
```bash
docker compose up --build mobile-app
```
Access at: http://localhost:3001
## API Integration
The app connects to the backend API at `http://spring-app:8080` (inside Docker) or `http://localhost:8080` (local development).
See `../api/API_GATEWAYS.md` for API documentation.
