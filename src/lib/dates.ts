export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addDaysISO(iso: string, days: number): string {
  return toISODate(addDays(parseISODate(iso), days));
}

export function todayISO(now = new Date()): string {
  return toISODate(now);
}

export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function timeFromMinutes(total: number): string {
  const clamped = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTime(time: string): string {
  const date = parseISODate("2020-01-01");
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseISODate(iso));
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseISODate(iso));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return hours === 1 ? "1 hr" : `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function weekdayIndex(iso: string): number {
  return parseISODate(iso).getDay();
}

export function weekRange(today: string): { from: string; to: string; days: string[] } {
  const date = parseISODate(today);
  const dow = date.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(date, mondayOffset);
  const days = Array.from({ length: 7 }, (_, index) => toISODate(addDays(monday, index)));
  return { from: days[0], to: days[6], days };
}

export function previousWeekRange(today: string): { from: string; to: string; days: string[] } {
  const current = weekRange(today);
  return weekRange(addDaysISO(current.from, -1));
}

export function monthRange(today: string): { from: string; to: string; days: string[] } {
  const date = parseISODate(today);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(toISODate(cursor));
  }
  return { from: days[0], to: days[days.length - 1], days };
}

export function previousMonthRange(today: string): { from: string; to: string; days: string[] } {
  const date = parseISODate(today);
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthRange(toISODate(previous));
}

export function dayLabels(days: string[]): string[] {
  return days.map((iso) =>
    new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(parseISODate(iso)),
  );
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export interface ZonedClock {
  today: string;
  minutes: number;
  timeZone: string;
}

export function clockInZone(now: Date, timeZone: string): ZonedClock {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const hour = lookup.hour === "24" ? "00" : lookup.hour;
    return {
      today: `${lookup.year}-${lookup.month}-${lookup.day}`,
      minutes: Number(hour) * 60 + Number(lookup.minute),
      timeZone,
    };
  } catch {
    return {
      today: todayISO(now),
      minutes: now.getHours() * 60 + now.getMinutes(),
      timeZone: "UTC",
    };
  }
}
