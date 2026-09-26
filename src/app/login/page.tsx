"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoIcon from "@/components/ui/LogoIcon";

type Mode = "login" | "signup";

// Supabase auth errors come in English; translate the ones users actually hit.
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
  if (m.includes("already registered")) return "Ya existe una cuenta con este correo.";
  if (m.includes("password should be at least")) return "La contraseña es demasiado corta.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos.";
  return message;
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  // /auth/callback redirects here with ?error=auth when the email link fails.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "auth") {
      setError("El enlace de confirmación no es válido o ha caducado. Inicia sesión o regístrate de nuevo.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translateAuthError(error.message));
      } else {
        // Full page load so no client cache from a previous session survives.
        window.location.replace("/panel");
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(translateAuthError(error.message));
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
        <div className="mb-10 flex flex-col items-center text-center">
          <LogoIcon size={72} className="text-primary" />
          <h1 className="mt-5 text-2xl font-black tracking-tight text-on-surface">
            Mi Informe
          </h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">
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
                  className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ease-out ${
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
                  className="bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant outline-none focus:bg-white transition-colors ease-out"
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
                  className="bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant outline-none focus:bg-white transition-colors ease-out"
                />
              </div>

              {error && <p className="text-xs text-error">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="mt-2 bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-widest text-on-primary disabled:opacity-40 transition-opacity ease-out"
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
