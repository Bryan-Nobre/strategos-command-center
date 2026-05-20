export const eleitoresMock = [
  { id: 1, nome: "Ana Carolina Silva", telefone: "(11) 98765-4321", bairro: "Centro", cidade: "São Paulo", zona: "032", secao: "0145", apoio: "Forte", obs: "Liderança comunitária" },
  { id: 2, nome: "Bruno Henrique Costa", telefone: "(11) 99812-3344", bairro: "Vila Madalena", cidade: "São Paulo", zona: "018", secao: "0210", apoio: "Médio", obs: "—" },
  { id: 3, nome: "Carla Mendes Oliveira", telefone: "(11) 97654-8821", bairro: "Pinheiros", cidade: "São Paulo", zona: "018", secao: "0188", apoio: "Forte", obs: "Cabo eleitoral" },
  { id: 4, nome: "Diego Almeida Souza", telefone: "(11) 98123-5566", bairro: "Tatuapé", cidade: "São Paulo", zona: "045", secao: "0099", apoio: "Indeciso", obs: "—" },
  { id: 5, nome: "Eduarda Lima", telefone: "(11) 99988-2211", bairro: "Mooca", cidade: "São Paulo", zona: "045", secao: "0112", apoio: "Forte", obs: "Participa de reuniões" },
  { id: 6, nome: "Felipe Rocha", telefone: "(11) 97712-3300", bairro: "Santana", cidade: "São Paulo", zona: "008", secao: "0067", apoio: "Médio", obs: "—" },
  { id: 7, nome: "Gabriela Nunes", telefone: "(11) 98800-9911", bairro: "Ipiranga", cidade: "São Paulo", zona: "276", secao: "0231", apoio: "Fraco", obs: "—" },
  { id: 8, nome: "Henrique Pereira", telefone: "(11) 99221-7788", bairro: "Lapa", cidade: "São Paulo", zona: "001", secao: "0044", apoio: "Forte", obs: "Mobiliza região" },
];

export const liderancasMock = [
  { id: 1, nome: "Marcos Vieira", regiao: "Zona Sul", votos: 1240, apoiadores: 86, crescimento: 12.4 },
  { id: 2, nome: "Patrícia Andrade", regiao: "Zona Norte", votos: 980, apoiadores: 72, crescimento: 8.7 },
  { id: 3, nome: "Rafael Monteiro", regiao: "Zona Leste", votos: 1560, apoiadores: 104, crescimento: 18.2 },
  { id: 4, nome: "Juliana Castro", regiao: "Zona Oeste", votos: 720, apoiadores: 51, crescimento: -2.1 },
  { id: 5, nome: "Thiago Barros", regiao: "Centro", votos: 1820, apoiadores: 132, crescimento: 22.5 },
  { id: 6, nome: "Larissa Fontes", regiao: "Zona Sul", votos: 640, apoiadores: 47, crescimento: 5.3 },
];

export const demandasMock = {
  aberto: [
    { id: 1, titulo: "Iluminação Rua das Acácias", categoria: "Iluminação", bairro: "Centro", prioridade: "Alta" },
    { id: 2, titulo: "Posto de saúde sem médicos", categoria: "Saúde", bairro: "Tatuapé", prioridade: "Alta" },
    { id: 3, titulo: "Buracos na Av. Brasil", categoria: "Infraestrutura", bairro: "Mooca", prioridade: "Média" },
  ],
  andamento: [
    { id: 4, titulo: "Reforma escola municipal", categoria: "Educação", bairro: "Santana", prioridade: "Alta" },
    { id: 5, titulo: "Praça pública abandonada", categoria: "Infraestrutura", bairro: "Lapa", prioridade: "Média" },
  ],
  resolvido: [
    { id: 6, titulo: "Coleta de lixo restabelecida", categoria: "Infraestrutura", bairro: "Pinheiros", prioridade: "Média" },
    { id: 7, titulo: "Semáforo consertado", categoria: "Infraestrutura", bairro: "Ipiranga", prioridade: "Baixa" },
  ],
};

export const agendaMock = [
  { id: 1, titulo: "Reunião com lideranças do Centro", data: "2026-05-22", hora: "09:00", local: "Sede do mandato", tipo: "Reunião" },
  { id: 2, titulo: "Caminhada Vila Madalena", data: "2026-05-23", hora: "16:00", local: "Praça Benedito Calixto", tipo: "Caminhada" },
  { id: 3, titulo: "Visita ao posto de saúde", data: "2026-05-24", hora: "10:30", local: "UBS Tatuapé", tipo: "Visita" },
  { id: 4, titulo: "Comício Zona Leste", data: "2026-05-26", hora: "19:00", local: "Quadra do bairro", tipo: "Evento" },
  { id: 5, titulo: "Reunião de equipe", data: "2026-05-27", hora: "14:00", local: "Sede", tipo: "Reunião" },
];

export const crescimentoApoiadores = [
  { mes: "Jan", apoiadores: 1240 }, { mes: "Fev", apoiadores: 1480 }, { mes: "Mar", apoiadores: 1820 },
  { mes: "Abr", apoiadores: 2160 }, { mes: "Mai", apoiadores: 2640 }, { mes: "Jun", apoiadores: 3120 },
  { mes: "Jul", apoiadores: 3680 }, { mes: "Ago", apoiadores: 4210 }, { mes: "Set", apoiadores: 4890 },
];

export const intencaoVoto = [
  { candidato: "Você", valor: 38 },
  { candidato: "Cand. B", valor: 26 },
  { candidato: "Cand. C", valor: 18 },
  { candidato: "Cand. D", valor: 11 },
  { candidato: "Indecisos", valor: 7 },
];

export const aprovacaoBairro = [
  { bairro: "Centro", aprovacao: 72 },
  { bairro: "Sul", aprovacao: 64 },
  { bairro: "Norte", aprovacao: 58 },
  { bairro: "Leste", aprovacao: 81 },
  { bairro: "Oeste", aprovacao: 49 },
];

export const atividadesRecentes = [
  { id: 1, texto: "Nova liderança cadastrada: Thiago Barros", tempo: "há 5 min" },
  { id: 2, texto: "Demanda 'Iluminação Rua das Acácias' foi aberta", tempo: "há 22 min" },
  { id: 3, texto: "12 novos apoiadores no bairro Centro", tempo: "há 1 h" },
  { id: 4, texto: "Evento 'Caminhada Vila Madalena' agendado", tempo: "há 3 h" },
  { id: 5, texto: "Pesquisa de intenção atualizada", tempo: "há 6 h" },
];
