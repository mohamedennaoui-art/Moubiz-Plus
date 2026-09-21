/**
 * Deadline engine — Moubiz Plus.
 *
 * Quarter engine   : T1..T4 boundaries for a fiscal year.
 * Due date engine  : quarter end + 15 days.
 * Exemption engine : registration date + 12 months, extended to that quarter's end.
 * Statuses         : declaration (À faire / Déclarée / En retard) and payment
 *                    (À payer / Payée / En retard).
 * Counters         : zero declarations, unpaid contributions.
 * Notification     : 30 / 15 / 7 / 3 / 1 days before due date, plus overdue.
 *
 * All dates are handled in UTC to keep server and client rendering identical.
 */

export type QuarterKey = "T1" | "T2" | "T3" | "T4";

export const QUARTERS: QuarterKey[] = ["T1", "T2", "T3", "T4"];

export type DeadlineRules = {
  version: string;
  /** Days added to the quarter end to obtain the due date. */
  dueDateOffsetDays: number;
  /** Months of exemption counted from the registration date. */
  exemptionMonths: number;
  /** Days before the due date that trigger a notification. */
  notificationDays: number[];
};

export const deadlineRules: DeadlineRules = {
  version: "2026",
  dueDateOffsetDays: 15,
  exemptionMonths: 12,
  notificationDays: [30, 15, 7, 3, 1],
};

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

export function quarterIndex(q: QuarterKey): number {
  return QUARTERS.indexOf(q);
}

/** Quarter engine: inclusive start and end dates of a quarter. */
export function quarterRange(year: number, q: QuarterKey): { start: Date; end: Date } {
  const i = quarterIndex(q);
  return { start: utc(year, i * 3, 1), end: utc(year, i * 3 + 3, 0) };
}

export function quarterOf(date: Date): QuarterKey {
  return QUARTERS[Math.floor(date.getUTCMonth() / 3)]!;
}

/** Due date engine: quarter end + 15 days. */
export function dueDateFor(year: number, q: QuarterKey, rules: DeadlineRules = deadlineRules): Date {
  const { end } = quarterRange(year, q);
  return new Date(end.getTime() + rules.dueDateOffsetDays * 86400000);
}

/** Exemption engine: registration + 12 months, rounded up to the end of that quarter. */
export function exemptionEnd(
  registrationDate: string | Date,
  rules: DeadlineRules = deadlineRules,
): Date | null {
  const reg = registrationDate instanceof Date ? registrationDate : new Date(registrationDate);
  if (!registrationDate || Number.isNaN(reg.getTime())) return null;
  const plus = utc(reg.getUTCFullYear(), reg.getUTCMonth() + rules.exemptionMonths, reg.getUTCDate());
  return quarterRange(plus.getUTCFullYear(), quarterOf(plus)).end;
}

export function isExempt(
  year: number,
  q: QuarterKey,
  registrationDate: string | Date,
  rules: DeadlineRules = deadlineRules,
): boolean {
  const limit = exemptionEnd(registrationDate, rules);
  if (!limit) return false;
  const { end, start } = quarterRange(year, q);
  const reg = registrationDate instanceof Date ? registrationDate : new Date(registrationDate);
  // Quarters entirely before registration are not obligations at all.
  if (end.getTime() < Date.UTC(reg.getUTCFullYear(), reg.getUTCMonth(), reg.getUTCDate())) {
    return true;
  }
  void start;
  return end.getTime() <= limit.getTime();
}

export type DeclarationStatus = "todo" | "declared" | "late";
export type PaymentStatus = "to_pay" | "paid" | "late";

export type QuarterEntry = {
  /** Per-quarter user record, persisted by the app. */
  declared: boolean;
  paid: boolean;
  /** Declared turnover for the quarter; 0 counts as a zero declaration. */
  turnover: number | null;
};

export const emptyEntry: QuarterEntry = { declared: false, paid: false, turnover: null };

export function daysBetween(due: Date, now: Date): number {
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / 86400000);
}

export function declarationStatus(entry: QuarterEntry, due: Date, now: Date): DeclarationStatus {
  if (entry.declared) return "declared";
  return daysBetween(due, now) < 0 ? "late" : "todo";
}

export function paymentStatus(entry: QuarterEntry, due: Date, now: Date): PaymentStatus {
  if (entry.paid) return "paid";
  return daysBetween(due, now) < 0 ? "late" : "to_pay";
}

/** Notification engine: returns the matching threshold, or "overdue", else null. */
export function notificationFor(
  due: Date,
  now: Date,
  rules: DeadlineRules = deadlineRules,
): { kind: "before"; days: number } | { kind: "overdue"; days: number } | null {
  const days = daysBetween(due, now);
  if (days < 0) return { kind: "overdue", days: Math.abs(days) };
  if (rules.notificationDays.includes(days)) return { kind: "before", days };
  return null;
}

export type QuarterObligation = {
  id: string;
  year: number;
  quarter: QuarterKey;
  start: string;
  end: string;
  dueDate: string;
  exempt: boolean;
  entry: QuarterEntry;
  declaration: DeclarationStatus;
  payment: PaymentStatus;
  daysLeft: number;
  notification: ReturnType<typeof notificationFor>;
};

export function buildYear(
  year: number,
  registrationDate: string,
  entries: Record<string, QuarterEntry> = {},
  now = new Date(),
  rules: DeadlineRules = deadlineRules,
): QuarterObligation[] {
  return QUARTERS.map((q) => {
    const id = `${year}-${q}`;
    const { start, end } = quarterRange(year, q);
    const due = dueDateFor(year, q, rules);
    const entry = entries[id] ?? emptyEntry;
    const exempt = isExempt(year, q, registrationDate, rules);
    return {
      id,
      year,
      quarter: q,
      start: start.toISOString(),
      end: end.toISOString(),
      dueDate: due.toISOString(),
      exempt,
      entry,
      declaration: declarationStatus(entry, due, now),
      payment: paymentStatus(entry, due, now),
      daysLeft: daysBetween(due, now),
      notification: exempt ? null : notificationFor(due, now, rules),
    };
  });
}

export function zeroDeclarationCount(list: QuarterObligation[]): number {
  return list.filter((o) => !o.exempt && o.entry.declared && o.entry.turnover === 0).length;
}

export function unpaidContributionCount(list: QuarterObligation[]): number {
  return list.filter((o) => !o.exempt && o.payment !== "paid").length;
}

export function nextObligation(list: QuarterObligation[]): QuarterObligation | null {
  return (
    list
      .filter((o) => !o.exempt && (o.declaration !== "declared" || o.payment !== "paid"))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
  );
}
