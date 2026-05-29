"""Gera migration P1.3c a partir da RPC canônica de relatórios."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "supabase/migrations/20260613120100_reports_leadership_link_filter.sql").read_text(
    encoding="utf-8"
)

header = """-- P1.3c: relatórios alinhados a territory_key (filtros + agregação).

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

"""

old_s = (
    "AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' "
    "OR COALESCE(s.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')"
)
new_s = (
    "AND public.supporter_matches_neighborhood_filter("
    "s.neighborhood, s.normalized_neighborhood, p_neighborhood)"
)
old_d = (
    "AND (p_neighborhood IS NULL OR trim(p_neighborhood) = '' "
    "OR COALESCE(d.neighborhood, '') ILIKE '%' || trim(p_neighborhood) || '%')"
)
new_d = (
    "AND public.demand_matches_neighborhood_filter("
    "d.neighborhood, d.normalized_neighborhood, p_neighborhood)"
)

start = src.index("CREATE OR REPLACE FUNCTION public.get_tenant_reports_summary")
end = src.index("$$;", start) + 3
fn = src[start:end]
fn = fn.replace(old_s, new_s).replace(old_d, new_d)

old_agg = """  WITH supporter_agg AS (
    SELECT
      COALESCE(NULLIF(trim(s.neighborhood), ''), 'Sem bairro') AS neighborhood,
      count(*)::int AS supporters,
      count(*) FILTER (WHERE s.support_level = 'forte')::int AS strong,
      count(*) FILTER (WHERE s.support_level = 'indeciso' OR s.status = 'indeciso')::int AS undecided,
      count(*) FILTER (WHERE s.status = 'oposicao')::int AS opposition
    FROM public.supporters s
    WHERE s.tenant_id = p_tenant_id
      AND public.supporter_matches_neighborhood_filter(s.neighborhood, s.normalized_neighborhood, p_neighborhood)
      AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
      AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
      AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
      AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
      AND (public.supporter_matches_leadership_filter(s.id, p_leadership_id))
    GROUP BY 1
  ),
  demand_agg AS (
    SELECT
      COALESCE(NULLIF(trim(d.neighborhood), ''), 'Sem bairro') AS neighborhood,
      count(*) FILTER (WHERE d.status <> 'resolvido')::int AS open_demands
    FROM public.demands d
    WHERE d.tenant_id = p_tenant_id
      AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
    GROUP BY 1
  ),
  merged AS (
    SELECT sa.*, COALESCE(da.open_demands, 0)::int AS open_demands
    FROM supporter_agg sa
    LEFT JOIN demand_agg da USING (neighborhood)
    WHERE sa.supporters > 0
  ),"""

new_agg = """  WITH supporter_agg AS (
    SELECT
      public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) AS territory_key,
      public.supporter_territory_label_row(s.neighborhood, s.normalized_neighborhood) AS territory_label,
      count(*)::int AS supporters,
      count(*) FILTER (WHERE s.support_level = 'forte')::int AS strong,
      count(*) FILTER (WHERE s.support_level = 'indeciso' OR s.status = 'indeciso')::int AS undecided,
      count(*) FILTER (WHERE s.status = 'oposicao')::int AS opposition
    FROM public.supporters s
    WHERE s.tenant_id = p_tenant_id
      AND public.supporter_matches_neighborhood_filter(s.neighborhood, s.normalized_neighborhood, p_neighborhood)
      AND (p_city IS NULL OR trim(p_city) = '' OR COALESCE(s.city, '') ILIKE '%' || trim(p_city) || '%')
      AND (p_source IS NULL OR trim(p_source) = '' OR COALESCE(s.source::text, '') = trim(p_source))
      AND (p_status IS NULL OR trim(p_status) = '' OR s.status::text = trim(p_status))
      AND (p_support_level IS NULL OR trim(p_support_level) = '' OR s.support_level::text = trim(p_support_level))
      AND (public.supporter_matches_leadership_filter(s.id, p_leadership_id))
    GROUP BY 1, 2
  ),
  demand_agg AS (
    SELECT
      public.demand_territory_key_row(d.neighborhood, d.normalized_neighborhood) AS territory_key,
      count(*) FILTER (WHERE d.status <> 'resolvido')::int AS open_demands
    FROM public.demands d
    WHERE d.tenant_id = p_tenant_id
      AND (p_assigned_to IS NULL OR d.assigned_to = p_assigned_to)
      AND public.demand_matches_neighborhood_filter(d.neighborhood, d.normalized_neighborhood, p_neighborhood)
    GROUP BY 1
  ),
  merged AS (
    SELECT
      sa.territory_key,
      sa.territory_label,
      sa.supporters,
      sa.strong,
      sa.undecided,
      sa.opposition,
      COALESCE(da.open_demands, 0)::int AS open_demands
    FROM supporter_agg sa
    LEFT JOIN demand_agg da ON da.territory_key = sa.territory_key
    WHERE sa.supporters > 0
  ),"""

if old_agg not in fn:
    raise SystemExit("supporter_agg block not found after filter replace")
fn = fn.replace(old_agg, new_agg)

fn = fn.replace(
    """  scored AS (
    SELECT
      neighborhood, supporters, open_demands,""",
    """  scored AS (
    SELECT
      territory_key, territory_label AS neighborhood, supporters, open_demands,""",
)

fn = fn.replace(
    """    'territories', (
      SELECT count(*)::int FROM (
        SELECT 1 FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id AND COALESCE(trim(s.neighborhood), '') <> ''
        GROUP BY trim(s.neighborhood)
      ) t
    ),""",
    """    'territories', (
      SELECT count(DISTINCT public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood))::int
      FROM public.supporters s
      WHERE s.tenant_id = p_tenant_id
        AND public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) <> 'Sem bairro'
    ),""",
)

fn = fn.replace(
    """    'neighborhoods', COALESCE((
      SELECT json_agg(n ORDER BY n)
      FROM (SELECT DISTINCT trim(s.neighborhood) AS n FROM public.supporters s
            WHERE s.tenant_id = p_tenant_id AND trim(COALESCE(s.neighborhood, '')) <> '') nb
    ), '[]'::json),""",
    """    'neighborhoods', COALESCE((
      SELECT json_agg(lbl ORDER BY lbl)
      FROM (
        SELECT DISTINCT public.supporter_territory_label_row(s.neighborhood, s.normalized_neighborhood) AS lbl
        FROM public.supporters s
        WHERE s.tenant_id = p_tenant_id
          AND public.supporter_territory_key_row(s.neighborhood, s.normalized_neighborhood) <> 'Sem bairro'
      ) nb
    ), '[]'::json),""",
)

out = ROOT / "supabase/migrations/20260620120000_p13c_reports_territory_keys.sql"
out.write_text(header + fn + "\n", encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size} bytes)")
