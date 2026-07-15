// Parse a saved URSA room-schedule .cfm page and store its class slots in
// MariaDB via Drizzle.
//
//   npm run db:seed -- "/path/to/schedule.cfm.html"
//
// The URSA pages are served as windows-874 (Thai), so the file is decoded with
// that charset before parsing. Re-running is safe: the unique slot index makes
// inserts idempotent (INSERT IGNORE skips rows that already exist).
import { readFileSync } from "node:fs";
import { db } from "./index";
import { classSchedule } from "./schema";
import { parseRoomSchedule } from "../lib/roomSchedule";

const DEFAULT_FILE =
  "/Users/pk/Downloads/Bangkok University - URSA Undergraduates Faculty Version.html";

async function main() {
  const file = process.argv[2] ?? DEFAULT_FILE;

  const html = new TextDecoder("windows-874").decode(readFileSync(file));
  const entries = parseRoomSchedule(html);

  if (entries.length === 0) {
    console.error(`No class slots found in ${file}. Is it a URSA room-schedule page?`);
    process.exit(1);
  }

  let inserted = 0;
  for (const e of entries) {
    const res = await db.insert(classSchedule).ignore().values(e);
    inserted += res[0].affectedRows;
  }

  const { day, semester, campus } = entries[0];
  console.log(
    `Parsed ${entries.length} slots (${campus} / ${day} / ${semester}); ` +
      `inserted ${inserted} new, ${entries.length - inserted} already present.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
