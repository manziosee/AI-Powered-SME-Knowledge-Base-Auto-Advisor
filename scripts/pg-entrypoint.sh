#!/bin/bash
# Custom entry-point for pgvector on Fly.io
# Fly mounts volumes as root (uid=0, chmod=0755).  Postgres needs to own
# its data directory, so we create the PGDATA subdirectory and hand it over
# to the postgres user BEFORE the official docker-entrypoint.sh runs.

set -e

PGDATA="${PGDATA:-/var/lib/postgresql/data/pgdata}"

# Create the data sub-directory if it doesn't exist yet.
mkdir -p "$PGDATA"

# Ensure the postgres user owns the full hierarchy.
chown -R postgres:postgres "$(dirname "$PGDATA")"
chmod 700 "$PGDATA"

# Hand off to the official Postgres entry-point.
exec docker-entrypoint.sh "$@"
