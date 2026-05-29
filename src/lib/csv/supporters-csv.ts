import type { Enums } from "@/types/supabase";
import { csvEscape } from "./download";

export type SupporterCsvRow = {
  name: string;
  phone?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  support_level?: Enums<"support_level"> | null;
};

type SupporterExportRow = {
  name: string;
  phone: string | null;
  neighborhood: string | null;
  city: string | null;
  status: string;
  support_level: string;
  source?: string;
  interest?: string | null;
  tags: string[] | null;
  leadership_id: string | null;
  created_at?: string;
};

const IMPORT_HEADERS = ["nome", "telefone", "bairro", "cidade", "apoio"] as const;

export function supportersToCsv(rows: SupporterExportRow[]): string {
  const header = "nome,telefone,bairro,cidade,status,apoio,origem,interesse,tags,cadastro\n";
  const body = rows
    .map((r) =>
      [
        csvEscape(r.name),
        csvEscape(r.phone),
        csvEscape(r.neighborhood),
        csvEscape(r.city),
        csvEscape(r.status),
        csvEscape(r.support_level),
        csvEscape(r.source),
        csvEscape(r.interest),
        csvEscape((r.tags ?? []).join("; ")),
        csvEscape(r.created_at ? new Date(r.created_at).toLocaleString("pt-BR") : ""),
      ].join(","),
    )
    .join("\n");
  return header + body;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapApoioToLevel(value: string): Enums<"support_level"> {
  const v = value.toLowerCase().trim();
  if (v === "forte" || v === "strong") return "forte";
  if (v === "medio" || v === "médio" || v === "medium") return "medio";
  if (v === "fraco" || v === "weak") return "fraco";
  return "indeciso";
}

export function parseSupportersCsv(text: string): { rows: SupporterCsvRow[]; errors: string[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { rows: [], errors: ["Arquivo vazio ou sem linhas de dados."] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const colIndex = (name: string) => header.indexOf(name);

  const nameIdx = colIndex("nome");
  if (nameIdx === -1) {
    return { rows: [], errors: ["Coluna obrigatória 'nome' não encontrada."] };
  }

  const phoneIdx = colIndex("telefone");
  const bairroIdx = colIndex("bairro");
  const cityIdx = colIndex("cidade");
  const apoioIdx = colIndex("apoio");

  const rows: SupporterCsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[nameIdx]?.trim();
    if (!name) {
      errors.push(`Linha ${i + 1}: nome vazio — ignorada.`);
      continue;
    }
    rows.push({
      name,
      phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
      neighborhood: bairroIdx >= 0 ? cols[bairroIdx] || null : null,
      city: cityIdx >= 0 ? cols[cityIdx] || null : null,
      support_level: apoioIdx >= 0 ? mapApoioToLevel(cols[apoioIdx] ?? "") : "indeciso",
    });
  }

  return { rows, errors };
}

export function getSupporterImportTemplateCsv(): string {
  return `${IMPORT_HEADERS.join(",")}\nJoão Silva,11999990000,Centro,São Paulo,forte\n`;
}
