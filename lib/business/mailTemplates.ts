import type { EmployeeStatus } from "@/lib/business/aggregation";

export type MailTemplate = { subject: string; body: string };

export function buildTemplate(status: EmployeeStatus, name: string): MailTemplate | null {
  switch (status) {
    case "holiday":
      return {
        subject: "【要確認】休日出勤の交通費申請について",
        body: `${name} さん\n\n交通費精算システムより連絡いたします。\n今月の申請で、休日にご利用の記録がありました。\nお手数ですが内容に間違いがないかご確認ください。\n問題なければ返信不要です。\n\n管理部`,
      };
    case "duplicate":
      return {
        subject: "【要確認】通勤交通費の日付重複について",
        body: `${name} さん\n\n通勤交通費申請にて、往復と片道の出勤日に同じ日付のご指定がありました。\nお手数ですがどちらか一方に修正のうえ再申請をお願いいたします。\n\n管理部`,
      };
    case "heatMismatch":
      return {
        subject: "【要確認】熱中症アラート利用日について",
        body: `${name} さん\n\n熱中症アラート時の交通費申請で、通勤交通費の出勤日として登録のない日が含まれていました。\nお手数ですがご確認のうえ、必要であれば再申請をお願いいたします。\n\n管理部`,
      };
    default:
      return null;
  }
}
