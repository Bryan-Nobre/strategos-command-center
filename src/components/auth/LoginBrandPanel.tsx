import {
  BarChart3,
  Crown,
  Flag,
  Landmark,
  MapPin,
  Megaphone,
  Users,
  Vote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const LOGO_WHITE_LATERAL = "/brand/strategos-logo-white-lateral.png";

type DecorIcon = {
  Icon: LucideIcon;
  className: string;
};

const decorIcons: DecorIcon[] = [
  { Icon: Vote, className: "login-split__decor-icon login-split__decor-icon--1" },
  { Icon: Landmark, className: "login-split__decor-icon login-split__decor-icon--2" },
  { Icon: MapPin, className: "login-split__decor-icon login-split__decor-icon--3" },
  { Icon: Users, className: "login-split__decor-icon login-split__decor-icon--4" },
  { Icon: BarChart3, className: "login-split__decor-icon login-split__decor-icon--5" },
  { Icon: Flag, className: "login-split__decor-icon login-split__decor-icon--6" },
  { Icon: Crown, className: "login-split__decor-icon login-split__decor-icon--7" },
  { Icon: Megaphone, className: "login-split__decor-icon login-split__decor-icon--8" },
];

export function LoginBrandPanel() {
  return (
    <aside className="login-split__brand">
      <div className="login-split__brand-decor" aria-hidden>
        {decorIcons.map(({ Icon, className }) => (
          <Icon key={className} className={className} strokeWidth={1.25} />
        ))}
      </div>

      <div className="login-split__brand-inner">
        <img
          src={LOGO_WHITE_LATERAL}
          alt="Strategos CRM"
          className="login-split__brand-logo"
          width={400}
          height={150}
          decoding="async"
        />
      </div>
    </aside>
  );
}
