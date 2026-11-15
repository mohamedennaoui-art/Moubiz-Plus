import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  Deadline,
  Invoice,
  Profile,
  SocialRecord,
  TaxRecord,
} from "./engines/types";
import type { QuarterEntry } from "./engines/deadline-engine";
import { syncInvoiceStatus } from "./engines/invoices";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type AppData = {
  profile: Profile;
  tax: TaxRecord | null;
  social: SocialRecord | null;
  deadlines: Deadline[];
  invoices: Invoice[];
  /** Per-quarter declaration/payment records, keyed "2026-T1". */
  quarterEntries: Record<string, QuarterEntry>;
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
    registrationDate: "",
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
  quarterEntries: {},
};

function freshDefaults(): AppData {
  return { ...defaultData, deadlines: demoDeadlines() };
}

type Ctx = {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  ready: boolean;
};

const StoreContext = createContext<Ctx>({ data: defaultData, update: () => {}, ready: false });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);
  // Current authenticated user owning the in-memory data (null = signed out).
  const userIdRef = useRef<string | null>(null);
  // True once the current user's row has been loaded (or created) — saves are blocked before that.
  const loadedRef = useRef(false);
  // Generation counter: any auth change or new load invalidates in-flight requests.
  const generationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const loadFor = async (userId: string) => {
      const generation = ++generationRef.current;
      loadedRef.current = false;
      userIdRef.current = userId;
      try {
        const { data: row, error } = await supabase
          .from("user_data")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        if (cancelled || generation !== generationRef.current || userIdRef.current !== userId) return;
        if (error) {
          // Never replace existing in-memory data with empty data on a read error.
          console.error("[store] Lecture des données impossible:", error.message);
          setReady(true);
          return;
        }
        let next: AppData;
        if (row?.data && typeof row.data === "object" && !Array.isArray(row.data)) {
          next = { ...freshDefaults(), ...(row.data as unknown as AppData) };
        } else {
          // First use of this account: create the row with the initial data.
          next = freshDefaults();
          const { error: insertError } = await supabase.from("user_data").upsert(
            {
              user_id: userId,
              data: next as unknown as Json,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          if (cancelled || generation !== generationRef.current || userIdRef.current !== userId) return;
          if (insertError) {
            console.error("[store] Création des données initiales impossible:", insertError.message);
          }
        }
        const synced = (next.invoices ?? []).map(syncInvoiceStatus);
        if (synced.some((inv, i) => inv !== next.invoices[i])) {
          next = { ...next, invoices: synced };
        }
        setData(next);
        loadedRef.current = true;
        setReady(true);
      } catch (err) {
        if (cancelled || generation !== generationRef.current) return;
        console.error("[store] Erreur de chargement:", err);
        setReady(true);
      }
    };

    const loadAnonymous = () => {
      generationRef.current += 1;
      userIdRef.current = null;
      loadedRef.current = false;
      setData(freshDefaults());
      setReady(true);
    };

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (cancelled) return;
      const userId = sessionData.session?.user.id;
      if (userId) void loadFor(userId);
      else loadAnonymous();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const userId = session?.user.id;
      if (event === "SIGNED_OUT" || !userId) {
        // Sign-out: clear in-memory data immediately, never keep another account's data.
        loadAnonymous();
        return;
      }
      if (userId !== userIdRef.current || !loadedRef.current) {
        // Sign-in or account switch: load the new user's data, never mix accounts.
        setReady(false);
        void loadFor(userId);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      ready,
      update: (patch) =>
        setData((prev) => {
          const next = { ...prev, ...patch };
          if (patch.invoices) next.invoices = patch.invoices.map(syncInvoiceStatus);
          const userId = userIdRef.current;
          const generation = generationRef.current;
          // No save before the current user's data has finished loading.
          if (userId && loadedRef.current) {
            void supabase
              .from("user_data")
              .upsert(
                {
                  user_id: userId,
                  data: next as unknown as Json,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" },
              )
              .then(({ error }) => {
                if (error) console.error("[store] Sauvegarde impossible:", error.message);
              });
            // A newer auth change invalidates this save's context; the check above
            // captured userId/generation before the async call, and a stale request
            // can only target the row of the user it was issued for.
            void generation;
          }
          return next;
        }),
    }),
    [data, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
