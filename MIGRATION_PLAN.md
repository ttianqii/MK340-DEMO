# MariaDB / Docker / Swagger migration — status

Delete this file once the demo student seed data is loaded and you've done a final check.

## ✅ Done — verified with a real `docker compose up --build` run

- Full MariaDB migration: `src/db/schema.ts`, `drizzle.config.ts`, `src/db/index.ts`,
  `scripts/migrate.mjs` all switched from libSQL/Turso to `drizzle-orm/mysql2`.
- Local demo auth: `src/lib/studentChecklist.ts` rewritten to read/write the local `students` /
  `student_info_items` / `checklist_categories` / `checklist_groups` / `checklist_courses`
  tables instead of scraping `studentchecklist.bu.ac.th`. `src/lib/serverCrypto.ts` now does
  password hashing (`scrypt`) instead of BU-cookie AES encryption. `src/lib/session.ts`
  simplified accordingly. Login route + dashboard/plan pages updated to match.
- `class_schedule` (real scraped BU room-schedule data, ~3482 rows) converted from the old
  SQLite dump to `scripts/seed-class-schedule.sql` and loads automatically via
  `scripts/seed-sql.mjs` — confirmed all 3482 rows land in MariaDB on container boot.
- `docker-compose.yml` — `mariadb` (own volume), `phpmyadmin`, `swagger-ui`
  (`openapi/openapi.yaml`), `app`. Confirmed all four boot and respond:
  landing page, `/login`, `/api/auth/me` (401 when signed out), `/api/auth/login` (401 on bad
  creds), phpMyAdmin UI, Swagger UI all returned 200/expected status in a live test.
- Fixed a **pre-existing bug** unrelated to this migration: `next.config.ts` never set
  `output: "standalone"`, so the old Dockerfile's `COPY .next/standalone` would always have
  failed. Added it.
- `package.json`, `.env.example`, `README.md`, `.gitignore` (added `!.env.example` exception)
  all updated.

## 🔲 The one remaining thing — demo seed data

Schema is ready (`students`, `student_info_items`, `checklist_categories`, `checklist_groups`,
`checklist_courses`) but has **no seed content yet**. Waiting on the user to provide:

1. Demo login username + password
2. Student profile: Thai name, English name, student ID, GPA, total/earned/transferred credits,
   photo URL (optional)
3. Checklist categories → groups → courses (code, name, credit, grade, note) with
   earned/required credits per category

Once provided: write `scripts/seed-demo-students.sql` (same pattern as
`scripts/seed-class-schedule.sql` — plain INSERT statements, loaded automatically by
`docker-entrypoint.sh` if the file exists) using `hashPassword()` from
`src/lib/serverCrypto.ts` to produce the `password_hash` value (run it once via `node -e` or a
tiny throwaway script — don't hand-write a hash).

## Notes

- `dbsetup.js` at repo root is unused/orphaned — out of scope, left alone.
- Two pre-existing lint errors (unrelated to this migration, not touched):
  `dbsetup.js` require-import, `src/components/PlanBuilder.tsx` setState-in-effect.
- Test run used non-default ports (`DB_PORT=3309 APP_PORT=8090 PHPMYADMIN_PORT=8091
  SWAGGER_PORT=8092`) because this machine already has other unrelated docker projects
  bound to 3306/3307/8080/7070. The committed `.env.example` defaults (3306/8080/8081/8082)
  are fine for a clean machine — just check for local conflicts.
- A working `.env` (with throwaway local test secrets) was left in place from verification —
  gitignored, but replace `SECRET_KEY`/`MARIADB_ROOT_PASSWORD` with your own before relying on
  it for anything beyond local testing.
