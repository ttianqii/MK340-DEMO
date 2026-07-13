"use client";

import type { Category, Course, CourseGroup } from "@/lib/studentChecklist";
import CollapsibleSection from "./CollapsibleSection";

// Shared column widths so every group table lines up. Percentages scale with
// the container and let text wrap inside its cell instead of overflowing the
// card at any viewport width.
function Cols() {
  return (
    <colgroup>
      <col className="w-[13%]" />
      <col className="w-[44%]" />
      <col className="w-[9%]" />
      <col className="w-[10%]" />
      <col className="w-[24%]" />
    </colgroup>
  );
}

function gradeBadge(grade: string) {
  const g = grade.trim().toUpperCase();
  if (!g) {
    return <span className="text-gray-300">—</span>;
  }
  let cls = "bg-green-100 text-green-800"; // passing
  if (g === "F") cls = "bg-red-100 text-red-800";
  else if (g === "W" || g === "I" || g === "U") cls = "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{grade.trim()}</span>
  );
}

function isPassing(grade: string) {
  const g = grade.trim().toUpperCase();
  return g !== "" && g !== "F" && g !== "W" && g !== "I" && g !== "U";
}

// Group titles carry required credits, e.g. "…ภาษาอังกฤษ (9 หน่วยกิต)".
// Earned credits are the sum of passing courses. Returns null when the title
// has no credit figure to compare against.
function groupProgress(group: CourseGroup) {
  const required = Number(group.group.match(/\((\d+)\s*หน่วยกิต\)/)?.[1]);
  if (!required) return null;
  const earned = group.courses.reduce(
    (sum, c) => sum + (isPassing(c.grade) ? Number(c.credit) || 0 : 0),
    0
  );
  return { earned, required, pct: Math.min(100, Math.round((earned / required) * 100)) };
}

function CreditBar({ earned, required, pct }: { earned: number; required: number; pct: number }) {
  return (
    <span className="flex w-full items-center gap-3 sm:w-auto">
      <span className="text-sm text-gray-500">
        {earned} / {required} credits
      </span>
      <span className="block h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
        <span className="block h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

function CourseRow({ course }: { course: Course }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-1.5 pr-3 align-top font-mono text-xs text-gray-600 whitespace-nowrap">{course.code}</td>
      <td className="py-1.5 pr-3 align-top text-gray-800">{course.name}</td>
      <td className="py-1.5 pr-3 align-top text-center text-gray-600 whitespace-nowrap">{course.credit}</td>
      <td className="py-1.5 pr-3 align-top text-center whitespace-nowrap">{gradeBadge(course.grade)}</td>
      <td className="py-1.5 align-top text-xs break-words text-gray-400">{course.note}</td>
    </tr>
  );
}

// One group's course table, including its column headers.
function GroupTable({ group }: { group: CourseGroup }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] px-4 pb-3 pt-1 sm:px-6">
        <table className="w-full table-fixed text-sm">
          <Cols />
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400">
              <th className="py-2 pr-3 font-medium">รหัสวิชา</th>
              <th className="py-2 pr-3 font-medium">ชื่อวิชา</th>
              <th className="py-2 pr-3 text-center font-medium">หน่วยกิต</th>
              <th className="py-2 pr-3 text-center font-medium">เกรด</th>
              <th className="py-2 font-medium">วิชาพื้นความรู้</th>
            </tr>
          </thead>
          <tbody>
            {group.courses.map((c, i) => (
              <CourseRow key={i} course={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CategorySection({
  category,
  defaultOpen = false,
  forceOpen,
}: {
  category: Category;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}) {
  const title = category.category.replace(/\s*\(Credit earned:.*\)\s*/i, "").trim();

  // The checklist source often has no category headers, so the parser puts
  // every group under one blank ("-") placeholder category. Collapsing that
  // would hide the whole plan behind a single meaningless toggle, so instead
  // make each named group its own collapsible section.
  if (!title || title === "-") {
    return (
      <>
        {category.groups.map((grp, gi) => {
          const p = groupProgress(grp);
          return (
            <CollapsibleSection
              key={gi}
              id={`grp-${gi}-${grp.group.replace(/\W+/g, "-")}`}
              defaultOpen={defaultOpen}
              forceOpen={forceOpen}
              header={<span className="font-semibold text-gray-900">{grp.group === "-" ? "Courses" : grp.group}</span>}
              headerRight={p ? <CreditBar {...p} /> : null}
            >
              <GroupTable group={grp} />
            </CollapsibleSection>
          );
        })}
      </>
    );
  }

  const cReq = category.creditRequired;
  const cEarned = category.creditEarned || 0;

  return (
    <CollapsibleSection
      id={`cat-${title.replace(/\W+/g, "-")}`}
      defaultOpen={defaultOpen}
      forceOpen={forceOpen}
      header={<span className="font-semibold text-gray-900">{title}</span>}
      headerRight={
        cReq != null && cReq > 0 ? (
          <CreditBar earned={cEarned} required={cReq} pct={Math.min(100, Math.round((cEarned / cReq) * 100))} />
        ) : null
      }
    >
      {category.groups.map((grp, gi) => (
        <div key={gi} className="py-1">
          {grp.group !== "-" ? (
            <h4 className="mb-1 px-4 pt-2 text-sm font-medium text-gray-700 sm:px-6">{grp.group}</h4>
          ) : null}
          <GroupTable group={grp} />
        </div>
      ))}
    </CollapsibleSection>
  );
}
