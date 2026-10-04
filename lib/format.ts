/** "₦12,500" — mirrors formatNaira() in the web app. */
export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const hasKobo = Math.round(safe * 100) % 100 !== 0;
  const fixed = hasKobo ? safe.toFixed(2) : Math.round(safe).toString();
  const [whole, kobo] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₦${grouped}${kobo ? `.${kobo}` : ""}`;
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "4 Oct 2026" in Africa/Lagos (UTC+1, no DST). */
export function formatDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
