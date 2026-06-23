# Docker Compose Setup Guide

## Quick Start

```bash
docker compose up --build
```

Access services:
- Desktop: http://localhost:3000
- Mobile: http://localhost:3001
- API: http://localhost:8080
- MQTT: localhost:1883 (MQTT), localhost:9001 (WebSocket)

## Services

### spring-app (API Backend)
- **Port**: 8080
- **Language**: Java 21
- **Framework**: Spring Boot 3.2
- **Database**: H2 (in-memory)
- **Docs**: See `api/API_GATEWAYS.md`

### desktop-app (Web App)
- **Port**: 3000
- **Tech**: React + Vite + Tailwind CSS
- **Build**: Node.js 20 Alpine

### mobile-app (Web App)
- **Port**: 3001
- **Tech**: React + Vite + TypeScript
- **Build**: Node.js 20 Alpine

### mqtt5 (Message Broker)
- **Port**: 1883 (MQTT), 9001 (WebSocket)
- **Image**: eclipse-mosquitto
- **Persistence**: Enabled

## Common Commands

### Using Make (Recommended)
```bash
make help           # Show all commands
make build          # Build all images
make up             # Start services
make up-d           # Start in background
make down           # Stop services
make restart        # Restart all services
make logs           # View all logs
make logs-api       # View API logs only
make clean          # Full cleanup with volumes
```

### Using Docker Compose Directly
```bash
docker compose up --build                # Start with build
docker compose up -d                     # Start in background
docker compose down                      # Stop services
docker compose logs -f                   # View logs
docker compose logs -f spring-app        # View API logs
docker compose ps                        # List containers
docker compose restart                   # Restart services
docker compose down -v                   # Stop and remove volumes
```

## Environment Configuration

Create a `.env` file from the template:
```bash
cp .env.example .env
```

Edit `.env` to customize ports and settings.

## Network Architecture

All services run on `pcmr-network` bridge:
- Services can reach each other by container name
- Frontend apps proxy API requests through Nginx
- MQTT accessible to all services

```
Desktop (3000) ──┐
                 ├─→ API (8080) ─→ MQTT (1883)
Mobile (3001) ───┤
```

## Troubleshooting

### Port Already in Use
Edit `docker-compose.yml` and change ports:
```yaml
desktop-app:
  ports:
    - "3002:80"  # Changed from 3000:80
```

### Build Fails
Check logs for specific service:
```bash
docker compose logs spring-app
docker compose logs desktop-app
```

### Out of Disk Space
Clean up Docker resources:
```bash
docker system prune -a --volumes
```

### Services Can't Communicate
Verify services are running:
```bash
docker compose ps
```

## Development Workflow

1. **Make code changes** in your editor
2. **Rebuild affected service**:
   ```bash
   docker compose up --build spring-app   # For API changes
   docker compose up --build desktop-app  # For Desktop changes
   ```
3. **View logs** to verify:
   ```bash
   docker compose logs -f
   ```

## Production Considerations

- Use environment-specific `.env` files
- Replace H2 database with PostgreSQL/MySQL
- Set up SSL/TLS certificates
- Configure MQTT authentication
- Use container registry for images
- Implement centralized logging
- Set resource limits for containers

## Verify Setup

Check if everything is ready:
```bash
./verify_docker_setup.sh
```

## File Structure

```
docker-compose.yml       # Main service orchestration
api/Dockerfile          # Java API build
desktop-app/Dockerfile  # Frontend build
mobile-app/Dockerfile   # Mobile build
Makefile               # Convenient commands
.env.example           # Environment template
```

---

For API endpoint documentation, see **[api/API_GATEWAYS.md](./api/API_GATEWAYS.md)**

