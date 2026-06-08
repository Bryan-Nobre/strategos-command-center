-- =============================================================================
-- Seed de demonstração: campanha da Hellen
-- Execute no SQL Editor do Supabase (como postgres / service role).
--
-- Localiza a campanha por nome, slug ou perfil contendo "hellen".
-- Idempotente em duas fases:
--   DEMO_SEED_V1 = base (apoiadores, demandas, agenda, pesquisas)
--   DEMO_SEED_V2 = chapas + apoios declarados + trilha política
-- Se V1 já existir, só aplica V2.
-- =============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_owner_id UUID;
  v_slug TEXT;
  v_has_v1 BOOLEAN;
  v_has_v2 BOOLEAN;
  v_l1 UUID; v_l2 UUID; v_l3 UUID; v_l4 UUID; v_l5 UUID; v_l6 UUID;
  v_sup UUID;
  v_evt UUID;
  -- Chapas Carlos (Zona Sul)
  v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID;
  -- Chapas Fernanda (Centro)
  v_f1 UUID; v_f2 UUID; v_f3 UUID;
  -- Chapas Roberto (Leste)
  v_r1 UUID; v_r2 UUID; v_r3 UUID;
  -- Chapas Juliana (Norte)
  v_j1 UUID; v_j2 UUID;
  -- Chapas Elias (Oeste)
  v_e1 UUID; v_e2 UUID; v_e3 UUID;
  v_names TEXT[] := ARRAY[
    'Ana Paula Souza', 'Bruno Mendes', 'Carla Ribeiro', 'Diego Alves', 'Eliane Costa',
    'Fábio Nunes', 'Gabriela Lima', 'Henrique Dias', 'Isabela Martins', 'João Pedro Silva',
    'Karina Oliveira', 'Lucas Ferreira', 'Mariana Santos', 'Nicolas Barbosa', 'Olivia Campos',
    'Paulo Henrique', 'Renata Gomes', 'Samuel Teixeira', 'Tatiana Rocha', 'Ulisses Pinto',
    'Vanessa Araújo', 'Wagner Lopes', 'Yasmin Freitas', 'Zeca Moura', 'Amanda Vieira',
    'Bernardo Castro', 'Camila Duarte', 'Daniel Prado', 'Eduarda Melo', 'Felipe Cardoso',
    'Gisele Moreira', 'Hugo Bastos', 'Ingrid Peixoto', 'Júlio César', 'Kelly Andrade',
    'Leandro Pires', 'Mônica Farias', 'Nelson Azevedo', 'Patrícia Rezende', 'Rafael Monteiro',
    'Silvia Nascimento', 'Thiago Rangel', 'Úrsula Campos', 'Vitor Hugo', 'Wanda Cristina',
    'Xavier Moura', 'Yuri Santana', 'Zilda Ferreira', 'Adriano Pires', 'Bianca Lopes'
  ];
  v_hoods TEXT[] := ARRAY[
    'Centro', 'Vila Mariana', 'Moema', 'Pinheiros', 'Santana',
    'Tatuapé', 'Ipiranga', 'Lapa', 'Butantã', 'Penha', 'Jabaquara', 'São Miguel'
  ];
  v_statuses public.supporter_status[] := ARRAY[
    'apoiador', 'apoiador', 'apoiador', 'interessado', 'lideranca',
    'indeciso', 'apoiador', 'interessado', 'apoiador', 'indeciso', 'oposicao'
  ];
  v_levels public.support_level[] := ARRAY[
    'forte', 'forte', 'medio', 'medio', 'fraco', 'indeciso', 'forte', 'medio', 'forte', 'indeciso', 'fraco'
  ];
  v_eng public.supporter_engagement_status[] := ARRAY[
    'hot', 'hot', 'warm', 'warm', 'cold', 'inactive', 'hot', 'warm', 'hot', 'cold', 'inactive'
  ];
  i INT;
  n INT;
BEGIN
  SELECT t.id, t.owner_user_id, t.slug
  INTO v_tenant_id, v_owner_id, v_slug
  FROM public.tenants t
  LEFT JOIN public.profiles p ON p.id = t.owner_user_id
  WHERE t.name ILIKE '%hellen%'
     OR t.slug ILIKE '%hellen%'
     OR p.full_name ILIKE '%hellen%'
  ORDER BY t.created_at DESC
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Campanha da Hellen não encontrada. Ajuste o filtro no início do script.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.activities WHERE tenant_id = v_tenant_id AND message = 'DEMO_SEED_V1'
  ) INTO v_has_v1;

  SELECT EXISTS (
    SELECT 1 FROM public.activities WHERE tenant_id = v_tenant_id AND message = 'DEMO_SEED_V2'
  ) INTO v_has_v2;

  IF v_has_v2 THEN
    RAISE NOTICE 'Demo V2 já aplicado para tenant % (%). Nada a fazer.', v_tenant_id, v_slug;
    RETURN;
  END IF;

  -- ===========================================================================
  -- FASE V1 — base operacional (pula se já existir)
  -- ===========================================================================
  IF NOT v_has_v1 THEN
    UPDATE public.tenants
    SET status = 'active', plan = 'basic', updated_at = now()
    WHERE id = v_tenant_id;

    UPDATE public.landing_pages
    SET
      display_name = 'Hellen',
      headline = 'Juntos por uma cidade mais justa e humana',
      bio = 'Sou candidata porque acredito que política de verdade começa ouvindo a comunidade. '
        || 'Minha campanha une gestão, transparência e presença no território.',
    proposals = '[
      {"title":"Saúde perto de você","text":"Ampliar horários de UBS e teleconsultas nos bairros."},
      {"title":"Educação integral","text":"Merenda de qualidade, reforço escolar e esporte nas escolas."},
      {"title":"Mobilidade e segurança","text":"Iluminação LED, câmeras comunitárias e corredores seguros."},
      {"title":"Emprego e renda","text":"Feiras de empreendedorismo e qualificação profissional local."}
    ]'::jsonb,
      is_published = true,
      updated_at = now()
    WHERE tenant_id = v_tenant_id;

    INSERT INTO public.leaderships (tenant_id, name, region, estimated_votes, actor_type)
    VALUES
      (v_tenant_id, 'Carlos Mendonça', 'Zona Sul', 520, 'regional_leader'),
      (v_tenant_id, 'Fernanda Kuhn', 'Centro', 380, 'grassroots'),
      (v_tenant_id, 'Roberto Lima', 'Zona Leste', 340, 'coordinator'),
      (v_tenant_id, 'Juliana Prado', 'Zona Norte', 260, 'volunteer_hub'),
      (v_tenant_id, 'Elias Pereira', 'Zona Oeste', 210, 'influencer'),
      (v_tenant_id, 'Marina Duarte', 'Grande ABC', 175, 'grassroots');

    FOR i IN 1..array_length(v_names, 1) LOOP
      FOR n IN 0..1 LOOP
        INSERT INTO public.supporters (
          tenant_id, name, phone, email, neighborhood, city, state_uf,
          status, support_level, engagement_status, source,
          notes, created_at, last_activity_at, activity_score, lgpd_consent_at,
          voting_place_name, cep
        ) VALUES (
          v_tenant_id,
          CASE WHEN n = 0 THEN v_names[i] ELSE v_names[i] || ' (família)' END,
          '119' || lpad((8800000 + i * 10 + n)::text, 7, '0'),
          lower(replace(split_part(v_names[i], ' ', 1), 'á', 'a')) || i || n || '@demo.local',
          v_hoods[1 + ((i + n) % array_length(v_hoods, 1))],
          'São Paulo', 'SP',
          v_statuses[1 + ((i + n) % array_length(v_statuses, 1))],
          v_levels[1 + ((i + n) % array_length(v_levels, 1))],
          v_eng[1 + ((i + n) % array_length(v_eng, 1))],
          CASE
            WHEN (i + n) % 4 = 0 THEN 'landing'::public.supporter_source
            WHEN (i + n) % 7 = 0 THEN 'import'::public.supporter_source
            ELSE 'manual'::public.supporter_source
          END,
          CASE
            WHEN (i + n) % 6 = 0 THEN 'Conheceu a campanha em reunião de bairro.'
            WHEN (i + n) % 9 = 0 THEN 'Indicado por liderança local.'
            ELSE NULL
          END,
          now() - ((i * 2 + n * 3) || ' days')::interval,
          now() - ((i + n) % 21 || ' days')::interval,
          15 + ((i + n) % 85),
          now() - ((i + n) || ' days')::interval,
          'EE ' || (100 + (i % 80))::text || ' — ' || v_hoods[1 + ((i + n) % array_length(v_hoods, 1))],
          lpad((1000000 + i * 111)::text, 8, '0')
        );
      END LOOP;
    END LOOP;

    INSERT INTO public.demands (
      tenant_id, title, category, status, priority, neighborhood, description,
      requester_name, requester_phone, source, created_by, created_at
    ) VALUES
      (v_tenant_id, 'Buraco na Av. Principal', 'infraestrutura', 'aberto', 'alta', 'Centro',
       'Cratera próxima ao ponto de ônibus.', 'João da padaria', '11988776655', 'landing', v_owner_id, now() - interval '2 days'),
      (v_tenant_id, 'Falta de médico na UBS', 'saude', 'em_andamento', 'alta', 'Penha',
       'Fila de 40 dias para clínico geral.', 'Maria Aparecida', '11977665544', 'manual', v_owner_id, now() - interval '5 days'),
      (v_tenant_id, 'Iluminação apagada na rua 7', 'iluminacao', 'aberto', 'media', 'Lapa',
       'Trecho escuro; relatos de insegurança.', NULL, NULL, 'landing', v_owner_id, now() - interval '1 day'),
      (v_tenant_id, 'Merenda escolar insuficiente', 'educacao', 'em_andamento', 'alta', 'Ipiranga',
       'Pais pedem revisão do cardápio.', 'Associação de pais', NULL, 'manual', v_owner_id, now() - interval '8 days'),
      (v_tenant_id, 'Patrulha no comércio local', 'seguranca', 'aberto', 'media', 'Tatuapé',
       'Comerciantes pedem ronda no horário de pico.', 'Sindicato local', NULL, 'manual', v_owner_id, now() - interval '3 days'),
      (v_tenant_id, 'Poda de árvores no parque', 'melhorias', 'resolvido', 'baixa', 'Moema',
       'Serviço concluído com a prefeitura.', NULL, NULL, 'manual', v_owner_id, now() - interval '20 days'),
      (v_tenant_id, 'Transporte escolar irregular', 'educacao', 'aberto', 'alta', 'Santana',
       'Ônibus atrasando 40+ minutos.', 'Prof. Sandra', '11966554433', 'landing', v_owner_id, now() - interval '4 days'),
      (v_tenant_id, 'Calçada inacessível', 'infraestrutura', 'em_andamento', 'media', 'Vila Mariana',
       'Sem passagem para cadeirantes.', NULL, NULL, 'landing', v_owner_id, now() - interval '6 days'),
      (v_tenant_id, 'Coleta de lixo irregular', 'melhorias', 'aberto', 'media', 'Butantã',
       'Container quebrado há 2 semanas.', 'Moradores rua 12', NULL, 'landing', v_owner_id, now() - interval '1 day'),
      (v_tenant_id, 'Projeto esportivo comunitário', 'outros', 'resolvido', 'baixa', 'Pinheiros',
       'Parceria com academia local.', 'Coach Felipe', NULL, 'manual', v_owner_id, now() - interval '15 days'),
      (v_tenant_id, 'UPA 24h no bairro', 'saude', 'aberto', 'alta', 'Jabaquara',
       'População pede plantão noturno.', 'Comunidade Jabaquara', NULL, 'landing', v_owner_id, now() - interval '2 days'),
      (v_tenant_id, 'Creche para trabalhadores', 'educacao', 'em_andamento', 'alta', 'São Miguel',
       'Filas com 200 crianças na espera.', NULL, NULL, 'manual', v_owner_id, now() - interval '10 days');

    INSERT INTO public.agenda_events (
      tenant_id, title, event_date, event_time, location, neighborhood, city,
      event_type, status, description, expected_attendance, created_by
    ) VALUES
      (v_tenant_id, 'Reunião com lideranças — Zona Sul', CURRENT_DATE + 2, '19:00',
       'Salão comunitário Moema', 'Moema', 'São Paulo', 'reuniao', 'confirmado',
       'Alinhamento de metas e chapas.', 35, v_owner_id),
      (v_tenant_id, 'Caminhada pelo bairro', CURRENT_DATE + 5, '09:30',
       'Praça da Penha', 'Penha', 'São Paulo', 'caminhada', 'agendado',
       'Ouvir demandas de comerciantes.', 50, v_owner_id),
      (v_tenant_id, 'Visita à UBS Central', CURRENT_DATE + 8, '14:00',
       'UBS Centro', 'Centro', 'São Paulo', 'visita', 'agendado',
       'Acompanhamento da fila.', 8, v_owner_id),
      (v_tenant_id, 'Live — propostas para educação', CURRENT_DATE - 3, '20:00',
       'Online (YouTube)', 'Centro', 'São Paulo', 'evento', 'realizado',
       '120 pessoas ao vivo.', 120, v_owner_id),
      (v_tenant_id, 'Encontro com jovens', CURRENT_DATE - 7, '18:00',
       'Centro cultural Tatuapé', 'Tatuapé', 'São Paulo', 'evento', 'realizado',
       'Oficina de cidadania.', 45, v_owner_id),
      (v_tenant_id, 'Café com empreendedoras', CURRENT_DATE + 1, '10:00',
       'Coworking Pinheiros', 'Pinheiros', 'São Paulo', 'reuniao', 'confirmado',
       'Microcrédito e formalização.', 22, v_owner_id),
      (v_tenant_id, 'Panfletagem — metrô Santana', CURRENT_DATE + 4, '17:30',
       'Estação Santana', 'Santana', 'São Paulo', 'caminhada', 'agendado',
       'Distribuição de material e captação.', 15, v_owner_id);

    DELETE FROM public.poll_snapshots WHERE tenant_id = v_tenant_id;

    INSERT INTO public.poll_snapshots (tenant_id, snapshot_type, title, data, recorded_at) VALUES
      (v_tenant_id, 'intencao_voto', 'Intenção de voto', '[
        {"candidato":"Hellen","valor":41},
        {"candidato":"Cand. A","valor":24},
        {"candidato":"Cand. B","valor":17},
        {"candidato":"Cand. C","valor":11},
        {"candidato":"Indecisos","valor":7}
      ]'::jsonb, now() - interval '3 days'),
      (v_tenant_id, 'aprovacao_bairro', 'Aprovação por bairro', '[
        {"bairro":"Centro","aprovacao":74},
        {"bairro":"Moema","aprovacao":68},
        {"bairro":"Vila Mariana","aprovacao":71},
        {"bairro":"Pinheiros","aprovacao":63},
        {"bairro":"Santana","aprovacao":59},
        {"bairro":"Tatuapé","aprovacao":66},
        {"bairro":"Penha","aprovacao":57},
        {"bairro":"Jabaquara","aprovacao":61}
      ]'::jsonb, now() - interval '3 days'),
      (v_tenant_id, 'crescimento_apoiadores', 'Crescimento de apoiadores', '[
        {"mes":"Jan","apoiadores":18},
        {"mes":"Fev","apoiadores":42},
        {"mes":"Mar","apoiadores":68},
        {"mes":"Abr","apoiadores":89},
        {"mes":"Mai","apoiadores":102},
        {"mes":"Jun","apoiadores":100}
      ]'::jsonb, now() - interval '1 day');

    INSERT INTO public.activities (tenant_id, message, entity_type, created_at) VALUES
      (v_tenant_id, '18 novos cadastros pela landing esta semana', 'supporter', now() - interval '1 day'),
      (v_tenant_id, 'Demanda «Buraco na Av. Principal» registrada', 'demand', now() - interval '2 days'),
      (v_tenant_id, 'Reunião com lideranças confirmada', 'agenda', now() - interval '3 hours'),
      (v_tenant_id, 'Live de educação: 120 participantes', 'agenda', now() - interval '3 days'),
      (v_tenant_id, 'DEMO_SEED_V1', 'system', now());

    RAISE NOTICE 'Demo V1 aplicado para tenant %', v_tenant_id;
  END IF;

  -- ===========================================================================
  -- FASE V2 — chapas, apoios declarados e trilha política
  -- ===========================================================================

  SELECT id INTO v_l1 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Carlos Mendonça';
  SELECT id INTO v_l2 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Fernanda Kuhn';
  SELECT id INTO v_l3 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Roberto Lima';
  SELECT id INTO v_l4 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Juliana Prado';
  SELECT id INTO v_l5 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Elias Pereira';
  SELECT id INTO v_l6 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Marina Duarte';

  -- Lideranças extras se V1 antigo só tinha 4
  IF v_l5 IS NULL THEN
    INSERT INTO public.leaderships (tenant_id, name, region, estimated_votes, actor_type)
    VALUES (v_tenant_id, 'Elias Pereira', 'Zona Oeste', 210, 'influencer')
    RETURNING id INTO v_l5;
  END IF;
  IF v_l6 IS NULL THEN
    INSERT INTO public.leaderships (tenant_id, name, region, estimated_votes, actor_type)
    VALUES (v_tenant_id, 'Marina Duarte', 'Grande ABC', 175, 'grassroots')
    RETURNING id INTO v_l6;
  END IF;

  -- Metas revisadas para refletir volume de apoios
  UPDATE public.leaderships SET estimated_votes = 520 WHERE id = v_l1;
  UPDATE public.leaderships SET estimated_votes = 380 WHERE id = v_l2;
  UPDATE public.leaderships SET estimated_votes = 340 WHERE id = v_l3;
  UPDATE public.leaderships SET estimated_votes = 260 WHERE id = v_l4;
  UPDATE public.leaderships SET estimated_votes = 210 WHERE id = v_l5;
  UPDATE public.leaderships SET estimated_votes = 175 WHERE id = v_l6;

  -- Chapas por liderança (mix publicadas / rascunho / pesos variados)
  IF NOT EXISTS (SELECT 1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id LIMIT 1) THEN
    INSERT INTO public.leadership_chapas (tenant_id, leadership_id, name, subtitle, vote_weight, display_order, is_published)
    VALUES
      (v_tenant_id, v_l1, 'Hellen — Prefeita', 'Coligação Unidade Popular', 1, 1, true),
      (v_tenant_id, v_l1, 'Marcos Almeida — Vice', 'Chapa completa Zona Sul', 1, 2, true),
      (v_tenant_id, v_l1, 'Sandra Ruiz — Dep. Estadual', 'Saúde e educação', 1, 3, true),
      (v_tenant_id, v_l1, 'André Costa — Dep. Federal', 'Recursos para o município', 2, 4, true),
      (v_tenant_id, v_l1, 'Coligação vereadores Sul', 'Rascunho — 8 vagas', 1, 5, false),

      (v_tenant_id, v_l2, 'Hellen pela cidade', 'Centro e adjacências', 1, 1, true),
      (v_tenant_id, v_l2, 'Prof. Ricardo — Educação', 'Conselho escolar ativo', 1, 2, true),
      (v_tenant_id, v_l2, 'Dra. Lúcia — Saúde', 'Médica da família', 1, 3, true),

      (v_tenant_id, v_l3, 'Chapa Trabalhadores Tatuapé', 'Sindicato + comerciantes', 1, 1, true),
      (v_tenant_id, v_l3, 'Juventude Zona Leste', 'Coletivo 18–30', 1, 2, true),
      (v_tenant_id, v_l3, 'Segurança nos bairros', 'Conselho comunitário', 2, 3, true),

      (v_tenant_id, v_l4, 'Mulheres do Norte', 'Articulação feminista', 1, 1, true),
      (v_tenant_id, v_l4, 'Idosos ativos', 'Centro de convivência', 1, 2, true),

      (v_tenant_id, v_l5, 'Comunidade evangélica Oeste', 'Pastor Elias', 1, 1, true),
      (v_tenant_id, v_l5, 'Empreendedores Butantã', 'Pequenos negócios', 1, 2, true),
      (v_tenant_id, v_l5, 'Meio ambiente Lapa', 'Parques e arborização', 1, 3, false),

      (v_tenant_id, v_l6, 'Hellen — ABC', 'Expansão metropolitana', 1, 1, true),
      (v_tenant_id, v_l6, 'Transporte metropolitano', 'Integração trem + ônibus', 2, 2, true);
  END IF;

  SELECT id INTO v_c1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Hellen — Prefeita';
  SELECT id INTO v_c2 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Marcos Almeida — Vice';
  SELECT id INTO v_c3 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Sandra Ruiz — Dep. Estadual';
  SELECT id INTO v_c4 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'André Costa — Dep. Federal';
  SELECT id INTO v_f1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Hellen pela cidade';
  SELECT id INTO v_f2 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Prof. Ricardo — Educação';
  SELECT id INTO v_f3 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Dra. Lúcia — Saúde';
  SELECT id INTO v_r1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Chapa Trabalhadores Tatuapé';
  SELECT id INTO v_r2 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Juventude Zona Leste';
  SELECT id INTO v_r3 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Segurança nos bairros';
  SELECT id INTO v_j1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Mulheres do Norte';
  SELECT id INTO v_j2 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Idosos ativos';
  SELECT id INTO v_e1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Comunidade evangélica Oeste';
  SELECT id INTO v_e2 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Empreendedores Butantã';
  SELECT id INTO v_e3 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Meio ambiente Lapa';
  SELECT id INTO v_l6 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Marina Duarte';

  -- Apoios declarados (trigger sincroniza supporter_leadership_links)
  -- Padrão: ~65% dos apoiadores com 1–3 chapas; pesos somam na meta
  INSERT INTO public.supporter_chapa_pledges (tenant_id, supporter_id, chapa_id, created_at)
  SELECT v_tenant_id, s.id, chapa_id, s.created_at + interval '2 hours'
  FROM (
    SELECT s.id, s.created_at, row_number() OVER (ORDER BY s.created_at) AS rn
    FROM public.supporters s
    WHERE s.tenant_id = v_tenant_id
  ) s
  CROSS JOIN LATERAL (
    SELECT unnest(
      CASE (s.rn % 10)
        WHEN 0 THEN ARRAY[v_c1, v_c2, v_c4]                    -- chapa completa Sul
        WHEN 1 THEN ARRAY[v_c1]                                  -- só prefeita
        WHEN 2 THEN ARRAY[v_f1, v_f2]                            -- Centro educação
        WHEN 3 THEN ARRAY[v_r1, v_r3]                              -- Leste trabalho + segurança
        WHEN 4 THEN ARRAY[v_j1]                                  -- Norte mulheres
        WHEN 5 THEN ARRAY[v_c1, v_f1]                            -- cross-região
        WHEN 6 THEN ARRAY[v_e1, v_e2]                            -- Oeste
        WHEN 7 THEN ARRAY[v_r2]                                  -- juventude
        WHEN 8 THEN ARRAY[v_f3, v_c3, v_j2]                      -- multi-tema
        ELSE ARRAY[]::uuid[]                                     -- sem apoio (35%)
      END
    ) AS chapa_id
  ) ch
  WHERE ch.chapa_id IS NOT NULL
  ON CONFLICT (supporter_id, chapa_id) DO NOTHING;

  -- Apoios extras em chapas do ABC (Marina)
  INSERT INTO public.supporter_chapa_pledges (tenant_id, supporter_id, chapa_id, created_at)
  SELECT v_tenant_id, s.id, c.id, now() - ((s.rn % 20) || ' days')::interval
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at) AS rn
    FROM public.supporters WHERE tenant_id = v_tenant_id
  ) s
  CROSS JOIN public.leadership_chapas c
  WHERE c.tenant_id = v_tenant_id
    AND c.leadership_id = v_l6
    AND c.is_published = true
    AND s.rn % 8 = 0
  ON CONFLICT (supporter_id, chapa_id) DO NOTHING;

  -- Vínculos manuais secundários (assigned) — rede cruzada além dos pledges
  INSERT INTO public.supporter_leadership_links (
    tenant_id, supporter_id, leadership_id, relationship_type, weight, is_primary, source
  )
  SELECT
    v_tenant_id, s.id, l.id, 'assigned'::public.supporter_leadership_relationship,
    1, false, 'manual'::public.supporter_leadership_link_source
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at) AS rn
    FROM public.supporters WHERE tenant_id = v_tenant_id
  ) s
  JOIN public.leaderships l ON l.tenant_id = v_tenant_id
  WHERE s.rn % 11 = 0
    AND l.id <> COALESCE(
      (SELECT leadership_id FROM public.supporter_leadership_links
       WHERE supporter_id = s.id AND is_primary = true LIMIT 1),
      '00000000-0000-0000-0000-000000000000'::uuid
    )
  ON CONFLICT (supporter_id, leadership_id) DO NOTHING;

  -- Liderança ↔ apoiador titular
  SELECT id INTO v_sup FROM public.supporters
  WHERE tenant_id = v_tenant_id AND status = 'lideranca'
  ORDER BY created_at LIMIT 1;
  IF v_sup IS NOT NULL THEN
    UPDATE public.leaderships SET supporter_id = v_sup WHERE id = v_l1 AND supporter_id IS NULL;
  END IF;

  -- Trilha de atividade (apoios e cadastros)
  INSERT INTO public.supporter_activity_events (
    tenant_id, supporter_id, leadership_id, event_type, event_source, metadata, created_at
  )
  SELECT
    v_tenant_id,
    p.supporter_id,
    c.leadership_id,
    'pledge_added'::public.supporter_activity_event_type,
    CASE WHEN s.source = 'landing' THEN 'landing'::public.supporter_activity_event_source
         ELSE 'crm'::public.supporter_activity_event_source END,
    jsonb_build_object('chapa_id', p.chapa_id, 'chapa_name', c.name, 'vote_weight', c.vote_weight),
    p.created_at
  FROM public.supporter_chapa_pledges p
  JOIN public.leadership_chapas c ON c.id = p.chapa_id
  JOIN public.supporters s ON s.id = p.supporter_id
  WHERE p.tenant_id = v_tenant_id
    AND NOT EXISTS (
      SELECT 1 FROM public.supporter_activity_events e
      WHERE e.supporter_id = p.supporter_id
        AND e.event_type = 'pledge_added'
        AND e.metadata->>'chapa_id' = p.chapa_id::text
    );

  INSERT INTO public.supporter_activity_events (
    tenant_id, supporter_id, event_type, event_source, metadata, created_at
  )
  SELECT
    v_tenant_id, s.id,
    CASE s.source
      WHEN 'landing' THEN 'landing_signup'::public.supporter_activity_event_type
      WHEN 'import' THEN 'imported'::public.supporter_activity_event_type
      ELSE 'manual_created'::public.supporter_activity_event_type
    END,
    CASE s.source
      WHEN 'landing' THEN 'landing'::public.supporter_activity_event_source
      WHEN 'import' THEN 'import'::public.supporter_activity_event_source
      ELSE 'manual'::public.supporter_activity_event_source
    END,
    jsonb_build_object('neighborhood', s.neighborhood),
    s.created_at
  FROM public.supporters s
  WHERE s.tenant_id = v_tenant_id
    AND NOT EXISTS (
      SELECT 1 FROM public.supporter_activity_events e
      WHERE e.supporter_id = s.id AND e.event_type IN ('landing_signup', 'imported', 'manual_created')
    )
  LIMIT 60;

  -- Participantes em eventos da agenda
  SELECT id INTO v_evt FROM public.agenda_events
  WHERE tenant_id = v_tenant_id AND title LIKE 'Reunião com lideranças%'
  LIMIT 1;

  IF v_evt IS NOT NULL THEN
    INSERT INTO public.agenda_event_attendees (tenant_id, event_id, supporter_id, role, status)
    SELECT
      v_tenant_id, v_evt, s.id,
      CASE WHEN s.rn % 5 = 0 THEN 'lideranca'::public.agenda_attendee_role ELSE 'convidado'::public.agenda_attendee_role END,
      CASE WHEN s.rn % 3 = 0 THEN 'confirmado'::public.agenda_attendee_status ELSE 'convidado'::public.agenda_attendee_status END
    FROM (
      SELECT id, row_number() OVER (ORDER BY activity_score DESC) AS rn
      FROM public.supporters WHERE tenant_id = v_tenant_id
    ) s
    WHERE s.rn <= 12
    ON CONFLICT (event_id, supporter_id) DO NOTHING;
  END IF;

  INSERT INTO public.activities (tenant_id, message, entity_type, created_at) VALUES
    (v_tenant_id, '17 chapas cadastradas nas lideranças regionais', 'leadership', now() - interval '2 hours'),
    (v_tenant_id, 'Carlos Mendonça: chapa completa com 89 apoios declarados', 'leadership', now() - interval '1 day'),
    (v_tenant_id, 'Roberto Lima superou 70% da meta de associados', 'leadership', now() - interval '2 days'),
    (v_tenant_id, 'DEMO_SEED_V2', 'system', now());

  RAISE NOTICE 'Demo V2 (chapas) aplicado — tenant % (slug: %)', v_tenant_id, v_slug;
END $$;

-- Conferência
SELECT
  t.name,
  t.slug,
  (SELECT count(*) FROM public.supporters s WHERE s.tenant_id = t.id) AS apoiadores,
  (SELECT count(*) FROM public.leaderships l WHERE l.tenant_id = t.id) AS liderancas,
  (SELECT count(*) FROM public.leadership_chapas c WHERE c.tenant_id = t.id) AS chapas,
  (SELECT count(*) FROM public.leadership_chapas c WHERE c.tenant_id = t.id AND c.is_published) AS chapas_publicadas,
  (SELECT count(*) FROM public.supporter_chapa_pledges p WHERE p.tenant_id = t.id) AS apoios_chapa,
  (SELECT count(*) FROM public.supporter_leadership_links l WHERE l.tenant_id = t.id) AS vinculos_politicos,
  (SELECT coalesce(sum(c.vote_weight), 0)::int
   FROM public.supporter_chapa_pledges p
   JOIN public.leadership_chapas c ON c.id = p.chapa_id
   WHERE p.tenant_id = t.id) AS votos_ponderados_total
FROM public.tenants t
LEFT JOIN public.profiles p ON p.id = t.owner_user_id
WHERE t.name ILIKE '%hellen%'
   OR t.slug ILIKE '%hellen%'
   OR p.full_name ILIKE '%hellen%'
ORDER BY t.created_at DESC
LIMIT 1;
