    # PCMR API

Spring Boot REST API backend for the PCMR platform.

## Quick Start

### Local Development
```bash
cd api
./mvnw spring-boot:run
```

### Docker
```bash
docker compose up spring-app
```

Access at: http://localhost:8080

## Documentation

- **[API_GATEWAYS.md](./API_GATEWAYS.md)** - Complete API endpoint documentation

## Key Features

- User authentication (register/login)
- REST endpoints for user management
- MQTT integration for IoT messaging
- H2 in-memory database
- Spring Boot 3.2
- Java 21

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 21
- **Build**: Maven
- **Database**: H2 (in-memory)
- **Server**: Embedded Tomcat

## Project Structure

```
src/main/
├── java/com/pcmr/api/
│   ├── ApiApplication.java      # Main entry point
│   ├── controller/              # REST endpoints
│   │   ├── LoginController.java
│   │   └── UserController.java
│   ├── model/                   # Data models
│   │   └── LoginModel.java
│   ├── repository/              # Data access
│   │   └── UserRepository.java
│   ├── service/                 # Business logic
│   └── exception/               # Exception handling
└── resources/
    └── application.properties    # Configuration
```

## Environment Variables

See `.env.example` in the project root.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users
- `POST /api/users/register` - User registration

See [API_GATEWAYS.md](./API_GATEWAYS.md) for detailed endpoint documentation.

## Health Check

```bash
curl http://localhost:8080/actuator/health
```

## Development

### Build
```bash
./mvnw clean package
```

### Run Tests
```bash
./mvnw test
```

### Run Locally
```bash
./mvnw spring-boot:run
```

## Building Docker Image

The API is built automatically with Docker Compose. To build manually:

```bash
docker build -t pcmr-api:latest .
docker run -p 8080:8080 pcmr-api:latest
```

## Database

Currently uses H2 in-memory database. Data persists only during the session.

For production, replace with:
- PostgreSQL
- MySQL
- MongoDB

Update `pom.xml` and `application.properties` accordingly.

## MQTT Integration

The API can publish/subscribe to MQTT topics via the broker at `mqtt5:1883`.

Example topics:
- `sensors/+/data` - Sensor data
- `alerts/+/critical` - Critical alerts
- `status/device/+` - Device status

## Future Enhancements

- JWT authentication
- Request validation with Bean Validation
- API documentation with Swagger/OpenAPI
- WebSocket support for real-time updates
- Rate limiting
- Caching layer

## Support

For issues:
1. Check logs: `docker compose logs -f spring-app`
2. Verify service: `docker compose ps`
3. Check health: `curl http://localhost:8080/actuator/health`

See [../DOCKER.md](../DOCKER.md) for Docker troubleshooting.

