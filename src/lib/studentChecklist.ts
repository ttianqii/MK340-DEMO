// Local demo replacement for the (removed) live scrape of
// studentchecklist.bu.ac.th. Every student, their info fields, and their
// course checklist now live in this app's own MariaDB database (see
// src/db/schema.ts) — populated via `npm run db:seed`. No network calls to
// any external/university system happen here.
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  studentInfoItems,
  checklistCategories,
  checklistGroups,
  checklistCourses,
} from "@/db/schema";
import { verifyPassword } from "@/lib/serverCrypto";

export interface AuthResult {
  ok: boolean;
  message?: string;
}

export interface Course {
  code: string;
  name: string;
  credit: string;
  grade: string;
  note: string;
}

export interface CourseGroup {
  group: string;
  courses: Course[];
}

export interface Category {
  category: string;
  id?: string;
  creditEarned: number | null;
  creditRequired: number | null;
  groups: CourseGroup[];
}

export interface InfoItem {
  label: string;
  value: string;
}

export interface StudentInfo {
  nameTh: string;
  nameEn: string;
  studentId: string;
  photo: string;
  info: InfoItem[];
  gpa: string;
  totalCredits: string;
  creditsEarned: string;
  creditsTransferred: string;
}

export interface Checklist {
  student: StudentInfo;
  categories: Category[];
}

export type ChecklistResult = { ok: true; checklist: Checklist } | { ok: false; expired: boolean };

/** Authenticate a demo student against the local `students` table. */
export async function authenticate(username: string, password: string): Promise<AuthResult> {
  const row = await db.query.students.findFirst({ where: eq(students.username, username) });

  if (!row || !verifyPassword(password, row.passwordHash)) {
    return { ok: false, message: "Invalid username or password." };
  }

  return { ok: true };
}

/** Load a student's full checklist from the local database. */
export async function fetchChecklist(username: string): Promise<ChecklistResult> {
  const student = await db.query.students.findFirst({ where: eq(students.username, username) });
  if (!student) return { ok: false, expired: false };

  const [infoRows, categoryRows] = await Promise.all([
    db
      .select()
      .from(studentInfoItems)
      .where(eq(studentInfoItems.studentId, student.id))
      .orderBy(asc(studentInfoItems.sortOrder)),
    db
      .select()
      .from(checklistCategories)
      .where(eq(checklistCategories.studentId, student.id))
      .orderBy(asc(checklistCategories.sortOrder)),
  ]);

  const categories: Category[] = [];
  for (const cat of categoryRows) {
    const groupRows = await db
      .select()
      .from(checklistGroups)
      .where(eq(checklistGroups.categoryId, cat.id))
      .orderBy(asc(checklistGroups.sortOrder));

    const groups: CourseGroup[] = [];
    for (const group of groupRows) {
      const courseRows = await db
        .select()
        .from(checklistCourses)
        .where(eq(checklistCourses.groupId, group.id))
        .orderBy(asc(checklistCourses.sortOrder));

      groups.push({
        group: group.groupName,
        courses: courseRows.map((c) => ({
          code: c.code,
          name: c.name,
          credit: c.credit,
          grade: c.grade,
          note: c.note ?? "",
        })),
      });
    }

    categories.push({
      category: cat.category,
      id: cat.anchorId ?? undefined,
      creditEarned: cat.creditEarned,
      creditRequired: cat.creditRequired,
      groups,
    });
  }

  return {
    ok: true,
    checklist: {
      student: {
        nameTh: student.nameTh,
        nameEn: student.nameEn,
        studentId: student.studentCode,
        photo: student.photo ?? "",
        info: infoRows.map((i) => ({ label: i.label, value: i.value })),
        gpa: student.gpa ?? "",
        totalCredits: student.totalCredits ?? "",
        creditsEarned: student.creditsEarned ?? "",
        creditsTransferred: student.creditsTransferred ?? "",
      },
      categories,
    },
  };
}
