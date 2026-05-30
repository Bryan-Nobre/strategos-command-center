-- Landing: cores por bloco (topo/meio/final) + ícones políticos decorativos

CREATE OR REPLACE FUNCTION public.sanitize_landing_theme(p_theme JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_bg TEXT;
  v_hero_bg TEXT;
  v_middle_bg TEXT;
  v_footer_bg TEXT;
  v_hero TEXT;
  v_photo TEXT;
BEGIN
  IF p_theme IS NULL OR jsonb_typeof(p_theme) <> 'object' THEN
    RETURN '{
      "background_color": null,
      "hero_background_color": null,
      "middle_background_color": null,
      "footer_background_color": null,
      "hero_style": "default",
      "show_graphic_elements": true,
      "show_political_icons": false,
      "photo_style": "rounded"
    }'::jsonb;
  END IF;

  v_bg := NULLIF(trim(p_theme->>'background_color'), '');
  IF v_bg IS NOT NULL AND v_bg !~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' THEN
    v_bg := NULL;
  END IF;

  v_hero_bg := NULLIF(trim(p_theme->>'hero_background_color'), '');
  IF v_hero_bg IS NOT NULL AND v_hero_bg !~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' THEN
    v_hero_bg := NULL;
  END IF;

  v_middle_bg := NULLIF(trim(p_theme->>'middle_background_color'), '');
  IF v_middle_bg IS NOT NULL AND v_middle_bg !~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' THEN
    v_middle_bg := NULL;
  END IF;

  v_footer_bg := NULLIF(trim(p_theme->>'footer_background_color'), '');
  IF v_footer_bg IS NOT NULL AND v_footer_bg !~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' THEN
    v_footer_bg := NULL;
  END IF;

  v_hero := COALESCE(p_theme->>'hero_style', 'default');
  IF v_hero NOT IN ('default', 'minimal', 'stamped') THEN
    v_hero := 'default';
  END IF;

  v_photo := COALESCE(p_theme->>'photo_style', 'rounded');
  IF v_photo NOT IN ('rounded', 'circle', 'stamped') THEN
    v_photo := 'rounded';
  END IF;

  RETURN jsonb_build_object(
    'background_color', v_bg,
    'hero_background_color', v_hero_bg,
    'middle_background_color', v_middle_bg,
    'footer_background_color', v_footer_bg,
    'hero_style', v_hero,
    'show_graphic_elements', COALESCE((p_theme->>'show_graphic_elements')::boolean, true),
    'show_political_icons', COALESCE((p_theme->>'show_political_icons')::boolean, false),
    'photo_style', v_photo
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
