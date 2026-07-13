"use client";

import { useState, type ReactNode } from "react";

// A single collapsible card. Used for both category-level sections (with a
// credit bar on the right) and group-level sections. The open state is either
// driven by the parent (forceOpen, e.g. while searching) or managed locally.
export default function CollapsibleSection({
  id,
  header,
  headerRight,
  defaultOpen = false,
  forceOpen,
  children,
}: {
  id: string;
  header: ReactNode;
  headerRight?: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  // While a search is active the parent forces matching sections open. When
  // forceOpen clears (search reset), snap back to defaultOpen so sections don't
  // stay open after the user clears the search box. We adjust state during
  // render (tracking the previous forceOpen) rather than in an effect.
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen);
  if (prevForceOpen !== forceOpen) {
    setPrevForceOpen(forceOpen);
    if (forceOpen === undefined) setInternalOpen(defaultOpen);
  }
  const open = forceOpen !== undefined ? forceOpen : internalOpen;

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow">
      <button
        type="button"
        onClick={() => forceOpen === undefined && setInternalOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 sm:px-6"
      >
        <span className="flex min-w-0 items-center gap-2">
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
          {header}
        </span>
        {headerRight}
      </button>

      {open ? <div id={id}>{children}</div> : null}
    </section>
  );
}
