export type ActivityType = "services" | "trade" | "craft";
export type SocialSituation = "main" | "secondary" | "covered";
export type CurrencyCode = "TND" | "EUR" | "USD";

export type Profile = {
  name: string;
  /** ISO date of registration as Auto-Entrepreneur; drives the exemption engine. */
  registrationDate: string;
  identifier: string;
  address: string;
  phone: string;
  email: string;
  activity: ActivityType;
  rates: Record<CurrencyCode, number>;
  remindersEnabled: boolean;
};

export type LocationType = "MUNICIPAL" | "OUTSIDE_MUNICIPAL";
export type TaxPeriod = "Q1" | "Q2" | "Q3" | "Q4" | "annual";

export type TaxInputs = {
  /** Fiscal year, e.g. "2026". */
  period: string;
  taxPeriod: TaxPeriod;
  locationType: LocationType;
  turnover: number;
  activity: ActivityType;
  /** ISO registration date; drives the payment exemption period. */
  registrationDate?: string;
};

export type EngineResult = {
  amount: number | null;
  applicable: "yes" | "no" | "unknown";
  steps: { label: string; value: string }[];
  explanation: string;
  rulesLoaded: boolean;
  details?: unknown;
};

export type TaxRecord = { inputs: TaxInputs; result: EngineResult; calculatedAt: string };

export type SocialInputs = {
  period: string;
  situation: SocialSituation;
  turnover: number;
};

export type SocialRecord = { inputs: SocialInputs; result: EngineResult; calculatedAt: string };

export type DeadlineStatus = "upcoming" | "soon" | "urgent" | "overdue" | "done";

export type Deadline = {
  id: string;
  type: string;
  labelFr: string;
  labelAr: string;
  dueDate: string;
  amount: number | null;
  done: boolean;
};

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "unpaid";

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  currency: CurrencyCode;
  customer: { name: string; identifier: string; address: string; contact: string };
  items: InvoiceItem[];
  paid: number;
  status: InvoiceStatus;
};
