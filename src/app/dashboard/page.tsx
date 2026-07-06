import { redirect } from "next/navigation";
import { getSession } from "@/lib/serverAuth";
import { decryptValue } from "@/lib/serverCrypto";
import { fetchChecklist, type Checklist } from "@/lib/studentChecklist";
import LogoutButton from "@/components/LogoutButton";
import CategorySection from "@/components/CategorySection";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookies = session.ck ? decryptValue(session.ck) : null;
  const result = cookies ? await fetchChecklist(cookies, session.url) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">Study Plan</h1>
            <span className="text-sm text-gray-400">/ {session.u}</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!result || !result.ok ? (
          <div className="rounded-md bg-white p-8 text-center shadow">
            <p className="text-gray-700">
              {result && !result.ok && result.expired
                ? "Your checklist session has expired."
                : "We couldn't load your study plan right now."}
            </p>
            <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
              Sign in again
            </a>
          </div>
        ) : (
          <ChecklistView checklist={result.checklist} />
        )}
      </main>
    </div>
  );
}

function ChecklistView({ checklist }: { checklist: Checklist }) {
  const { student, categories } = checklist;
  const earned = Number(student.creditsEarned) || 0;
  const total = Number(student.totalCredits) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((earned / total) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Student card */}
      <section className="overflow-hidden rounded-lg bg-white shadow">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          {student.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photo}
              alt={student.nameEn || student.nameTh}
              className="h-24 w-24 rounded-full border border-gray-200 object-cover"
            />
          ) : null}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{student.nameTh}</h2>
            {student.nameEn ? <p className="text-sm text-gray-500">{student.nameEn}</p> : null}
            <p className="mt-1 font-mono text-sm text-gray-500">{student.studentId}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{student.gpa || "—"}</p>
            <p className="text-xs uppercase tracking-wide text-gray-400">GPA</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="border-t border-gray-100 px-6 py-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Credits earned</span>
            <span className="text-gray-500">
              {earned} / {total}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Info grid */}
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-gray-100 px-6 py-4 text-sm sm:grid-cols-2">
          {student.info.map((item, i) => (
            <div key={i} className="flex justify-between gap-4">
              <dt className="text-gray-500">{item.label}</dt>
              <dd className="text-right font-medium text-gray-800">{item.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Categories */}
      {categories.map((cat, ci) => (
        <CategorySection key={ci} category={cat} />
      ))}
    </div>
  );
}
