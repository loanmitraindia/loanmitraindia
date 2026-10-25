// A salary-account bank and a lender preference are separate enquiry details.
export const SALARY_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "IDFC FIRST Bank", "IndusInd Bank",
] as const;

export const PREFERRED_BANKS = [...SALARY_BANKS, "Utkarsh Small Finance Bank"] as const;
export const PREFERRED_NBFCS = [
  "Bajaj Finance", "Cholamandalam (Chola)", "Piramal Finance", "Tata Capital",
  "Aditya Birla Capital", "L&T Finance", "Poonawalla Fincorp",
] as const;
export const PREFERRED_LENDERS = ["", ...PREFERRED_BANKS, ...PREFERRED_NBFCS] as const;
export const NO_LENDER_PREFERENCE = "No preference—please guide me";
