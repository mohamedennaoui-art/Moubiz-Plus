import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Deadline,
  Invoice,
  Profile,
  SocialRecord,
  TaxRecord,
} from "./engines/types";

type AppData = {
  profile: Profile;
  tax: TaxRecord | null;
  social: SocialRecord | null;
  deadlines: Deadline[];
  invoices: Invoice[];
};

/**
 * Demo deadlines for interface testing only — dates are relative to today.
 * Real obligation rules can replace this generator without UI changes.
 * Generated on the client only, to keep server and client HTML identical.
 */
function demoDeadlines(): Deadline[] {
  const today = new Date();
  const at = (days: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
    return d.toISOString();
  };
  return [
    {
      id: "d1",
      type: "tax",
      labelFr: "Déclaration / paiement de l'impôt",
      labelAr: "التصريح / دفع الضريبة",
      dueDate: at(6),
      amount: null,
      done: false,
    },
    {
      id: "d2",
      type: "social",
      labelFr: "Contribution sociale",
      labelAr: "المساهمة الاجتماعية",
      dueDate: at(24),
      amount: null,
      done: false,
    },
    {
      id: "d3",
      type: "tax",
      labelFr: "Déclaration annuelle",
      labelAr: "التصريح السنوي",
      dueDate: at(95),
      amount: null,
      done: false,
    },
  ];
}

const defaultData: AppData = {
  profile: {
    name: "",
    identifier: "",
    address: "",
    phone: "",
    email: "",
    activity: "services",
    rates: { TND: 1, EUR: 0, USD: 0 },
    remindersEnabled: true,
  },
  tax: null,
  social: null,
  deadlines: [],
  invoices: [],
};

const KEY = "moubiz_plus_data_v1";

type Ctx = {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  ready: boolean;
};

const StoreContext = createContext<Ctx>({ data: defaultData, update: () => {}, ready: false });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let next: AppData = { ...defaultData, deadlines: demoDeadlines() };
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) next = { ...next, ...(JSON.parse(raw) as AppData) };
    } catch {
      /* ignore corrupt storage */
    }
    setData(next);
    setReady(true);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      ready,
      update: (patch) =>
        setData((prev) => {
          const next = { ...prev, ...patch };
          try {
            window.localStorage.setItem(KEY, JSON.stringify(next));
          } catch {
            /* storage full or unavailable */
          }
          return next;
        }),
    }),
    [data, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
