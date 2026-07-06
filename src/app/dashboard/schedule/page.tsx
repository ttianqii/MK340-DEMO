import { redirect } from "next/navigation";
import { getSession } from "@/lib/serverAuth";
import DashboardHeader from "@/components/DashboardHeader";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader username={session.u} />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Plan your class schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Build and arrange the courses you intend to take next term.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">Your class schedule planner will live here.</p>
          <p className="mt-1 text-sm text-gray-400">Coming soon.</p>
        </div>
      </main>
    </div>
  );
}
