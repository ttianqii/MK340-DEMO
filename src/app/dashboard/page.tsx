import { getSession } from "@/lib/serverAuth";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your study plan</h1>
            <p className="mt-1 text-sm text-gray-500">Signed in as {session?.u}</p>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-8 rounded-md bg-white p-6 shadow-xl">
          <p className="text-gray-600">This is where your study plan will live.</p>
        </div>
      </div>
    </div>
  );
}
