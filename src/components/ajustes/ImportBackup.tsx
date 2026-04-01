"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseMHBackup, type ParseResult } from "@/lib/utils/mhbackup-parser";
import { fmtHours } from "@/lib/utils/calculations";

type Stage = "idle" | "preview" | "importing" | "done" | "error";

export default function ImportBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [imported, setImported] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  async function handleFile(file: File) {
    setErrMsg("");
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMHBackup(buffer);
      if (parsed.entries.length === 0) {
        setErrMsg("No se encontraron entradas en el archivo.");
        return;
      }
      setResult(parsed);
      setStage("preview");
    } catch {
      setErrMsg("Error al leer el archivo.");
    }
  }

  function reset() {
    setStage("idle");
    setResult(null);
    setImported(0);
    setErrMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function doImport() {
    if (!result) return;
    setStage("importing");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErrMsg("No hay sesión activa.");
      setStage("error");
      return;
    }

    // Ensure "Reembolso" category exists
    let reembolsoId: string | null = null;
    const hasReembolso = result.entries.some((e) => e.reembolso_hours > 0);

    if (hasReembolso) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Reembolso")
        .limit(1);

      if (existing && existing.length > 0) {
        reembolsoId = existing[0].id;
      } else {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ user_id: user.id, name: "Reembolso", sort_order: 9999, is_active: false })
          .select("id")
          .single();

        if (!newCat) {
          setErrMsg("No se pudo crear la categoría Reembolso.");
          setStage("error");
          return;
        }
        reembolsoId = newCat.id;
      }
    }

    // Batch insert in chunks of 50
    const CHUNK = 50;
    let total = 0;

    for (let i = 0; i < result.entries.length; i += CHUNK) {
      const chunk = result.entries.slice(i, i + CHUNK);

      const rows = chunk.map((e) => {
        const otros_hours: Record<string, number> = {};
        if (e.reembolso_hours > 0 && reembolsoId) {
          otros_hours[reembolsoId] = e.reembolso_hours;
        }
        return {
          user_id: user.id,
          entry_date: e.entry_date,
          predicacion_hours: e.predicacion_hours,
          cursos_biblicos: e.cursos_biblicos,
          otros_hours,
          notes: e.notes || null,
        };
      });

      const { error } = await supabase.from("activity_entries").insert(rows);

      if (error) {
        setErrMsg(`Error en lote ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
        setStage("error");
        return;
      }

      total += chunk.length;
      setImported(total);
    }

    window.dispatchEvent(new CustomEvent("mi-informe:entry-created"));
    setStage("done");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
        Importar datos
      </p>

      {stage === "idle" && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".mhbackup"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-4 text-sm font-medium bg-surface-container-low text-on-surface transition-colors ease-out active:bg-surface-container-lowest"
          >
            Seleccionar archivo .mhbackup
          </button>
          <p className="text-xs text-on-surface-variant">
            Importa registros desde Ministry Assistant (iOS).
          </p>
        </>
      )}

      {errMsg && (
        <p className="text-xs text-error">{errMsg}</p>
      )}

      {stage === "preview" && result && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface-container-low p-4 flex flex-col gap-2">
            <Row label="Entradas" value={String(result.entries.length)} />
            <Row
              label="Rango"
              value={
                result.dateRange
                  ? `${formatShort(result.dateRange.from)} → ${formatShort(result.dateRange.to)}`
                  : "—"
              }
            />
            <Row label="Predicación" value={fmtHours(result.totalPredicacion)} />
            {result.totalReembolso > 0 && (
              <Row label="Reembolso" value={fmtHours(result.totalReembolso)} />
            )}
            <Row
              label="Total horas"
              value={fmtHours(result.totalPredicacion + result.totalReembolso)}
            />
            <Row label="Cursos bíblicos" value={String(result.totalCursos)} />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-3 text-xs font-semibold uppercase tracking-widest bg-surface-container-low text-on-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={doImport}
              className="flex-1 py-3 text-xs font-semibold uppercase tracking-widest bg-primary text-on-primary"
            >
              Importar
            </button>
          </div>
        </div>
      )}

      {stage === "importing" && (
        <div className="bg-surface-container-low p-4">
          <p className="text-sm text-on-surface">
            Importando... {imported} / {result?.entries.length ?? 0}
          </p>
        </div>
      )}

      {stage === "done" && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface-container-low p-4">
            <p className="text-sm text-on-surface">
              {imported} registros importados correctamente.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full py-3 text-xs font-semibold uppercase tracking-widest bg-surface-container-low text-on-surface-variant"
          >
            Cerrar
          </button>
        </div>
      )}

      {stage === "error" && (
        <button
          type="button"
          onClick={reset}
          className="w-full py-3 text-xs font-semibold uppercase tracking-widest bg-surface-container-low text-on-surface-variant"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatShort(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`;
}
