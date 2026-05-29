import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(
  path.join(ROOT, "supabase/migrations/20260613120100_reports_leadership_link_filter.sql"),
  "utf8",
);

const header = `-- P1.3c: relatórios alinhados a territory_key (filtros + agregação).

CREATE OR REPLACE FUNCTION public.demand_matches_neighborhood_filter(
  p_neighborhood TEXT,
  p_normalized_neighborhood TEXT,
  p_filter TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    p_filter IS NULL
    OR trim(p_filter) = ''
    OR public.demand_territory_key_row(p_neighborhood, p_normalized_neighborhood)
       = public.normalize_neighborhood(p_filter)
    OR COALESCE(p_neighborhood, '') ILIKE '%' || trim(p_filter) || '%';
$$;

`;

const oldS =
  "AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')";
const newS =
  "AND public.supporter_matches_neighborhood_filter(s.neighborhood, s.normalized_neighborhood, p_neighborhood)";
const oldD =
  "AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' OR COALESCE(d.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')";
const newD =
  "AND public.demand_matches_neighborhood_filter(d.neighborhood, d.normalized_neighborhood, p_neighborhood)";

const start = src.indexOf("CREATE OR REPLACE FUNCTION public.get_tenant_reports_summary");
const end = src.lastIndexOf("$$;") + 3;
let fn = src.slice(start, end);

const nl = "\r\n";
const aggStart = fn.indexOf("  WITH supporter_agg AS (");
const aggEnd = fn.indexOf("  scored AS (", aggStart);
if (aggStart < 0 || aggEnd < 0) {
  console.error("territory CTE markers not found", { aggStart, aggEnd });
  process.exit(1);
}

const newAgg = `  WITH supporter_agg AS (${nl}    SELECT${nl}
      public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) AS territory_key,${nl}
      public.supporter_territory_label_row(s.neighborhood, s.normalized_neighborhood) AS territory_label,${nl}
      count(*)::int AS supporters,${nl}
      count(*) FILTER (WHERE s.support_level = 'forte')::int AS strong,${nl}
      count(*) FILTER (WHERE s.support_level = 'indeciso' OR s.status = 'indeciso')::int AS undecided,${nl}
      count(*) FILTER (WHERE s.status = 'oposicao')::int AS opposition${nl}
    FROM public.supporters s${nl}
    WHERE s.tenant_id = p_tenant_id${nl}
      AND public.supporter_matches_neighborhood_filter(s.neighborhood, s.normalized_neighborhood, p_neighborhood)${nl}
      AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')${nl}
      AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))${nl}
      AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))${nl}
      AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))${nl}
      AND (public.supporter_matches_leadership_filter(s.id, p_leadership_id))${nl}
    GROUP BY 1, 2${nl}
  ),${nl}
  demand_agg AS (${nl}
    SELECT${nl}
      public.demand_territory_key_row(d.neighborhood, d.normalized_neighborhood) AS territory_key,${nl}
      count(*) FILTER (WHERE d.status <> 'resolvido')::int AS open_demands${nl}
    FROM public.demands d${nl}
    WHERE d.tenant_id = p_tenant_id${nl}
      AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)${nl}
      AND public.demand_matches_neighborhood_filter(d.neighborhood, d.normalized_neighborhood, p_neighborhood)${nl}
    GROUP BY 1${nl}
  ),${nl}
  merged AS (${nl}    SELECT${nl}
      sa.territory_key,${nl}
      sa.territory_label,${nl}
      sa.supporters,${nl}
      sa.strong,${nl}
      sa.undecided,${nl}
      sa.opposition,${nl}
      COALESCE(da.open_demands, 0)::int AS open_demands${nl}
    FROM supporter_agg sa${nl}
    LEFT JOIN demand_agg da ON da.territory_key = sa.territory_key${nl}
    WHERE sa.supporters > 0${nl}
  ),`;

fn = fn.slice(0, aggStart) + newAgg + fn.slice(aggEnd);
fn = fn.replaceAll(oldS, newS).replaceAll(oldD, newD);

fn = fn.replace(
  `  scored AS (
    SELECT
      neighborhood, supporters, open_demands,`,
  `  scored AS (
    SELECT
      territory_key, territory_label AS neighborhood, supporters, open_demands,`,
);

fn = fn.replace(
  `    'territories', (
      SELECT count(*)::int FROM (
        SELECT 1 FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id AND COALESCE(trim(s.neighborhood), '') <> ''
        GROUP BY trim(s.neighborhood)
      ) t
    ),`,
  `    'territories', (
      SELECT count(DISTINCT public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood))::int
      FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) <> 'Sem bairro'
    ),`,
);

fn = fn.replace(
  `    'neighborhoods', COALESCE((
      SELECT json_agg(n ORDER BY n)
      FROM (SELECT DISTINCT trim(s.neighborhood) AS n FROM public.supporters s
            WHERE s.tenant_id = p_tenant_id AND trim(COALESCE(s.neighborhood, '')) <> '') nb
    ), '[]'::json),`,
  `    'neighborhoods', COALESCE((
      SELECT json_agg(lbl ORDER BY lbl)
      FROM (
        SELECT DISTINCT public.supporter_territory_label_row(s.neighborhood, s.normalized_neighborhood) AS lbl
        FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id
          AND public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) <> 'Sem bairro'
      ) nb
    ), '[]'::json),`,
);

const out = path.join(ROOT, "supabase/migrations/20260620120000_p13c_reports_territory_keys.sql");
fs.writeFileSync(out, header + fn + "\n", "utf8");
console.log(`Wrote ${out} (${fs.statSync(out).size} bytes)`);
