export function formatMoney(cents: number | bigint, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Number(cents) % 100 === 0 ? 0 : 2,
  }).format(Number(cents) / 100);
}

export function formatCompactMoney(cents: number | bigint) {
  const dollars = Number(cents) / 100;
  if (dollars < 1_000) return formatMoney(cents);
  return `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(dollars)}`;
}

export function formatNumber(value: number | bigint) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function timeLeft(end: Date, now = new Date()) {
  const delta = Math.max(0, end.getTime() - now.getTime());
  const days = Math.floor(delta / 86_400_000);
  const hours = Math.floor((delta % 86_400_000) / 3_600_000);
  const minutes = Math.floor((delta % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}
