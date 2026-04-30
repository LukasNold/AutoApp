export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatMileage(km: number | undefined): string {
  if (km == null) return '—';
  return km.toLocaleString() + ' km';
}

export function formatCurrency(amount: number | undefined): string {
  if (amount == null) return '—';
  return '€ ' + amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
