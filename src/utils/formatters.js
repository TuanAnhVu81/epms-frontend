// Format a number as currency string (e.g. 2000 → "$2,000.00")
export function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format an ISO date string → "dd/MM/yyyy" (Vietnamese format)
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Format decimal tax rate to percentage string (e.g. 0.10 → "10%")
export function formatTaxRate(rate) {
  if (rate == null) return '—';
  return `${(rate * 100).toFixed(0)}%`;
}
