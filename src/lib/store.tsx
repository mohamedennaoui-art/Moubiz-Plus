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

const defaultDeadlines: Deadline[] = [
  {
    id: "d1",
    type: "tax",
    labelFr: "Déclaration / paiement de l'impôt",
    labelAr: "التصريح / دفع الضريبة",
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString(),
    amount: null,
    done: false,
  },
  {
    id: "d2",
    type: "social",
    labelFr: "Contribution sociale",
    labelAr: "المساهمة الاجتماعية",
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 20).toISOString(),
    amount: null,
    done: false,
  },
];

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
  deadlines: defaultDeadlines,
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
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setData({ ...defaultData, ...(JSON.parse(raw) as AppData) });
    } catch {
      /* ignore corrupt storage */
    }
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
