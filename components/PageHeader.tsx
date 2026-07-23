export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h1 className="text-[22px] font-bold text-[var(--ink)]">{title}</h1>
      {subtitle ? <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{subtitle}</p> : null}
    </div>
  );
}
