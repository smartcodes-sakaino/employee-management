import { getRows } from "@/lib/google/sheets";
import { fetchJapanesePublicHolidays, isHolidayDate } from "@/lib/business/holidays";

type EmployeeRow = {
  社員番号: string;
  社員コード: string;
  氏名: string;
  メールアドレス: string;
  ロール: string;
  退職日: string;
};
type CommuteAppRow = {
  申請ID: string;
  社員番号: string;
  対象月: string;
  定期券利用: string;
  定期代: string;
  片道単価: string;
  イレギュラー区分: string;
};
type CommuteDateRow = { 申請ID: string; 日: string; 種別: string };
type TripEntryRow = {
  明細ID: string;
  社員番号: string;
  対象月: string;
  日付: string;
  "片道/往復": string;
  利用料金: string;
  熱中症アラート振替: string;
};
type HeatAppRow = {
  申請ID: string;
  社員番号: string;
  対象月: string;
  "自宅~最寄り駅料金": string;
  "最寄り駅~オフィス料金": string;
};
type HeatDateRow = { 申請ID: string; 日: string };
type CompanyHolidayRow = { 日付: string };
type AggregationRow = { 社員番号: string; 対象月: string; 特記事項: string };

export type EmployeeStatus = "ok" | "pass" | "holiday" | "duplicate" | "heatMismatch" | "pending";

export type EmployeeAggregation = {
  no: string;
  code: number;
  name: string;
  commute: number | null;
  trip: number | null;
  heat: number | null;
  status: EmployeeStatus;
  specialNote: string;
};

/**
 * 全社員分の当月集計を、シートを一度だけ読み込んでメモリ上で計算する。
 * (社員数分だけAPI呼び出しを繰り返すと遅くなる/レート制限にかかるため)
 */
export async function getDashboardData(month: string): Promise<EmployeeAggregation[]> {
  const [employees, commuteApps, commuteDates, tripEntries, heatApps, heatDates, holidayRows, aggRows, publicHolidays] =
    await Promise.all([
      getRows<EmployeeRow>("社員マスタ"),
      getRows<CommuteAppRow>("通勤交通費申請"),
      getRows<CommuteDateRow>("通勤交通費申請_出勤日"),
      getRows<TripEntryRow>("外出交通費申請明細"),
      getRows<HeatAppRow>("熱中症アラート申請"),
      getRows<HeatDateRow>("熱中症アラート申請_利用日"),
      getRows<CompanyHolidayRow>("会社指定休日"),
      getRows<AggregationRow>("集計結果"),
      fetchJapanesePublicHolidays(),
    ]);

  // 休日判定は「土日 + 日本の祝日 + 会社指定休日」で統一する
  const nonWorkingDates = new Set([...holidayRows.map((h) => h.日付), ...publicHolidays]);
  const [year, m] = month.split("-").map(Number);

  const active = employees.filter((e) => !e.退職日);

  return active
    .map((emp) => {
      const commuteApp = commuteApps.find(
        (a) => a.社員番号 === emp.社員番号 && a.対象月 === month && a.イレギュラー区分 !== "TRUE"
      );

      let commuteAmount: number | null = null;
      let commuteStatus: "ok" | "pass" | "holiday" | "duplicate" | null = null;

      if (commuteApp) {
        if (commuteApp.定期券利用 === "TRUE") {
          commuteAmount = Number(commuteApp.定期代) || 0;
          commuteStatus = "pass";
        } else {
          const myDates = commuteDates.filter((d) => d.申請ID === commuteApp.申請ID);
          const oneWayDays = myDates.filter((d) => d.種別 === "one").map((d) => Number(d.日));
          const roundDays = myDates.filter((d) => d.種別 === "round").map((d) => Number(d.日));
          const duplicate = oneWayDays.some((d) => roundDays.includes(d));
          if (duplicate) {
            commuteAmount = null;
            commuteStatus = "duplicate";
          } else {
            const fee = Number(commuteApp.片道単価) || 0;
            commuteAmount = fee * oneWayDays.length + fee * 2 * roundDays.length;
            const hasHoliday = [...oneWayDays, ...roundDays].some((d) =>
              isHolidayDate(year, m, d, nonWorkingDates)
            );
            commuteStatus = hasHoliday ? "holiday" : "ok";
          }
        }
      }

      const myTripEntries = tripEntries.filter(
        (e) => e.社員番号 === emp.社員番号 && e.対象月 === month && e.熱中症アラート振替 !== "TRUE"
      );
      let tripAmount: number | null = null;
      let tripStatus: "ok" | "holiday" | null = null;
      if (myTripEntries.length > 0) {
        tripAmount = myTripEntries.reduce((sum, e) => {
          const fee = Number(e.利用料金) || 0;
          return sum + (e["片道/往復"] === "round" ? fee * 2 : fee);
        }, 0);
        const hasHoliday = myTripEntries.some((e) => {
          const day = Number(e.日付?.split("-")[2]);
          return day && isHolidayDate(year, m, day, nonWorkingDates);
        });
        tripStatus = hasHoliday ? "holiday" : "ok";
      }

      const heatApp = heatApps.find((a) => a.社員番号 === emp.社員番号 && a.対象月 === month);
      const transferredTrips = tripEntries.filter(
        (e) => e.社員番号 === emp.社員番号 && e.対象月 === month && e.熱中症アラート振替 === "TRUE"
      );
      let heatAmount: number | null = null;
      let heatStatus: "ok" | "heatMismatch" | null = null;
      if (heatApp || transferredTrips.length > 0) {
        heatAmount = 0;
        let heatUsedDays: number[] = [];
        if (heatApp) {
          const perDayFee =
            (Number(heatApp["自宅~最寄り駅料金"]) || 0) + (Number(heatApp["最寄り駅~オフィス料金"]) || 0);
          heatUsedDays = heatDates.filter((d) => d.申請ID === heatApp.申請ID).map((d) => Number(d.日));
          heatAmount += perDayFee * heatUsedDays.length;
        }
        for (const e of transferredTrips) {
          const fee = Number(e.利用料金) || 0;
          heatAmount += e["片道/往復"] === "round" ? fee * 2 : fee;
        }
        const workedDays = new Set(
          commuteApp ? commuteDates.filter((d) => d.申請ID === commuteApp.申請ID).map((d) => Number(d.日)) : []
        );
        const mismatch = heatUsedDays.some((d) => !workedDays.has(d));
        heatStatus = mismatch ? "heatMismatch" : "ok";
      }

      let status: EmployeeStatus;
      if (commuteStatus === "duplicate") status = "duplicate";
      else if (commuteStatus === "holiday" || tripStatus === "holiday") status = "holiday";
      else if (heatStatus === "heatMismatch") status = "heatMismatch";
      else if (commuteStatus === "pass") status = "pass";
      else if (!commuteApp && myTripEntries.length === 0 && !heatApp && transferredTrips.length === 0)
        status = "pending";
      else status = "ok";

      const specialNoteRow = aggRows.find((r) => r.社員番号 === emp.社員番号);

      return {
        no: emp.社員番号,
        code: Number(emp.社員コード) || 0,
        name: emp.氏名,
        commute: commuteAmount,
        trip: tripAmount,
        heat: heatAmount,
        status,
        specialNote: specialNoteRow?.特記事項 ?? "",
      };
    })
    .sort((a, b) => a.code - b.code);
}
