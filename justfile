run-db:
    docker-compose up -d

run-ui:
    bun run server/socket-server.ts

run: run-ui run-db