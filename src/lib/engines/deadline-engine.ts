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

const dayOf = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

function parseDate(value: string | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return !value || Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A quarter is an obligation only when it starts on or after the registration
 * date. Periods running before the registration date never create obligations.
 */
export function hasObligation(year: number, q: QuarterKey, registrationDate: string | Date): boolean {
  const reg = parseDate(registrationDate);
  if (!reg) return false;
  const { start } = quarterRange(year, q);
  return dayOf(start) >= dayOf(reg);
}

/**
 * Payment exemption: registration + 12 months, extended to the end of that
 * quarter. The declaration always stays required — only the payment is exempt.
 */
export function isPaymentExempt(
  year: number,
  q: QuarterKey,
  registrationDate: string | Date,
  rules: DeadlineRules = deadlineRules,
): boolean {
  const limit = exemptionEnd(registrationDate, rules);
  if (!limit) return false;
  const { end } = quarterRange(year, q);
  return dayOf(end) <= dayOf(limit);
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
  /** Payment is exempt during the exemption window; declaration stays required. */
  paymentExempt: boolean;
  declarationRequired: true;
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
  return QUARTERS.filter((q) => hasObligation(year, q, registrationDate)).map((q) => {
    const id = `${year}-${q}`;
    const { start, end } = quarterRange(year, q);
    const due = dueDateFor(year, q, rules);
    const entry = entries[id] ?? emptyEntry;
    const paymentExempt = isPaymentExempt(year, q, registrationDate, rules);
    return {
      id,
      year,
      quarter: q,
      start: start.toISOString(),
      end: end.toISOString(),
      dueDate: due.toISOString(),
      paymentExempt,
      declarationRequired: true as const,
      entry,
      declaration: declarationStatus(entry, due, now),
      payment: paymentExempt ? "paid" : paymentStatus(entry, due, now),
      daysLeft: daysBetween(due, now),
      notification: notificationFor(due, now, rules),
    };
  });
}

/** Builds several consecutive years of obligations, ordered by due date. */
export function buildRange(
  fromYear: number,
  toYear: number,
  registrationDate: string,
  entries: Record<string, QuarterEntry> = {},
  now = new Date(),
  rules: DeadlineRules = deadlineRules,
): QuarterObligation[] {
  const out: QuarterObligation[] = [];
  for (let y = fromYear; y <= toYear; y++) out.push(...buildYear(y, registrationDate, entries, now, rules));
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function zeroDeclarationCount(list: QuarterObligation[]): number {
  return list.filter((o) => o.entry.declared && o.entry.turnover === 0).length;
}

export function unpaidContributionCount(list: QuarterObligation[]): number {
  return list.filter((o) => !o.paymentExempt && o.payment !== "paid").length;
}

/** Longest trailing run of declared quarters whose turnover is zero. */
export function consecutiveZeroDeclarations(list: QuarterObligation[]): number {
  const declared = list.filter((o) => o.entry.declared);
  let run = 0;
  for (let i = declared.length - 1; i >= 0; i--) {
    if (declared[i]!.entry.turnover === 0) run++;
    else break;
  }
  return run;
}

/** Longest trailing run of due, non-exempt quarters left unpaid. */
export function consecutiveUnpaidContributions(list: QuarterObligation[], now = new Date()): number {
  const due = list.filter((o) => !o.paymentExempt && daysBetween(new Date(o.dueDate), now) < 0);
  let run = 0;
  for (let i = due.length - 1; i >= 0; i--) {
    if (!due[i]!.entry.paid) run++;
    else break;
  }
  return run;
}

/** Warning thresholds — informative only, radiation is never automatic. */
export const zeroDeclarationWarningAt = 5;
export const unpaidWarningAt = 4;

export function nextObligation(list: QuarterObligation[]): QuarterObligation | null {
  return (
    list
      .filter((o) => o.declaration !== "declared" || (!o.paymentExempt && o.payment !== "paid"))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
  );
}
