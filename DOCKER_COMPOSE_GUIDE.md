# Docker Compose guide

This project uses Docker Compose to start four services that together make up
the application:

```text
PostgreSQL becomes healthy
          |
          v
`migrate` creates the tables and exits successfully
          |
          v
`backend` starts the Express API
          |
          v
`frontend` starts
```

The important distinction is that `db`, `backend`, and `frontend` are
long-running services. `migrate` is a short-lived setup job. It is expected to
finish and stop.

## Which Compose file is used?

There are three Compose files:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Common service definitions used in every environment |
| `docker-compose.override.yml` | Development changes; automatically merged when running `docker compose up` |
| `docker-compose.prod.yml` | Production changes; explicitly merged by the production command |

Development:

```bash
docker compose up --build
```

This is effectively:

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

Production:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Later files add to or replace matching settings in the base file. For example,
the base backend image defaults to the Dockerfile's final production stage,
while the development override explicitly selects `target: development` and
changes the command to `npm run dev`.

## The base file, section by section

### `db`

```yaml
db:
  image: postgres:18
  container_name: postgres18
  restart: unless-stopped
```

- Uses the official PostgreSQL 18 image.
- Gives its container the fixed name `postgres18`.
- Restarts PostgreSQL after a crash or Docker restart, unless someone manually
  stopped it.

```yaml
environment:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: secret123
  POSTGRES_DB: todo_app
```

These variables tell the PostgreSQL image what user and database to create the
first time the data directory is initialized. They must agree with the
backend's `PGUSER`, `PGPASSWORD`, and `PGDATABASE` values.

```yaml
ports:
  - '5432:5432'
```

The left side is the host port and the right side is the container port. This
makes PostgreSQL available to tools on the host at `localhost:5432`. Containers
do not use this mapping to talk to each other; they use `db:5432` on the Docker
network.

```yaml
volumes:
  - pgdata:/var/lib/postgresql
```

The named `pgdata` volume keeps database files when a container is replaced.
Removing a container therefore does not normally delete the data. Deleting the
volume does delete the persisted database.

```yaml
networks:
  - app-network
```

All four services join the same private network. Docker DNS makes service names
work as host names, so the backend should use `PGHOST=db`, not
`PGHOST=localhost`. Inside the backend container, `localhost` means the backend
container itself.

### Database health check

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U admin -d todo_app']
  interval: 5s
  timeout: 5s
  retries: 10
  start_period: 10s
```

Starting a container only means its process was launched. PostgreSQL may still
need several seconds before it can accept connections. The health check solves
that timing problem.

- `CMD-SHELL` runs the following text through a shell inside the database
  container.
- `pg_isready -U admin -d todo_app` asks PostgreSQL whether it is accepting
  connections for that user/database target.
- `start_period: 10s` gives PostgreSQL an initial grace period. Failures during
  startup do not count toward the retry limit.
- `interval: 5s` runs the check approximately every five seconds.
- `timeout: 5s` treats a check that takes longer than five seconds as failed.
- `retries: 10` marks the container unhealthy after ten counted consecutive
  failures.

This check answers only "is PostgreSQL accepting connections?" It does not
create tables and does not prove that the application schema exists. That is
why the separate migration job is still needed.

This is also different from the Express route `GET /api/health`. The Compose
file currently health-checks PostgreSQL only; it does not define a Docker
health check for the backend or frontend.

### `migrate`: the one-shot schema job

```yaml
migrate:
  build: ./backend
  env_file:
    - ./backend/.env
  command: npm run db:init
  restart: 'no'
  depends_on:
    db:
      condition: service_healthy
```

This service builds the backend image but replaces its normal startup command
with `npm run db:init`.

Its lifecycle is:

1. Compose waits until the `db` health check passes.
2. The migration container connects using `backend/.env`.
3. `npm run db:init` executes `node dist/db/init.js`.
4. `init.js` reads `dist/db/schema.sql` and sends it to PostgreSQL.
5. It closes the connection pool and exits with code `0` on success.
6. On an error it sets exit code `1`.

`restart: 'no'` is deliberate: this is a job, not a server. A successful
migration container showing as `Exited (0)` is the expected result. It should
not remain "Up".

The production image contains compiled JavaScript rather than TypeScript. The
backend build therefore performs this chain:

```text
npm run build
  -> TypeScript compiler creates dist/db/init.js
  -> copy:assets copies src/db/schema.sql to dist/db/schema.sql
  -> npm run db:init can read and execute that copied SQL file
```

In development, `docker-compose.override.yml` changes this service to the
Dockerfile's development stage, mounts the backend source, and runs:

```bash
npm run db:init:dev
```

That command uses `ts-node src/db/init.ts`, because the development container
does not need a prebuilt `dist` directory.

Despite the service name, this is a simple schema initializer, not a full
versioned migration system such as Prisma Migrate, Knex migrations, or
Flyway. The SQL uses `CREATE TABLE IF NOT EXISTS` and
`CREATE INDEX IF NOT EXISTS`, which makes rerunning the current script safe.
However, `IF NOT EXISTS` does not update an already-existing table. For
example, adding a new column to the `CREATE TABLE` statement later would not
add that column to an existing database; that would require an explicit
`ALTER TABLE` statement or a real versioned migration tool.

### `backend`

```yaml
backend:
  build: ./backend
  volumes:
    - ./backend/logs:/app/logs
  env_file:
    - ./backend/.env
  depends_on:
    db:
      condition: service_healthy
    migrate:
      condition: service_completed_successfully
```

The backend starts only after both prerequisites are satisfied:

- PostgreSQL reports healthy.
- The migration process exits with code `0`.

If migration exits with code `1`, the backend does not start. This prevents the
API from starting against a missing or broken schema. The logs bind mount keeps
the application's log files visible at `backend/logs` on the host.

In development, the override mounts `./backend` over `/app`, preserves the
container's own `/app/node_modules`, publishes port 5000, and runs the watch
command `npm run dev`.

### `frontend`

The frontend is built from `./frontend` and starts after the backend container
has been started. Its short-form dependency:

```yaml
depends_on:
  - backend
```

controls startup order only. It does not wait for the API to pass a health
check, because no backend Docker health check is defined. The frontend should
therefore tolerate a brief API startup delay.

In development, source code is mounted into the container, port 5173 is
published, and Vite runs with `--host` so it can receive connections from
outside its container. In production, Nginx serves the compiled frontend on
container port 80, published as host port 8080.

## How to read `depends_on`

The three dependency forms in this project mean different things:

| Declaration | What Compose waits for |
| --- | --- |
| `db: condition: service_healthy` | The database health check passes |
| `migrate: condition: service_completed_successfully` | The job stops with exit code `0` |
| `depends_on: [backend]` | The backend container is started, not necessarily ready |

So the base startup order is intentional:

```text
db started
  -> db healthy
     -> migrate started
        -> migrate exits 0
           -> backend started
              -> frontend started
```

## Useful commands when startup fails

Show service state, including health and exit status:

```bash
docker compose ps -a
```

Read the database health-check output:

```bash
docker inspect postgres18 --format '{{json .State.Health}}'
```

Read migration output:

```bash
docker compose logs migrate
```

Read database and backend output:

```bash
docker compose logs db backend
```

Run the migration manually against an already running development stack:

```bash
docker compose run --rm migrate
```

Display the final merged development configuration when an override is
confusing:

```bash
docker compose config
```

For production, include both files in diagnostic commands too:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps -a
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs migrate
```

## Common causes of migration failure

- `PGHOST` is `localhost` instead of `db` inside `backend/.env`.
- The backend database credentials do not match the `POSTGRES_*` values.
- Credentials were changed after `pgdata` was first initialized. PostgreSQL's
  initialization variables do not rewrite users/passwords in an existing data
  volume.
- The compiled production image is missing `dist/db/schema.sql`.
- New schema changes rely only on `CREATE TABLE IF NOT EXISTS`; this does not
  modify a table that already exists.

