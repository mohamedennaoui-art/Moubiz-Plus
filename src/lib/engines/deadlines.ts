import type { Deadline, DeadlineStatus } from "./types";

export function daysUntil(dueDate: string, now = new Date()): number {
  const due = new Date(dueDate);
  const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

export function deadlineStatus(d: Deadline, now = new Date()): DeadlineStatus {
  if (d.done) return "done";
  const days = daysUntil(d.dueDate, now);
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "upcoming";
}

export function sortDeadlines(list: Deadline[]): Deadline[] {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function nextDeadline(list: Deadline[], now = new Date()): Deadline | null {
  const open = sortDeadlines(list.filter((d) => !d.done));
  void now;
  return open[0] ?? null;
}

/** Notification component: rules only, no transport wired yet. */
export function pendingAlerts(list: Deadline[], now = new Date()) {
  return list
    .filter((d) => !d.done)
    .map((d) => ({ deadline: d, status: deadlineStatus(d, now), days: daysUntil(d.dueDate, now) }))
    .filter((a) => a.status === "urgent" || a.status === "overdue");
}
