.PHONY: backend-run backend-test frontend-dev frontend-build install \
	docker-up docker-up-prod docker-up-dev docker-down docker-down-dev docker-logs

install:
	cd backend && go mod download
	cd frontend && npm install

backend-run:
	cd backend && go run ./cmd/server

backend-test:
	cd backend && go test ./...

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# Production (docker-compose.yml включает docker-compose.prod.yml)
docker-up: docker-up-prod

docker-up-prod:
	docker compose up --build -d

docker-up-dev:
	docker compose -f docker-compose.dev.yml up --build

docker-down:
	docker compose down

docker-down-dev:
	docker compose -f docker-compose.dev.yml down

docker-logs:
	docker compose logs -f

docker-logs-dev:
	docker compose -f docker-compose.dev.yml logs -f
