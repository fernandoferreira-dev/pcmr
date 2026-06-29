.PHONY: help build up down logs logs-api logs-desktop logs-mobile logs-mqtt restart clean stop

help:
	@echo "PCMR Project - Docker Compose Commands"
	@echo "========================================"
	@echo "make build         - Build all Docker images"
	@echo "make up            - Start all services (build if needed)"
	@echo "make up-d          - Start all services in background"
	@echo "make down          - Stop and remove all containers"
	@echo "make stop          - Stop all containers without removing"
	@echo "make restart       - Restart all services"
	@echo "make logs          - View logs from all services"
	@echo "make logs-api      - View logs from API service"
	@echo "make logs-desktop  - View logs from Desktop app"
	@echo "make logs-mobile   - View logs from Mobile app"
	@echo "make logs-mqtt     - View logs from MQTT broker"
	@echo "make clean         - Remove all containers, volumes, and images"
	@echo "make ps            - Show running containers"
	@echo "make shell-api     - Open shell in API container"
	@echo "make shell-desktop - Open shell in Desktop app container"
	@echo "make shell-mobile  - Open shell in Mobile app container"
	@echo ""

build:
	docker compose build

up:
	docker compose up

up-d:
	docker compose up -d

down:
	docker compose down

stop:
	docker compose stop

restart:
	docker compose restart

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f spring-app

logs-desktop:
	docker compose logs -f desktop-app

logs-mobile:
	docker compose logs -f mobile-app

logs-mqtt:
	docker compose logs -f mqtt5

ps:
	docker compose ps

clean:
	docker compose down -v --remove-orphans
	docker system prune -f

shell-api:
	docker compose exec spring-app /bin/sh

shell-desktop:
	docker compose exec desktop-app /bin/sh

shell-mobile:
	docker compose exec mobile-app /bin/sh

# Development commands
dev-build:
	docker compose build --no-cache

dev-up:
	docker compose up -d && docker compose logs -f

# Testing
test-api:
	docker compose exec spring-app mvn test

# Utilities
validate:
	docker compose config

prune:
	docker system prune -a --volumes

