"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/panel");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSignedUp(true);
      }
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-primary">
            MI INFORME
          </h1>
          <div className="mt-1.5 h-0.5 w-10 bg-primary" />
          <p className="mt-4 text-sm text-on-surface-variant">
            Registro de actividad y progreso
          </p>
        </div>

        {signedUp ? (
          <div className="bg-surface-container-low p-6">
            <p className="text-sm font-medium text-on-surface">Cuenta creada</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Revisa tu correo para confirmar la cuenta y luego inicia sesión.
            </p>
            <button
              onClick={() => { setSignedUp(false); setMode("login"); }}
              className="mt-6 text-sm text-secondary underline-offset-2 hover:underline"
            >
              Iniciar sesión
            </button>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="flex mb-6 bg-surface-container-low">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                    mode === m
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {m === "login" ? "Entrar" : "Registrarse"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant outline-none focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant outline-none focus:bg-white transition-colors"
                />
              </div>

              {error && <p className="text-xs text-error">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="mt-2 bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-40 transition-opacity"
              >
                {loading
                  ? "..."
                  : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
