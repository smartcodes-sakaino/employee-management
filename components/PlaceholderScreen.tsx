import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";

export function PlaceholderScreen({
  eyebrow,
  title,
  subtitle,
  description,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  description: string;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <Card>
        <p className="text-[13px] text-[var(--ink-muted)]">{description}</p>
        <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
          この画面は次の実装フェーズで対応予定です。仕様は機能設計書・画面設計書を参照してください。
        </p>
      </Card>
    </>
  );
}
