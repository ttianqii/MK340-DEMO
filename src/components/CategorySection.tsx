"use client";

import { useState } from "react";
import type { Category, Course } from "@/lib/studentChecklist";

// Shared column widths so the header and every group table line up.
// Percentages scale with the container and let text wrap inside its cell
// instead of overflowing the card at any viewport width.
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

export default function CategorySection({
  category,
  defaultOpen = false,
  forceOpen,
}: {
  category: Category;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  // While a search is active the parent forces every matching category open.
  const open = forceOpen !== undefined ? forceOpen : internalOpen;

  const cpct =
    category.creditRequired && category.creditRequired > 0
      ? Math.min(100, Math.round(((category.creditEarned || 0) / category.creditRequired) * 100))
      : null;

  const title = category.category.replace(/\s*\(Credit earned:.*\)\s*/i, "");
  const bodyId = `cat-body-${title.replace(/\W+/g, "-")}`;

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow">
      <button
        type="button"
        onClick={() => setInternalOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-6 py-3 text-left transition-colors hover:bg-gray-100"
      >
        <span className="flex items-center gap-2">
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-gray-900">{title}</span>
        </span>
        {category.creditRequired != null ? (
          <span className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {category.creditEarned} / {category.creditRequired} credits
            </span>
            {cpct != null ? (
              <span className="block h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                <span className="block h-full rounded-full bg-green-500" style={{ width: `${cpct}%` }} />
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      {open ? (
        <div id={bodyId} className="px-6 pb-2">
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
          </table>
          {category.groups.map((grp, gi) => (
            <div key={gi} className="py-2">
              {grp.group !== "-" ? (
                <h4 className="mb-1 text-sm font-medium text-gray-700">{grp.group}</h4>
              ) : null}
              <table className="w-full table-fixed text-sm">
                <Cols />
                <tbody>
                  {grp.courses.map((c, i) => (
                    <CourseRow key={i} course={c} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
