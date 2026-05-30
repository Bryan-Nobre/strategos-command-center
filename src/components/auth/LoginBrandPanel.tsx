import { POLITICAL_DECOR_ICONS } from "@/lib/political-decor-icons";

const LOGO_WHITE_LATERAL = "/brand/strategos-logo-white-lateral.png";

const decorIcons = POLITICAL_DECOR_ICONS.map((item, index) => ({
  Icon: item.Icon,
  className: `login-split__decor-icon login-split__decor-icon--${index + 1}`,
}));

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
