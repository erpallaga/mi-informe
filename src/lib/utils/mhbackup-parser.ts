/**
 * Parser for Ministry Assistant .mhbackup files.
 *
 * The file uses a binary format with \x04-prefixed length-encoded strings.
 * Data is duplicated ~20x across sections, so entries are deduplicated by
 * their unique Unix-ms timestamp.
 *
 * Each entry contains:
 *   - Unix timestamp (ms) as 13-digit string
 *   - categoria: "servizio" | "decimali importati"
 *   - ore: h.mm (hours.minutes, NOT decimal)
 *   - AAT: always 0 — ignored
 *   - Abbuono: h.mm credit hours → mapped to "Reembolso"
 *   - studiBiblici: integer
 *   - note: free text
 */

export interface ParsedEntry {
  entry_date: string;
  predicacion_hours: number;
  reembolso_hours: number;
  cursos_biblicos: number;
  notes: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  dateRange: { from: string; to: string } | null;
  totalPredicacion: number;
  totalReembolso: number;
  totalCursos: number;
}

/**
 * Converts Ministry Assistant h.mm format to decimal hours.
 * "2.30" = 2h 30min = 2.5,  "1.45" = 1h 45min = 1.75
 */
function hmmToDecimal(raw: string): number {
  const n = parseFloat(raw);
  if (isNaN(n)) return 0;
  const hours = Math.trunc(n);
  const minutes = Math.round((n - hours) * 100);
  return Math.round((hours + minutes / 60) * 100) / 100;
}

/**
 * Converts a Unix-ms timestamp to ISO date (YYYY-MM-DD).
 */
function tsToDate(ts: string): string {
  const d = new Date(parseInt(ts, 10));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Extracts all \x04-prefixed length-encoded strings from a binary buffer.
 * Format: 0x04 + uint32LE(length) + utf8(content)
 */
function extractTokens(buf: Uint8Array): string[] {
  const tokens: string[] = [];
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const decoder = new TextDecoder();
  let i = 0;

  while (i < buf.length) {
    if (buf[i] === 0x04 && i + 5 <= buf.length) {
      const len = view.getUint32(i + 1, true); // little-endian
      if (len <= 1000 && i + 5 + len <= buf.length) {
        tokens.push(decoder.decode(new Uint8Array(buf.buffer, buf.byteOffset + i + 5, len)));
        i += 5 + len;
        continue;
      }
    }
    i++;
  }

  return tokens;
}

const TS_RE = /^\d{13}$/;

/**
 * Parses a .mhbackup ArrayBuffer and returns deduplicated activity entries.
 */
export function parseMHBackup(buffer: ArrayBuffer): ParseResult {
  const buf = new Uint8Array(buffer);
  const tokens = extractTokens(buf);
  const entries: ParsedEntry[] = [];
  const seen = new Set<string>();

  for (let j = 0; j < tokens.length; j++) {
    if (tokens[j] !== "categoria") continue;

    // Find timestamp by scanning backwards (max 5 tokens)
    let ts: string | null = null;
    for (let k = j - 1; k >= Math.max(0, j - 5); k--) {
      if (TS_RE.test(tokens[k])) {
        ts = tokens[k];
        break;
      }
    }
    if (!ts || seen.has(ts)) {
      if (ts) seen.add(ts);
      continue;
    }
    seen.add(ts);

    // "servizio" entries
    if (tokens[j + 1] === "servizio" && tokens[j + 2] === "ore") {
      const ore = tokens[j + 3];
      let abbuono = "0";
      let studi = "0";
      let note = "";

      for (let k = j + 4; k < Math.min(j + 20, tokens.length); k++) {
        if (tokens[k] === "Abbuono") abbuono = tokens[k + 1] ?? "0";
        if (tokens[k] === "studiBiblici") studi = tokens[k + 1] ?? "0";
        if (tokens[k] === "note") note = tokens[k + 1] ?? "";
      }

      const pred = hmmToDecimal(ore);
      const reem = hmmToDecimal(abbuono);
      const cb = parseInt(studi, 10) || 0;

      if (pred === 0 && reem === 0 && cb === 0) continue;

      entries.push({
        entry_date: tsToDate(ts),
        predicacion_hours: pred,
        reembolso_hours: reem,
        cursos_biblicos: cb,
        notes: note,
      });
    }

    // "decimali importati" entries (small rounding adjustments)
    if (tokens[j + 1] === "decimali importati" && tokens[j + 2] === "ore") {
      const ore = parseFloat(tokens[j + 3]);
      if (!isNaN(ore) && ore > 0) {
        entries.push({
          entry_date: tsToDate(ts),
          predicacion_hours: ore, // these ARE decimal
          reembolso_hours: 0,
          cursos_biblicos: 0,
          notes: "Ajuste importado",
        });
      }
    }
  }

  entries.sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  let totalPredicacion = 0;
  let totalReembolso = 0;
  let totalCursos = 0;
  for (const e of entries) {
    totalPredicacion += e.predicacion_hours;
    totalReembolso += e.reembolso_hours;
    totalCursos += e.cursos_biblicos;
  }

  const dateRange =
    entries.length > 0
      ? { from: entries[0].entry_date, to: entries[entries.length - 1].entry_date }
      : null;

  return {
    entries,
    dateRange,
    totalPredicacion: Math.round(totalPredicacion * 100) / 100,
    totalReembolso: Math.round(totalReembolso * 100) / 100,
    totalCursos,
  };
}
