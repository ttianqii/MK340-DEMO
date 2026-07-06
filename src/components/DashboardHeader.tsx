"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Study Plan" },
  { href: "/dashboard/plan", label: "Plan next term" },
];

export default function DashboardHeader({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">Study Plan</span>
            <span className="text-sm text-gray-400">/ {username}</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
