"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoIcon from "@/components/ui/LogoIcon";

export default function TopAppBar() {
  const pathname = usePathname();
  const showGear = !pathname.startsWith("/ajustes");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass shadow-ambient-sm flex items-center justify-between px-6">
      <LogoIcon size={34} className="text-primary" />
      {showGear && (
        <Link
          href="/ajustes"
          className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1"
        >
          Ajustes
        </Link>
      )}
    </header>
  );
}
