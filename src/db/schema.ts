import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// One occupied slot in the URSA room schedule grid, e.g. the cell
//   title="Legal Aspects in Entrepreneurship"  →  8.40-11.00 / EPT404 / 450A
// sitting in room RA1402 (capacity 80) on Monday of "First Semester 2026".
export const classSchedule = sqliteTable(
  "class_schedule",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    campus: text("campus").notNull(), // "Rangsit Campus"
    semester: text("semester").notNull(), // "First Semester 2026"
    day: text("day").notNull(), // "Monday"

    room: text("room").notNull(), // "RA1402"
    roomCapacity: integer("room_capacity"), // 80 (null when unknown)

    startTime: text("start_time").notNull(), // "8.40"
    endTime: text("end_time").notNull(), // "11.00"

    courseCode: text("course_code").notNull(), // "EPT404"
    courseName: text("course_name").notNull(), // "Legal Aspects in Entrepreneurship"
    section: text("section"), // "450A" (null when the cell has none)

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // A room can only host one course at a given start time on a given day of a term.
    uniqueIndex("class_schedule_slot_uq").on(
      t.semester,
      t.day,
      t.room,
      t.startTime,
      t.courseCode
    ),
  ]
);

export type ClassScheduleRow = typeof classSchedule.$inferSelect;
export type NewClassScheduleRow = typeof classSchedule.$inferInsert;
