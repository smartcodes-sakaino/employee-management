import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      {title ? <h2 className="mb-1 text-[15px] font-bold text-[var(--ink)]">{title}</h2> : null}
      {hint ? <p className="mb-4 text-[12.5px] text-[var(--ink-muted)]">{hint}</p> : null}
      {children}
    </div>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="mb-3.5 grid grid-cols-2 gap-3.5">{children}</div>;
}

export function Field({
  label,
  span2,
  children,
}: {
  label: string;
  span2?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "col-span-2" : ""}`}>
      <label className="text-[12.5px] font-semibold text-[var(--ink-muted)]">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-[6px] border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-2 text-[14px] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[70px] ${inputClass} ${props.className ?? ""}`} />;
}

export function RadioLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--ink)] ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-[6px] bg-[var(--accent)] px-4 py-2.5 text-[13.5px] font-bold text-[var(--accent-ink)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45 ${
        props.className ?? ""
      }`}
    />
  );
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-[6px] border border-[var(--line-strong)] bg-transparent px-4 py-2.5 text-[13.5px] font-bold text-[var(--ink)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-45 ${
        props.className ?? ""
      }`}
    />
  );
}

type BannerVariant = "ok" | "warn" | "danger" | "info";

const bannerVariantClass: Record<BannerVariant, string> = {
  ok: "bg-[var(--ok-bg)] text-[var(--ok-ink)]",
  warn: "bg-[var(--warn-bg)] text-[var(--warn-ink)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger-ink)]",
  info: "bg-[var(--info-bg)] text-[var(--info-ink)]",
};

export function Banner({ variant, children }: { variant: BannerVariant; children: ReactNode }) {
  return (
    <div
      className={`mb-4 flex items-center gap-2.5 rounded-[6px] px-3.5 py-2.5 text-[13px] font-semibold ${bannerVariantClass[variant]}`}
    >
      <span className="h-2 w-2 flex-none rounded-full bg-current" />
      {children}
    </div>
  );
}

export function Chip({ variant, children }: { variant: BannerVariant | "neutral"; children: ReactNode }) {
  const cls =
    variant === "neutral"
      ? "bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--line)]"
      : bannerVariantClass[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${cls}`}>
      <span className="h-[7px] w-[7px] flex-none rounded-full bg-current" />
      {children}
    </span>
  );
}
