export const EMI_RATE = 9.9;
export const EMI_LIMITS = { minAmount: 50000, maxAmount: 4000000, minMonths: 12, maxMonths: 60 };

export function parseLoanAmount(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+)$/.test(text)) return null;
  const amount = Number(text.replaceAll(",", ""));
  return Number.isSafeInteger(amount) && amount >= EMI_LIMITS.minAmount && amount <= EMI_LIMITS.maxAmount ? amount : null;
}

export function parseTenure(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const months = Number(value);
  return months >= EMI_LIMITS.minMonths && months <= EMI_LIMITS.maxMonths ? months : null;
}

export function calculateEmi(principal: number, months: number) {
  if (!Number.isInteger(principal) || principal < EMI_LIMITS.minAmount || principal > EMI_LIMITS.maxAmount || !Number.isInteger(months) || months < EMI_LIMITS.minMonths || months > EMI_LIMITS.maxMonths) throw new RangeError("Invalid calculator amount or tenure");
  const monthlyRate = EMI_RATE / 1200;
  const emi = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  const total = emi * months;
  return { emi, principal, interest: total - principal, total };
}

export const formatRupees = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
export function formatTenure(months: number) {
  const years = Math.floor(months / 12), remainder = months % 12;
  return [years ? `${years} ${years === 1 ? "year" : "years"}` : "", remainder ? `${remainder} ${remainder === 1 ? "month" : "months"}` : ""].filter(Boolean).join(" ");
}
