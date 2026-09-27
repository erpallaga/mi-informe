"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full page load (not router.push): drops the module-level caches of
    // profile/categories/progress/history so the next account never sees them.
    window.location.replace("/login");
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
