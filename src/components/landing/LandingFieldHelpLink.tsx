export function LandingFieldHelpLink({
  prefix,
  linkLabel,
  href,
  suffix = "",
}: {
  prefix: string;
  linkLabel: string;
  href: string;
  suffix?: string;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      {prefix}{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {linkLabel}
      </a>
      {suffix}
    </p>
  );
}
