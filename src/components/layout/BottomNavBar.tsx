"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Panel", href: "/panel" },
  { label: "Historial", href: "/historial" },
  { label: "Ajustes", href: "/ajustes" },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-70 shadow-ambient-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex h-9 items-center px-5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
