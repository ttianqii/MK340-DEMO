# Study Plan (demo)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This is a **local demo build**: login and study-plan/checklist data come entirely from this
app's own MariaDB database — there are no calls to any external/university system.

## Running with Docker (recommended)

```bash
cp .env.example .env
# edit .env: set SECRET_KEY and MARIADB_ROOT_PASSWORD to your own values

docker compose up --build
```

This starts four containers, each with its own isolated data:

| Service      | URL                              | Purpose                                       |
| ------------ | --------------------------------- | ---------------------------------------------- |
| `app`        | <http://localhost:8080>           | The Next.js app                                |
| `mariadb`    | localhost:3306                    | The app's own database (own volume)            |
| `phpmyadmin` | <http://localhost:8081>           | Browse/edit the MariaDB database               |
| `swagger-ui` | <http://localhost:8082>           | Interactive API docs (`openapi/openapi.yaml`)  |

On boot, the `app` container automatically runs Drizzle migrations and seeds the
`class_schedule` table from `scripts/seed-class-schedule.sql` (idempotent — safe on every
restart). Demo student login/checklist data is seeded from `scripts/seed-demo-students.sql`
if present.

Ports and credentials are all overridable via `.env` — see `.env.example`.

## Running locally without Docker

First, run your own MariaDB instance and point `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`
(see `.env.example`) at it, then:

```bash
npm install
npm run db:generate   # only needed after changing src/db/schema.ts
npm run db:migrate
npm run db:seed:schedule
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
