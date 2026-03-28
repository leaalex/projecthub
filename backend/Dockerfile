# CGO required for github.com/mattn/go-sqlite3
FROM golang:1.22-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -ldflags="-s -w" -o /server ./cmd/server

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libsqlite3-0 wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir -p /app/storage
COPY --from=builder /server /usr/local/bin/server

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health | grep -q ok || exit 1

CMD ["/usr/local/bin/server"]
