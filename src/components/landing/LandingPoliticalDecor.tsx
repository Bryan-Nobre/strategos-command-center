import type { CSSProperties } from "react";
import {
  LANDING_POLITICAL_DECOR_LAYOUT,
  POLITICAL_DECOR_ICON_MAP,
} from "@/lib/political-decor-icons";

export function LandingPoliticalDecor({ color }: { color?: string | null }) {
  return (
    <div
      className="landing-political-decor"
      aria-hidden
      style={
        color
          ? ({ ["--landing-icon-color" as string]: color } as CSSProperties)
          : undefined
      }
    >
      {LANDING_POLITICAL_DECOR_LAYOUT.map(({ id, slot }) => {
        const { Icon } = POLITICAL_DECOR_ICON_MAP[id];
        return (
          <Icon
            key={`${id}-${slot}`}
            className={`landing-decor-icon landing-decor-icon--${slot}`}
            strokeWidth={1.25}
          />
        );
      })}
    </div>
  );
}
