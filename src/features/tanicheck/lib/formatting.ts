export function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function stripTrailingPeriod(value: string) {
  return value.trim().replace(/\.+$/u, "");
}
