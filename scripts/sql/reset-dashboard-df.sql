-- =============================================================================
-- Reset da dashboard: remove dados de demonstração (ex.: São Paulo) e repovoa
-- apenas com território do Distrito Federal (Brasília e RAs).
--
-- Execute no SQL Editor do Supabase (postgres / service role).
-- Localiza a campanha por nome, slug ou perfil contendo "hellen" (ajuste abaixo).
-- Pode rodar mais de uma vez — sempre limpa e recria o pacote DF.
-- =============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_owner_id UUID;
  v_slug TEXT;
  v_l1 UUID; v_l2 UUID; v_l3 UUID; v_l4 UUID; v_l5 UUID; v_l6 UUID;
  v_c1 UUID; v_c2 UUID; v_f1 UUID; v_r1 UUID; v_j1 UUID;
  v_sup UUID;
  v_evt UUID;
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
  -- Bairros / RAs do DF (sem referências a São Paulo)
  v_hoods TEXT[] := ARRAY[
    'Ceilândia', 'Taguatinga', 'Samambaia', 'Gama', 'Planaltina',
    'Sobradinho', 'Guará', 'Riacho Fundo', 'Águas Claras', 'Asa Norte',
    'Asa Sul', 'Recanto das Emas', 'Santa Maria', 'Paranoá', 'São Sebastião'
  ];
  v_ceps TEXT[] := ARRAY[
    '72220000', '72135000', '72310000', '72405000', '73310000',
    '73010000', '71020000', '71820000', '71925000', '70863000',
    '70390000', '72640000', '72500000', '71570000', '71690000'
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
  r RECORD;
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
    RAISE EXCEPTION 'Campanha não encontrada. Ajuste o filtro ILIKE no início do script.';
  END IF;

  RAISE NOTICE 'Limpando dados operacionais do tenant % (%)…', v_tenant_id, v_slug;

  -- Ordem respeitando FKs
  DELETE FROM public.agenda_event_attendees WHERE tenant_id = v_tenant_id;
  DELETE FROM public.agenda_events WHERE tenant_id = v_tenant_id;
  DELETE FROM public.supporter_activity_events WHERE tenant_id = v_tenant_id;
  DELETE FROM public.supporter_chapa_pledges WHERE tenant_id = v_tenant_id;
  DELETE FROM public.supporter_leadership_links WHERE tenant_id = v_tenant_id;
  DELETE FROM public.demands WHERE tenant_id = v_tenant_id;
  DELETE FROM public.supporters WHERE tenant_id = v_tenant_id;
  DELETE FROM public.leadership_chapas WHERE tenant_id = v_tenant_id;
  DELETE FROM public.leaderships WHERE tenant_id = v_tenant_id;
  DELETE FROM public.activities WHERE tenant_id = v_tenant_id;
  DELETE FROM public.poll_snapshots
  WHERE tenant_id = v_tenant_id
    AND NOT (snapshot_type = 'custom' AND title = 'manual_goals');

  -- Landing alinhada ao DF
  UPDATE public.landing_pages
  SET
    headline = 'Juntos por um DF mais justo e humano',
    bio = 'Campanha focada no Distrito Federal: escuta nas RAs, presença em Ceilândia, Taguatinga, '
      || 'Samambaia e em todo o entorno. Política de verdade começa no território.',
    proposals = '[
      {"title":"Saúde nas RAs","text":"Ampliar horários de UBS e teleconsultas em Ceilândia, Samambaia e Gama."},
      {"title":"Educação integral","text":"Merenda de qualidade, reforço escolar e esporte nas escolas do DF."},
      {"title":"Mobilidade no DF","text":"Integração ônibus + metrô, iluminação e corredores seguros nas estações."},
      {"title":"Emprego e renda","text":"Feiras de empreendedorismo e qualificação nas cidades satélites."}
    ]'::jsonb,
    updated_at = now()
  WHERE tenant_id = v_tenant_id;

  -- Lideranças por região administrativa do DF
  INSERT INTO public.leaderships (tenant_id, name, region, estimated_votes, actor_type)
  VALUES
    (v_tenant_id, 'Carlos Mendonça', 'Ceilândia / Taguatinga', 480, 'regional_leader'),
    (v_tenant_id, 'Fernanda Kuhn', 'Plano Piloto', 360, 'grassroots'),
    (v_tenant_id, 'Roberto Lima', 'Gama / Recanto das Emas', 320, 'coordinator'),
    (v_tenant_id, 'Juliana Prado', 'Samambaia', 280, 'volunteer_hub'),
    (v_tenant_id, 'Elias Pereira', 'Sobradinho / Planaltina', 220, 'influencer'),
    (v_tenant_id, 'Marina Duarte', 'Águas Claras / Guará', 190, 'grassroots');

  SELECT id INTO v_l1 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Carlos Mendonça';
  SELECT id INTO v_l2 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Fernanda Kuhn';
  SELECT id INTO v_l3 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Roberto Lima';
  SELECT id INTO v_l4 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Juliana Prado';
  SELECT id INTO v_l5 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Elias Pereira';
  SELECT id INTO v_l6 FROM public.leaderships WHERE tenant_id = v_tenant_id AND name = 'Marina Duarte';

  -- Apoiadores somente no DF
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
        '619' || lpad((8800000 + i * 10 + n)::text, 7, '0'),
        lower(replace(split_part(v_names[i], ' ', 1), 'á', 'a')) || i || n || '@demo.local',
        v_hoods[1 + ((i + n) % array_length(v_hoods, 1))],
        'Brasília', 'DF',
        v_statuses[1 + ((i + n) % array_length(v_statuses, 1))],
        v_levels[1 + ((i + n) % array_length(v_levels, 1))],
        v_eng[1 + ((i + n) % array_length(v_eng, 1))],
        CASE
          WHEN (i + n) % 4 = 0 THEN 'landing'::public.supporter_source
          WHEN (i + n) % 7 = 0 THEN 'import'::public.supporter_source
          ELSE 'manual'::public.supporter_source
        END,
        CASE
          WHEN (i + n) % 6 = 0 THEN 'Conheceu a campanha em reunião na RA.'
          WHEN (i + n) % 9 = 0 THEN 'Indicado por liderança local do DF.'
          ELSE NULL
        END,
        now() - ((i * 2 + n * 3) || ' days')::interval,
        now() - ((i + n) % 21 || ' days')::interval,
        15 + ((i + n) % 85),
        now() - ((i + n) || ' days')::interval,
        'EE ' || (100 + (i % 80))::text || ' — ' || v_hoods[1 + ((i + n) % array_length(v_hoods, 1))],
        v_ceps[1 + ((i + n) % array_length(v_ceps, 1))]
      );
    END LOOP;
  END LOOP;

  -- Demandas em bairros do DF
  INSERT INTO public.demands (
    tenant_id, title, category, status, priority, neighborhood, description,
    requester_name, requester_phone, source, created_by, created_at
  ) VALUES
    (v_tenant_id, 'Buraco na QNM Ceilândia', 'infraestrutura', 'aberto', 'alta', 'Ceilândia',
     'Cratera próximo ao terminal de ônibus.', 'João da padaria', '61988776655', 'landing', v_owner_id, now() - interval '2 days'),
    (v_tenant_id, 'Falta de médico na UBS Samambaia', 'saude', 'em_andamento', 'alta', 'Samambaia',
     'Fila de 40 dias para clínico geral.', 'Maria Aparecida', '61977665544', 'manual', v_owner_id, now() - interval '5 days'),
    (v_tenant_id, 'Iluminação na W3 Sul', 'iluminacao', 'aberto', 'media', 'Asa Sul',
     'Trecho escuro; relatos de insegurança.', NULL, NULL, 'landing', v_owner_id, now() - interval '1 day'),
    (v_tenant_id, 'Merenda escolar insuficiente', 'educacao', 'em_andamento', 'alta', 'Gama',
     'Pais pedem revisão do cardápio.', 'Associação de pais', NULL, 'manual', v_owner_id, now() - interval '8 days'),
    (v_tenant_id, 'Patrulha no comércio de Taguatinga', 'seguranca', 'aberto', 'media', 'Taguatinga',
     'Comerciantes pedem ronda no horário de pico.', 'Sindicato local', NULL, 'manual', v_owner_id, now() - interval '3 days'),
    (v_tenant_id, 'Poda de árvores no Parque da Cidade', 'melhorias', 'resolvido', 'baixa', 'Asa Sul',
     'Serviço concluído com a administração.', NULL, NULL, 'manual', v_owner_id, now() - interval '20 days'),
    (v_tenant_id, 'Transporte escolar irregular', 'educacao', 'aberto', 'alta', 'Riacho Fundo',
     'Ônibus atrasando 40+ minutos.', 'Prof. Sandra', '61966554433', 'landing', v_owner_id, now() - interval '4 days'),
    (v_tenant_id, 'Calçada inacessível na Asa Norte', 'infraestrutura', 'em_andamento', 'media', 'Asa Norte',
     'Sem passagem para cadeirantes.', NULL, NULL, 'landing', v_owner_id, now() - interval '6 days'),
    (v_tenant_id, 'Coleta de lixo irregular', 'melhorias', 'aberto', 'media', 'Recanto das Emas',
     'Container quebrado há 2 semanas.', 'Moradores QE 26', NULL, 'landing', v_owner_id, now() - interval '1 day'),
    (v_tenant_id, 'Projeto esportivo comunitário', 'outros', 'resolvido', 'baixa', 'Águas Claras',
     'Parceria com academia local.', 'Coach Felipe', NULL, 'manual', v_owner_id, now() - interval '15 days'),
    (v_tenant_id, 'UPA 24h em Sobradinho', 'saude', 'aberto', 'alta', 'Sobradinho',
     'População pede plantão noturno.', 'Comunidade Sobradinho', NULL, 'landing', v_owner_id, now() - interval '2 days'),
    (v_tenant_id, 'Creche para trabalhadores', 'educacao', 'em_andamento', 'alta', 'Planaltina',
     'Filas com 200 crianças na espera.', NULL, NULL, 'manual', v_owner_id, now() - interval '10 days');

  -- Agenda no DF
  INSERT INTO public.agenda_events (
    tenant_id, title, event_date, event_time, location, neighborhood, city,
    event_type, status, description, expected_attendance, created_by
  ) VALUES
    (v_tenant_id, 'Reunião com lideranças — Ceilândia', CURRENT_DATE + 2, '19:00',
     'CRAS Ceilândia', 'Ceilândia', 'Brasília', 'reuniao', 'confirmado',
     'Alinhamento de metas e chapas na RA.', 35, v_owner_id),
    (v_tenant_id, 'Caminhada em Taguatinga', CURRENT_DATE + 5, '09:30',
     'Praça do Relógio', 'Taguatinga', 'Brasília', 'caminhada', 'agendado',
     'Ouvir demandas de comerciantes.', 50, v_owner_id),
    (v_tenant_id, 'Visita à UBS Samambaia', CURRENT_DATE + 8, '14:00',
     'UBS Samambaia Sul', 'Samambaia', 'Brasília', 'visita', 'agendado',
     'Acompanhamento da fila.', 8, v_owner_id),
    (v_tenant_id, 'Live — propostas para educação no DF', CURRENT_DATE - 3, '20:00',
     'Online (YouTube)', 'Asa Norte', 'Brasília', 'evento', 'realizado',
     '120 pessoas ao vivo.', 120, v_owner_id),
    (v_tenant_id, 'Encontro com jovens do Gama', CURRENT_DATE - 7, '18:00',
     'Centro cultural do Gama', 'Gama', 'Brasília', 'evento', 'realizado',
     'Oficina de cidadania.', 45, v_owner_id),
    (v_tenant_id, 'Café com empreendedoras', CURRENT_DATE + 1, '10:00',
     'Águas Claras Shopping', 'Águas Claras', 'Brasília', 'reuniao', 'confirmado',
     'Microcrédito e formalização.', 22, v_owner_id),
    (v_tenant_id, 'Panfletagem — metrô Águas Claras', CURRENT_DATE + 4, '17:30',
     'Estação Águas Claras', 'Águas Claras', 'Brasília', 'caminhada', 'agendado',
     'Distribuição de material e captação.', 15, v_owner_id);

  -- Pesquisas / gráficos da dashboard (somente território DF)
  INSERT INTO public.poll_snapshots (tenant_id, snapshot_type, title, data, recorded_at) VALUES
    (v_tenant_id, 'intencao_voto', 'Intenção de voto', '[
      {"candidato":"Hellen","valor":39},
      {"candidato":"Cand. A","valor":26},
      {"candidato":"Cand. B","valor":18},
      {"candidato":"Cand. C","valor":10},
      {"candidato":"Indecisos","valor":7}
    ]'::jsonb, now() - interval '3 days'),
    (v_tenant_id, 'aprovacao_bairro', 'Aprovação por bairro', '[
      {"bairro":"Ceilândia","aprovacao":72},
      {"bairro":"Taguatinga","aprovacao":68},
      {"bairro":"Samambaia","aprovacao":65},
      {"bairro":"Gama","aprovacao":61},
      {"bairro":"Asa Norte","aprovacao":74},
      {"bairro":"Asa Sul","aprovacao":70},
      {"bairro":"Águas Claras","aprovacao":67},
      {"bairro":"Sobradinho","aprovacao":58}
    ]'::jsonb, now() - interval '3 days'),
    (v_tenant_id, 'crescimento_apoiadores', 'Crescimento de apoiadores', '[
      {"mes":"Jan","apoiadores":12},
      {"mes":"Fev","apoiadores":28},
      {"mes":"Mar","apoiadores":45},
      {"mes":"Abr","apoiadores":62},
      {"mes":"Mai","apoiadores":88},
      {"mes":"Jun","apoiadores":100}
    ]'::jsonb, now() - interval '1 day');

  -- Chapas (DF)
  INSERT INTO public.leadership_chapas (tenant_id, leadership_id, name, subtitle, vote_weight, display_order, is_published)
  VALUES
    (v_tenant_id, v_l1, 'Hellen — Governadora', 'Coligação pelo DF', 1, 1, true),
    (v_tenant_id, v_l1, 'Marcos Almeida — Vice', 'Chapa Ceilândia e entorno', 1, 2, true),
    (v_tenant_id, v_l2, 'Hellen pelo Plano Piloto', 'Centro e adjacências', 1, 1, true),
    (v_tenant_id, v_l2, 'Prof. Ricardo — Educação', 'Conselho escolar DF', 1, 2, true),
    (v_tenant_id, v_l3, 'Chapa Trabalhadores Gama', 'Sindicato + comerciantes', 1, 1, true),
    (v_tenant_id, v_l4, 'Mulheres de Samambaia', 'Articulação feminista', 1, 1, true),
    (v_tenant_id, v_l5, 'Comunidade Planaltina', 'Interior do DF', 1, 1, true),
    (v_tenant_id, v_l6, 'Hellen — Águas Claras', 'Expansão sudoeste', 1, 1, true);

  SELECT id INTO v_c1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Hellen — Governadora';
  SELECT id INTO v_c2 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Marcos Almeida — Vice';
  SELECT id INTO v_f1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Hellen pelo Plano Piloto';
  SELECT id INTO v_r1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Chapa Trabalhadores Gama';
  SELECT id INTO v_j1 FROM public.leadership_chapas WHERE tenant_id = v_tenant_id AND name = 'Mulheres de Samambaia';

  INSERT INTO public.supporter_chapa_pledges (tenant_id, supporter_id, chapa_id, created_at)
  SELECT v_tenant_id, s.id, chapa_id, s.created_at + interval '2 hours'
  FROM (
    SELECT s.id, s.created_at, row_number() OVER (ORDER BY s.created_at) AS rn
    FROM public.supporters s
    WHERE s.tenant_id = v_tenant_id
  ) s
  CROSS JOIN LATERAL (
    SELECT unnest(
      CASE (s.rn % 8)
        WHEN 0 THEN ARRAY[v_c1, v_c2]
        WHEN 1 THEN ARRAY[v_c1]
        WHEN 2 THEN ARRAY[v_f1]
        WHEN 3 THEN ARRAY[v_r1]
        WHEN 4 THEN ARRAY[v_j1]
        WHEN 5 THEN ARRAY[v_c1, v_f1]
        ELSE ARRAY[]::uuid[]
      END
    ) AS chapa_id
  ) ch
  WHERE ch.chapa_id IS NOT NULL
  ON CONFLICT (supporter_id, chapa_id) DO NOTHING;

  FOR r IN SELECT id FROM public.supporters WHERE tenant_id = v_tenant_id LOOP
    PERFORM public.sync_supporter_links_from_pledges(r.id);
  END LOOP;

  SELECT id INTO v_sup FROM public.supporters
  WHERE tenant_id = v_tenant_id AND status = 'lideranca'
  ORDER BY created_at LIMIT 1;
  IF v_sup IS NOT NULL THEN
    UPDATE public.leaderships SET supporter_id = v_sup WHERE id = v_l1 AND supporter_id IS NULL;
  END IF;

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
    (v_tenant_id, '14 novos cadastros pela landing esta semana no DF', 'supporter', now() - interval '1 day'),
    (v_tenant_id, 'Demanda «Buraco na QNM Ceilândia» registrada', 'demand', now() - interval '2 days'),
    (v_tenant_id, 'Reunião com lideranças em Ceilândia confirmada', 'agenda', now() - interval '3 hours'),
    (v_tenant_id, 'Live de educação no DF: 120 participantes', 'agenda', now() - interval '3 days'),
    (v_tenant_id, 'DASHBOARD_DF_RESET', 'system', now());

  RAISE NOTICE 'Dashboard repovoada com dados do DF — tenant % (%)', v_tenant_id, v_slug;
END $$;

-- Conferência
SELECT
  t.name,
  t.slug,
  (SELECT count(*) FROM public.supporters s WHERE s.tenant_id = t.id) AS apoiadores,
  (SELECT count(DISTINCT s.neighborhood) FROM public.supporters s WHERE s.tenant_id = t.id) AS bairros_distintos,
  (SELECT count(*) FROM public.supporters s WHERE s.tenant_id = t.id AND s.city = 'Brasília' AND s.state_uf = 'DF') AS apoiadores_df,
  (SELECT count(*) FROM public.demands d WHERE d.tenant_id = t.id) AS demandas,
  (SELECT count(*) FROM public.agenda_events e WHERE e.tenant_id = t.id) AS eventos,
  (SELECT count(*) FROM public.poll_snapshots ps WHERE ps.tenant_id = t.id) AS pesquisas,
  (SELECT count(*) FROM public.leaderships l WHERE l.tenant_id = t.id) AS liderancas
FROM public.tenants t
LEFT JOIN public.profiles p ON p.id = t.owner_user_id
WHERE t.name ILIKE '%hellen%'
   OR t.slug ILIKE '%hellen%'
   OR p.full_name ILIKE '%hellen%'
ORDER BY t.created_at DESC
LIMIT 1;
