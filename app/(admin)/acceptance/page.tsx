import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function AcceptancePage() {
  return (
    <PlaceholderScreen
      eyebrow="ACCEPTANCE"
      title="受付管理"
      subtitle="対象月と各申請の受付状態を管理します。"
      description="現在の受付月の設定(変更時は送信済みフラグをリセット)、通勤/外出/熱中症それぞれの受付前・受付中・締切の切り替えを実装予定。"
    />
  );
}
