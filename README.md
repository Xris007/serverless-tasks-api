# Serverless Tasks API

A REST API built entirely on **AWS Lambda + API Gateway**, using the
**Serverless Framework** as infrastructure-as-code, with **MySQL** as the
persistence layer. Built as a portfolio project to demonstrate hands-on
serverless architecture, not just theoretical knowledge of the concept.

## Why this project

Serverless is easy to describe in an interview and much harder to reason
about correctly in practice — connection pooling, cold starts, and
event-driven design have real gotchas that only show up once you've built
something. This project intentionally surfaces those decisions instead of
hiding them:

- **Connection pooling for Lambda + MySQL**: a naive implementation opens a
  new DB connection per invocation and exhausts `max_connections` under
  load. This project uses a `connectionLimit: 1` pool created at module
  scope (reused across warm invocations), with RDS Proxy noted as the
  production-grade next step (see `src/db/connection.ts`).
- **Two independent microservices, one deployment**: the `tasks` domain
  (CRUD) and the `health` check are separate Lambda functions with
  independent triggers — one HTTP-driven, one both HTTP- and
  schedule-driven (EventBridge) — showing event-driven design beyond plain
  REST.
- **Validation at the edge**: every write goes through a Zod schema before
  touching the database, so the API never trusts client input blindly.

## Architecture

```
                     ┌─────────────────┐
   HTTP requests ───▶│   API Gateway    │
                     └────────┬─────────┘
                              │ routes to individual functions
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐    ┌──────────┐
        │createTask│   │listTasks │    │getTask   │    │deleteTask│  ... (Lambda functions)
        └────┬─────┘   └────┬─────┘    └────┬─────┘    └────┬─────┘
             │               │                │               │
             └───────────────┴────────┬───────┴───────────────┘
                                      ▼
                              ┌───────────────┐
                              │  MySQL (RDS)  │
                              └───────────────┘

        ┌──────────┐
        │  health  │◀── HTTP GET /health
        └────┬─────┘◀── EventBridge schedule (every 15 min)
             ▼
      ┌───────────────┐
      │  MySQL (RDS)  │  (connectivity self-check)
      └───────────────┘
```

## Endpoints

| Method | Path          | Description                     |
|--------|---------------|----------------------------------|
| POST   | `/tasks`      | Create a task                   |
| GET    | `/tasks`      | List tasks (filter by `status`, paginate with `limit`/`offset`) |
| GET    | `/tasks/{id}` | Get a single task                |
| PATCH  | `/tasks/{id}` | Update a task                   |
| DELETE | `/tasks/{id}` | Delete a task                   |
| GET    | `/health`     | Health check (DB connectivity)  |

## Tech stack

| Layer | Technology |
|---|---|
| Compute | AWS Lambda (Node.js 20.x, TypeScript) |
| API layer | Amazon API Gateway (REST) |
| Database | MySQL (RDS or any managed instance) |
| IaC | Serverless Framework v3 |
| Validation | Zod |
| Scheduled jobs | Amazon EventBridge |
| Bundling | esbuild (via serverless-esbuild) |

## Setup

### 1. Database

Run `src/db/schema.sql` against any MySQL instance (a free-tier RDS
instance works fine for testing).

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
# fill in DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
```

Serverless Framework reads these via `${env:DB_HOST}` etc. in
`serverless.yml` — make sure they're exported in your shell or loaded via
`serverless-dotenv-plugin` if you prefer not to export them manually.

### 4. Run locally

```bash
npx serverless offline
```

This spins up API Gateway + Lambda locally on `http://localhost:3000`,
letting you test all endpoints without deploying to AWS.

### 5. Deploy to AWS

Requires AWS credentials configured locally (`aws configure`).

```bash
npm run deploy          # deploys to the "dev" stage
npm run deploy:prod     # deploys to the "prod" stage
```

The Serverless Framework will provision API Gateway, all Lambda functions,
IAM roles, and the EventBridge schedule automatically, and print the live
endpoint URLs when done.

### 6. Remove all AWS resources

```bash
npx serverless remove
```

Important for a portfolio project — this tears down everything cleanly so
you're not paying for idle infrastructure between demos.

## Scaling notes (for discussion in interviews)

- **RDS Proxy**: at higher concurrency, swap the direct MySQL connection
  for RDS Proxy, which pools connections at the infrastructure level across
  all Lambda execution environments instead of per-environment.
- **Provisioned Concurrency**: if cold starts become a problem for latency-
  sensitive endpoints, AWS Lambda Provisioned Concurrency keeps a set number
  of execution environments warm.
- **VPC considerations**: RDS typically lives inside a VPC; Lambda functions
  accessing it need to be attached to that VPC, which affects cold start
  time and requires a NAT Gateway for outbound internet access (e.g. to
  call external APIs) — a common serverless + RDS gotcha worth knowing.
