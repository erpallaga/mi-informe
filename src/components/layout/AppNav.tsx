"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NewEntrySheet from "@/components/panel/NewEntrySheet";

const LEFT_TABS = [
  { label: "Panel",     href: "/panel" },
  { label: "Historial", href: "/historial" },
];

const RIGHT_TABS = [
  { label: "Plan.",   href: "/planificador" },
  { label: "Eventos", href: "/eventos" },
];

export default function AppNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass-70 shadow-ambient-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-center px-2">
          <div className="flex flex-1 items-center justify-around">
            {LEFT_TABS.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex h-9 items-center px-3 text-xs font-semibold uppercase tracking-widest transition-colors ease-out ${
                    isActive ? "bg-primary text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* FAB central elevado */}
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Nueva entrada"
            className="flex shrink-0 items-center justify-center w-14 h-14 mx-3 bg-primary text-on-primary text-2xl font-light shadow-ambient -translate-y-4 transition-opacity ease-out"
          >
            +
          </button>

          <div className="flex flex-1 items-center justify-around">
            {RIGHT_TABS.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex h-9 items-center px-3 text-xs font-semibold uppercase tracking-widest transition-colors ease-out ${
                    isActive ? "bg-primary text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <NewEntrySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
}
