export type LandingLgpdConfig = {
  controller_name: string;
  controller_cpf: string | null;
  controller_email: string | null;
  revoke_consent_url: string | null;
};

import { resolveRevokeConsentUrl } from "@/lib/landing-lgpd-routes";

export type PublicLandingLgpdSource = {
  tenant_name: string;
  display_name?: string | null;
  lgpd?: LandingLgpdConfig | null;
};

export function resolveLandingLgpdConfig(
  landing: PublicLandingLgpdSource,
  publicCode?: string,
): LandingLgpdConfig {
  const controllerName =
    landing.lgpd?.controller_name?.trim() ||
    landing.display_name?.trim() ||
    landing.tenant_name.trim() ||
    "Controlador";

  return {
    controller_name: controllerName,
    controller_cpf: landing.lgpd?.controller_cpf?.trim() || null,
    controller_email: landing.lgpd?.controller_email?.trim() || null,
    revoke_consent_url: resolveRevokeConsentUrl(landing.lgpd?.revoke_consent_url, publicCode),
  };
}

export function parseLandingLgpd(raw: unknown): LandingLgpdConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = typeof row.controller_name === "string" ? row.controller_name : "";
  if (!name.trim()) return null;
  return {
    controller_name: name.trim(),
    controller_cpf:
      typeof row.controller_cpf === "string" && row.controller_cpf.trim()
        ? row.controller_cpf.trim()
        : null,
    controller_email:
      typeof row.controller_email === "string" && row.controller_email.trim()
        ? row.controller_email.trim()
        : null,
    revoke_consent_url:
      typeof row.revoke_consent_url === "string" && row.revoke_consent_url.trim()
        ? row.revoke_consent_url.trim()
        : null,
  };
}

export type LgpdTermBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "revoke"; url: string }
  | { type: "controller"; config: LandingLgpdConfig };

/** Conteúdo do termo — base legal alinhada ao modelo fornecido pela campanha. */
export function buildLgpdTermBlocks(config: LandingLgpdConfig): LgpdTermBlock[] {
  const channels = "e-mail, telefone, SMS, WhatsApp e demais canais de comunicação";

  return [
    {
      type: "paragraph",
      text: `Eu, abaixo identificado(a), aceito e concordo com o tratamento dos meus dados pessoais e cadastrais que informei para recebimento de informações de natureza político-eleitoral. Nesse sentido, autorizo ${config.controller_name} a realizar contato comigo por meio dos canais: ${channels}.`,
    },
    {
      type: "paragraph",
      text: "Em atendimento aos preceitos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais) e demais normativas aplicáveis sobre proteção de dados pessoais, manifesto-me de forma informada, livre, expressa e consciente, autorizando o Controlador a realizar o tratamento dos meus dados pessoais e cadastrais para as finalidades e nas condições aqui estabelecidas.",
    },
    {
      type: "paragraph",
      text: "Estou ciente e de acordo que o Controlador poderá compartilhar os meus dados pessoais e cadastrais com parceiros e prestadores de serviços, restrito às funções desempenhadas por cada um e em aderência às finalidades estabelecidas neste termo.",
    },
    {
      type: "paragraph",
      text: `As finalidades do tratamento dos meus dados poderão incluir: cumprimento de obrigações contratuais, legais e regulatórias do Controlador; execução de suas atividades e prestação de serviços; oferta de produtos e serviços de meu interesse; realização de pesquisas de opinião e comunicação com o Controlador ou por seus prestadores de serviço, por meio de ${channels}.`,
    },
    {
      type: "revoke",
      url: resolveRevokeConsentUrl(config.revoke_consent_url),
    },
    {
      type: "paragraph",
      text: "Declaro e concordo que os meus dados pessoais e cadastrais poderão ser armazenados, inclusive após o término do tratamento — inclusive após a revogação do consentimento — quando necessário para cumprimento de obrigação legal ou regulatória do Controlador, ou quando os dados forem anonimizados.",
    },
    {
      type: "paragraph",
      text: config.controller_email
        ? `Estou ciente de que posso utilizar o canal de atendimento ${config.controller_email} para tirar dúvidas e/ou realizar solicitações relacionadas ao tratamento dos meus dados pessoais e cadastrais.`
        : "Estou ciente de que posso entrar em contato com o Controlador pelos canais indicados nesta página para tirar dúvidas e/ou realizar solicitações relacionadas ao tratamento dos meus dados pessoais e cadastrais.",
    },
    {
      type: "paragraph",
      text: "Declaro ter lido o conteúdo deste Termo e concordo com o tratamento dos meus dados pessoais e cadastrais aqui descrito, de forma livre e esclarecida, em observância à LGPD e às demais normativas aplicáveis.",
    },
    { type: "controller", config },
  ];
}
