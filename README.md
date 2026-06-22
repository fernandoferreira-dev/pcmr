# PCMR - PCM Research Platform

A multi-service platform for PCM (Phase Change Material) research with Desktop & Mobile web apps, REST API backend, and MQTT broker for IoT communication.

## 📦 Services

| Service | Tech Stack | Port |
|---------|-----------|------|
| **API** | Java 21, Spring Boot, H2 DB | 8080 |
| **Desktop App** | React, Vite, Tailwind CSS | 3000 |
| **Mobile App** | React, Vite, TypeScript | 3001 |
| **MQTT Broker** | Eclipse Mosquitto | 1883, 9001 |

## 🚀 Quick Start

```bash
docker compose up --build
```

Then access:
- Desktop: http://localhost:3000
- Mobile: http://localhost:3001
- API: http://localhost:8080

## 📚 Documentation

- **[DOCKER.md](./DOCKER.md)** - Docker Compose setup and commands
- **[API_GATEWAYS.md](./api/API_GATEWAYS.md)** - API endpoints and usage

## 🔧 Development

Use convenient Make commands:

```bash
make help       # Show all commands
make up         # Start services
make down       # Stop services
make logs       # View logs
make clean      # Full cleanup
```

See `DOCKER.md` for detailed setup instructions.

## 📝 Project Structure

```
pcmr/
├── api/                    # Spring Boot REST API
├── desktop-app/            # React web app for desktop
├── mobile-app/             # React web app for mobile
├── mqtt5/                  # MQTT broker configuration
├── docker-compose.yml      # Service orchestration
├── Makefile               # Convenient commands
└── DOCKER.md              # Docker setup guide
```

## ⚡ Features

- ✅ Multi-service Docker setup
- ✅ REST API with authentication
- ✅ MQTT message broker for IoT
- ✅ Responsive web frontends
- ✅ Automatic service restart
- ✅ Health checks configured

---

For detailed Docker setup, see **[DOCKER.md](./DOCKER.md)**
