import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ── Demo student accounts ────────────────────────────────────────────────
// Replaces the live studentchecklist.bu.ac.th login: each row is a local
// demo account with its own password hash (see src/lib/serverCrypto.ts).
export const students = mysqlTable(
  "students",
  {
    id: int("id").primaryKey().autoincrement(),

    username: varchar("username", { length: 64 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    nameTh: varchar("name_th", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    studentCode: varchar("student_code", { length: 32 }).notNull(), // e.g. "6300123456"
    photo: varchar("photo", { length: 512 }),

    gpa: varchar("gpa", { length: 16 }),
    totalCredits: varchar("total_credits", { length: 16 }),
    creditsEarned: varchar("credits_earned", { length: 16 }),
    creditsTransferred: varchar("credits_transferred", { length: 16 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("students_username_uq").on(t.username)]
);

export type StudentRow = typeof students.$inferSelect;
export type NewStudentRow = typeof students.$inferInsert;

// Extra labelled fields shown in the student info grid (e.g. "คณะ" -> "บริหารธุรกิจ").
export const studentInfoItems = mysqlTable(
  "student_info_items",
  {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    label: varchar("label", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("student_info_items_student_idx").on(t.studentId)]
);

export type StudentInfoItemRow = typeof studentInfoItems.$inferSelect;
export type NewStudentInfoItemRow = typeof studentInfoItems.$inferInsert;

// Top-level checklist categories, e.g. "หมวดวิชาศึกษาทั่วไป (Credit earned: 30/30)".
export const checklistCategories = mysqlTable(
  "checklist_categories",
  {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    category: varchar("category", { length: 255 }).notNull(),
    anchorId: varchar("anchor_id", { length: 32 }), // G/C/J/E/F — joins to the credit-summary row
    creditEarned: int("credit_earned"),
    creditRequired: int("credit_required"),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("checklist_categories_student_idx").on(t.studentId)]
);

export type ChecklistCategoryRow = typeof checklistCategories.$inferSelect;
export type NewChecklistCategoryRow = typeof checklistCategories.$inferInsert;

// Sub-group headers within a category, e.g. "กลุ่มภาษาอังกฤษ (9 หน่วยกิต)".
export const checklistGroups = mysqlTable(
  "checklist_groups",
  {
    id: int("id").primaryKey().autoincrement(),
    categoryId: int("category_id")
      .notNull()
      .references(() => checklistCategories.id, { onDelete: "cascade" }),

    groupName: varchar("group_name", { length: 255 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("checklist_groups_category_idx").on(t.categoryId)]
);

export type ChecklistGroupRow = typeof checklistGroups.$inferSelect;
export type NewChecklistGroupRow = typeof checklistGroups.$inferInsert;

// Individual course rows within a group.
export const checklistCourses = mysqlTable(
  "checklist_courses",
  {
    id: int("id").primaryKey().autoincrement(),
    groupId: int("group_id")
      .notNull()
      .references(() => checklistGroups.id, { onDelete: "cascade" }),

    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    credit: varchar("credit", { length: 16 }).notNull(),
    grade: varchar("grade", { length: 16 }).notNull(),
    note: varchar("note", { length: 255 }),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("checklist_courses_group_idx").on(t.groupId)]
);

export type ChecklistCourseRow = typeof checklistCourses.$inferSelect;
export type NewChecklistCourseRow = typeof checklistCourses.$inferInsert;

// ── Room schedule ─────────────────────────────────────────────────────────
// One occupied slot in the URSA room schedule grid, e.g. the cell
//   title="Legal Aspects in Entrepreneurship"  →  8.40-11.00 / EPT404 / 450A
// sitting in room RA1402 (capacity 80) on Monday of "First Semester 2026".
export const classSchedule = mysqlTable(
  "class_schedule",
  {
    id: int("id").primaryKey().autoincrement(),

    campus: varchar("campus", { length: 128 }).notNull(), // "Rangsit Campus"
    semester: varchar("semester", { length: 64 }).notNull(), // "First Semester 2026"
    day: varchar("day", { length: 16 }).notNull(), // "Monday"

    room: varchar("room", { length: 32 }).notNull(), // "RA1402"
    roomCapacity: int("room_capacity"), // 80 (null when unknown)

    startTime: varchar("start_time", { length: 16 }).notNull(), // "8.40"
    endTime: varchar("end_time", { length: 16 }).notNull(), // "11.00"

    courseCode: varchar("course_code", { length: 32 }).notNull(), // "EPT404"
    courseName: varchar("course_name", { length: 255 }).notNull(), // "Legal Aspects in Entrepreneurship"
    section: varchar("section", { length: 16 }), // "450A" (null when the cell has none)

    createdAt: timestamp("created_at").notNull().defaultNow(),
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
