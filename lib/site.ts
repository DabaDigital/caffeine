// Choices the dashboard offers and the homepage understands. The database
// enforces the same lists with check constraints.

export const categoryIcons = [
  "coffee",
  "iced",
  "tea",
  "sweet",
  "cake",
  "pastry",
  "juice",
  "food",
  "dessert",
] as const;
export type CategoryIcon = (typeof categoryIcons)[number];
export const categoryIconLabels: Record<CategoryIcon, string> = {
  coffee: "Coffee cup",
  iced: "Iced drink",
  tea: "Tea leaf",
  sweet: "Sweet bites",
  cake: "Cake slice",
  pastry: "Pastry",
  juice: "Juice & soda",
  food: "Savory food",
  dessert: "Ice cream",
};

export const socialPlatforms = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "youtube",
  "snapchat",
  "linkedin",
  "pinterest",
  "website",
] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];
export const socialPlatformLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X (Twitter)",
  youtube: "YouTube",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  website: "Website",
};

export const contactTypes = ["phone", "email", "whatsapp"] as const;
export type ContactType = (typeof contactTypes)[number];
export const contactTypeLabels: Record<ContactType, string> = {
  phone: "Phone",
  email: "Email",
  whatsapp: "WhatsApp",
};

export const isOneOf = <T extends string>(
  list: readonly T[],
  value: string,
): value is T => (list as readonly string[]).includes(value);

/** A clearly labeled Maps search, used when no verified place link exists. */
export function mapsSearchUrl(...parts: (string | null | undefined)[]) {
  const query = parts.filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const currency = "MAD";
export function formatPrice(price: number) {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
const roundPrice = (value: number) => Math.round(value * 100) / 100;

// ---------------------------------------------------------------------------
// Dates and times in the café's time zone
// ---------------------------------------------------------------------------

export const cafeTimeZone = "Africa/Casablanca";

/** Today's date in Casablanca, as "YYYY-MM-DD". */
export function cafeToday(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: cafeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const shortMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
/** "2026-10-31" → "31 Oct" (spelled out by hand, so server and browser agree). */
export function shortDate(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${shortMonths[month - 1]}`;
}

// ---------------------------------------------------------------------------
// Opening hours, shown like Google Maps
// ---------------------------------------------------------------------------

export const weekDays = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WeekDay = (typeof weekDays)[number];
export const weekDayNames: Record<WeekDay, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
/** Times are "HH:MM"; a close at or before the open time runs past midnight. */
export type Period = { open: string; close: string };
export type WeekHours = Record<WeekDay, Period[]>;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** "07:30" → "7:30 AM" */
export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

/** "7:30 AM–9:45 PM", several periods joined, or "Closed". */
export function formatPeriods(periods: Period[]) {
  if (!periods.length) return "Closed";
  return periods
    .map((period) => `${formatTime(period.open)}–${formatTime(period.close)}`)
    .join(", ");
}

/** Groups days with identical hours: ["Mon–Fri 7:30 AM–9:45 PM", "Sun Closed"]. */
export function summarizeHours(hours: WeekHours) {
  const groups: { from: WeekDay; to: WeekDay; text: string }[] = [];
  for (const day of weekDays) {
    const text = formatPeriods(hours[day]);
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.to = day;
    else groups.push({ from: day, to: day, text });
  }
  const short = (day: WeekDay) => weekDayNames[day].slice(0, 3);
  return groups.map(({ from, to, text }) =>
    from === to
      ? `${short(from)} ${text}`
      : `${short(from)}–${short(to)} ${text}`,
  );
}

/** Weekday and minutes since midnight in Casablanca. */
export function cafeNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: cafeTimeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = value("weekday").slice(0, 3).toLowerCase() as WeekDay;
  return { day, minutes: Number(value("hour")) * 60 + Number(value("minute")) };
}

/** Google-style status: "Open now · Closes 9:45 PM" or "Closed · Opens 7:30 AM Mon". */
export function openStatus(
  hours: WeekHours,
  now: { day: WeekDay; minutes: number },
) {
  const index = weekDays.indexOf(now.day);
  const yesterday = weekDays[(index + 6) % 7];
  // Still inside last night's late period?
  for (const period of hours[yesterday]) {
    const open = toMinutes(period.open);
    const close = toMinutes(period.close);
    if (close <= open && now.minutes < close)
      return openUntil(close - now.minutes, period.close);
  }
  for (const period of hours[now.day]) {
    const open = toMinutes(period.open);
    const close = toMinutes(period.close);
    const overnight = close <= open;
    if (now.minutes >= open && (overnight || now.minutes < close))
      return openUntil(
        (overnight ? close + 1440 : close) - now.minutes,
        period.close,
      );
  }
  for (let offset = 0; offset < 7; offset++) {
    const day = weekDays[(index + offset) % 7];
    const next = hours[day]
      .map((period) => period.open)
      .filter((open) => offset > 0 || toMinutes(open) > now.minutes)
      .sort()[0];
    if (next)
      return {
        open: false,
        detail: `Opens ${formatTime(next)}${offset === 0 ? "" : offset === 1 ? " tomorrow" : ` ${weekDayNames[day].slice(0, 3)}`}`,
      };
  }
  return { open: false, detail: "" };
}
const openUntil = (minutesLeft: number, close: string) => ({
  open: true,
  detail:
    minutesLeft <= 60
      ? `Closes soon · ${formatTime(close)}`
      : `Closes ${formatTime(close)}`,
});

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export const discountTypes = ["percent", "amount", "price"] as const;
export type DiscountType = (typeof discountTypes)[number];
export const discountTypeLabels: Record<DiscountType, string> = {
  percent: "Percentage off",
  amount: "Amount off (MAD)",
  price: "Special or bundle price",
};

/** Price of one product under a percent or amount discount. */
export function discountedPrice(
  type: DiscountType,
  value: number,
  price: number,
) {
  if (type === "percent") return roundPrice(price * (1 - value / 100));
  if (type === "amount") return Math.max(roundPrice(price - value), 0);
  return value;
}

/** What a promotion costs and saves for a set of regular prices. */
export function promotionTotals(
  type: DiscountType,
  value: number,
  prices: number[],
) {
  const regular = roundPrice(prices.reduce((sum, price) => sum + price, 0));
  const offer =
    type === "price"
      ? value
      : roundPrice(
          prices.reduce(
            (sum, price) => sum + discountedPrice(type, value, price),
            0,
          ),
        );
  return { regular, offer, saving: roundPrice(regular - offer) };
}

/** Short badge: "-20%", "-10 MAD", "-24%" for a special price, or "Bundle". */
export function offerLabel(
  type: DiscountType,
  value: number,
  regular: number,
  count: number,
) {
  if (type === "percent") return `-${formatPrice(value)}%`;
  if (type === "amount") return `-${formatPrice(value)} ${currency}`;
  if (count > 1) return "Bundle";
  return `-${Math.round((1 - value / regular) * 100)}%`;
}

export type PromotionStatus = "running" | "scheduled" | "ended" | "paused";
export function promotionStatus(
  promotion: { is_active: boolean; starts_on: string; ends_on: string | null },
  today: string,
): PromotionStatus {
  if (!promotion.is_active) return "paused";
  if (promotion.starts_on > today) return "scheduled";
  if (promotion.ends_on && promotion.ends_on < today) return "ended";
  return "running";
}
