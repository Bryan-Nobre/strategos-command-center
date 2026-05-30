import {
  BarChart3,
  Building2,
  Crown,
  Flag,
  HandHeart,
  Landmark,
  MapPin,
  Megaphone,
  Scale,
  Target,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";

export type PoliticalDecorIconId =
  | "vote"
  | "landmark"
  | "map_pin"
  | "users"
  | "bar_chart"
  | "flag"
  | "crown"
  | "megaphone"
  | "hand_heart"
  | "scale"
  | "building"
  | "target";

export type PoliticalDecorIcon = {
  id: PoliticalDecorIconId;
  Icon: LucideIcon;
  label: string;
};

export const POLITICAL_DECOR_ICONS: PoliticalDecorIcon[] = [
  { id: "vote", Icon: Vote, label: "Voto" },
  { id: "landmark", Icon: Landmark, label: "Instituição" },
  { id: "map_pin", Icon: MapPin, label: "Território" },
  { id: "users", Icon: Users, label: "Mobilização" },
  { id: "bar_chart", Icon: BarChart3, label: "Pesquisas" },
  { id: "flag", Icon: Flag, label: "Bandeira" },
  { id: "crown", Icon: Crown, label: "Liderança" },
  { id: "megaphone", Icon: Megaphone, label: "Comunicação" },
  { id: "hand_heart", Icon: HandHeart, label: "Apoio" },
  { id: "scale", Icon: Scale, label: "Justiça" },
  { id: "building", Icon: Building2, label: "Cidade" },
  { id: "target", Icon: Target, label: "Metas" },
];

export const POLITICAL_DECOR_ICON_MAP = Object.fromEntries(
  POLITICAL_DECOR_ICONS.map((item) => [item.id, item]),
) as Record<PoliticalDecorIconId, PoliticalDecorIcon>;

/** Posições decorativas na landing (maior densidade que o painel de login). */
export const LANDING_POLITICAL_DECOR_LAYOUT: {
  id: PoliticalDecorIconId;
  slot: number;
}[] = [
  { id: "vote", slot: 1 },
  { id: "landmark", slot: 2 },
  { id: "map_pin", slot: 3 },
  { id: "users", slot: 4 },
  { id: "bar_chart", slot: 5 },
  { id: "flag", slot: 6 },
  { id: "crown", slot: 7 },
  { id: "megaphone", slot: 8 },
  { id: "hand_heart", slot: 9 },
  { id: "scale", slot: 10 },
  { id: "building", slot: 11 },
  { id: "target", slot: 12 },
  { id: "flag", slot: 13 },
  { id: "vote", slot: 14 },
  { id: "map_pin", slot: 15 },
  { id: "users", slot: 16 },
  { id: "megaphone", slot: 17 },
  { id: "crown", slot: 18 },
  { id: "bar_chart", slot: 19 },
  { id: "landmark", slot: 20 },
  { id: "hand_heart", slot: 21 },
  { id: "target", slot: 22 },
  { id: "building", slot: 23 },
  { id: "scale", slot: 24 },
];
