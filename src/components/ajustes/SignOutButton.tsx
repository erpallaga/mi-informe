"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full py-4 text-sm font-semibold uppercase tracking-widest text-error bg-surface-container-low transition-opacity ease-out"
    >
      Cerrar sesión
    </button>
  );
}
