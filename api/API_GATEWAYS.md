# API Gateways & Endpoints

## Base URL

```
http://localhost:8080
```

All API endpoints are prefixed with `/api`

## Authentication Endpoints

### POST `/api/auth/login`

Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:** (200 OK)
```json
"Login successful"
```

**Error Responses:**
- `401 Unauthorized`: Invalid password
- `404 Not Found`: User not found

**Example:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

---

## User Endpoints

### POST `/api/users/register`

Register a new user.

**Request Parameters:**
- `name` (string, required): User's full name
- `email` (string, required): User's email address
- `password` (string, required): User's password

**Success Response:** (200 OK)
```
User Saved successfully!
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/users/register?name=John%20Doe&email=john@example.com&password=pass123"
```

---

## MQTT Broker Connection

The API communicates with MQTT for IoT messaging.

**MQTT Details:**
- Host: `mqtt5` (internal) or `localhost` (external)
- Port: `1883` (MQTT protocol)
- Port: `9001` (WebSocket)
- Anonymous access enabled in development

**Example MQTT Connection (JavaScript):**
```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('ws://localhost:9001');

client.on('connect', () => {
  console.log('Connected to MQTT');
  client.subscribe('sensors/+/data');
});

client.on('message', (topic, message) => {
  console.log(`${topic}: ${message.toString()}`);
});
```

**Example MQTT Connection (Python):**
```python
import paho.mqtt.client as mqtt

def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe("sensors/+/data")

def on_message(client, userdata, msg):
    print(msg.topic + " " + str(msg.payload))

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect("localhost", 1883, 60)
client.loop_forever()
```

---

## Database

The API uses H2 in-memory database. Data is stored during the session but not persisted across container restarts.

### User Model

Users are stored with the following fields:
- `id` (Long): Primary key
- `name` (String): User's full name
- `email` (String): User's email (unique)
- `password` (String): User's password (plain text in dev, should be hashed in production)

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## CORS Configuration

The API allows requests from:
- `http://localhost:3000` (Desktop App)
- `http://localhost:3001` (Mobile App)
- `http://localhost:8080` (API itself)

---

## Health Check

**Endpoint:** `GET /actuator/health`

**Response:** (200 OK)
```json
{
  "status": "UP"
}
```

---

## Authentication Flow

Typical authentication flow:

1. **User registers:**
   ```bash
   POST /api/users/register
   Params: name=John, email=john@test.com, password=pass123
   ```

2. **User logs in:**
   ```bash
   POST /api/auth/login
   Body: {"email":"john@test.com","password":"pass123"}
   ```

3. **Server responds:**
   ```
   "Login successful"
   ```

---

## Development Notes

- Passwords are stored in plain text (not recommended for production)
- No JWT tokens (use in production)
- No request rate limiting (implement in production)
- CORS allows all localhost ports (restrict in production)

---

## Testing Endpoints

Using curl:

```bash
# Register user
curl -X POST "http://localhost:8080/api/users/register?name=Jane%20Doe&email=jane@example.com&password=secure123"

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secure123"}'

# Check health
curl http://localhost:8080/actuator/health
```

Using Postman or Insomnia:

1. **POST** `http://localhost:8080/api/users/register`
   - Params: name, email, password

2. **POST** `http://localhost:8080/api/auth/login`
   - Body (JSON): `{"email":"...","password":"..."}`

---

## Future Endpoints

Planned additions:
- GET `/api/users/{id}` - Get user profile
- PUT `/api/users/{id}` - Update user
- DELETE `/api/users/{id}` - Delete user
- GET `/api/auth/logout` - Logout
- POST `/api/sensors/data` - Submit sensor data
- GET `/api/sensors/readings` - Get sensor readings
- WebSocket `/ws/notifications` - Real-time notifications

---

## Support

For issues with the API:
1. Check logs: `docker compose logs -f spring-app`
2. Verify service is running: `docker compose ps`
3. Check health: `curl http://localhost:8080/actuator/health`

See [../DOCKER.md](../DOCKER.md) for Docker troubleshooting.

