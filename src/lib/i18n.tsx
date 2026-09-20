import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "fr" | "ar";

type Dict = Record<string, { fr: string; ar: string }>;

export const dict: Dict = {
  appName: { fr: "Moubiz Plus", ar: "موبيز بلوس" },
  tagline: {
    fr: "Votre assistant digital pour le Moubader Dhati",
    ar: "مساعدك الرقمي للمبادر الذاتي",
  },
  nav_dashboard: { fr: "Tableau de bord", ar: "الرئيسية" },
  nav_tax: { fr: "Impôt", ar: "الضريبة" },
  nav_social: { fr: "Contribution", ar: "المساهمة" },
  nav_deadlines: { fr: "Échéances", ar: "الآجال" },
  nav_invoices: { fr: "Factures", ar: "الفواتير" },
  nav_profile: { fr: "Profil", ar: "الحساب" },

  card_tax: { fr: "Impôt estimé", ar: "الضريبة المقدّرة" },
  card_social: { fr: "Contribution sociale estimée", ar: "المساهمة الاجتماعية المقدّرة" },
  card_deadline: { fr: "Prochaine échéance", ar: "الأجل القادم" },
  card_invoices: { fr: "Factures", ar: "الفواتير" },
  btn_calc_tax: { fr: "Calculer mon impôt", ar: "احسب ضريبتي" },
  btn_calc_social: { fr: "Calculer ma contribution", ar: "احسب مساهمتي" },
  btn_deadlines: { fr: "Voir mes échéances", ar: "عرض الآجال" },
  btn_new_invoice: { fr: "Créer une facture", ar: "إنشاء فاتورة" },
  status: { fr: "Statut", ar: "الحالة" },
  not_calculated: { fr: "Non calculé", ar: "لم يُحتسب" },
  calculated_on: { fr: "Calculé le", ar: "احتُسب في" },
  days_left: { fr: "jours restants", ar: "يوم متبقٍ" },
  days_late: { fr: "jours de retard", ar: "يوم تأخير" },
  no_deadline: { fr: "Aucune échéance", ar: "لا يوجد أجل" },
  invoices_count: { fr: "Nombre de factures", ar: "عدد الفواتير" },
  total_invoiced: { fr: "Total facturé", ar: "إجمالي الفوترة" },
  total_paid: { fr: "Total payé", ar: "المبلغ المدفوع" },
  total_remaining: { fr: "Reste à payer", ar: "الباقي" },

  page_tax: { fr: "Calcul de l'impôt", ar: "احتساب الضريبة" },
  page_social: { fr: "Calcul de la contribution sociale", ar: "احتساب المساهمة الاجتماعية" },
  page_deadlines: { fr: "Mes échéances", ar: "آجالي" },
  page_invoices: { fr: "Mes factures", ar: "فواتيري" },
  page_profile: { fr: "Mon profil", ar: "حسابي" },

  period: { fr: "Période", ar: "الفترة" },
  turnover: { fr: "Chiffre d'affaires (TND)", ar: "رقم المعاملات (د.ت)" },
  activity: { fr: "Type d'activité", ar: "نوع النشاط" },
  activity_services: { fr: "Services", ar: "خدمات" },
  activity_trade: { fr: "Commerce", ar: "تجارة" },
  activity_craft: { fr: "Artisanat", ar: "حرف" },
  location_type: { fr: "Localisation de l'activité", ar: "موقع النشاط" },
  loc_municipal: { fr: "Zone communale", ar: "داخل المنطقة البلدية" },
  loc_outside: { fr: "Hors zone communale", ar: "خارج المنطقة البلدية" },
  calc_period: { fr: "Période de calcul", ar: "فترة الاحتساب" },
  period_annual: { fr: "Estimation annuelle", ar: "تقدير سنوي" },
  calculate: { fr: "Calculer", ar: "احسب" },
  edit_data: { fr: "Modifier les données", ar: "تعديل المعطيات" },
  back_dashboard: { fr: "Retour au tableau de bord", ar: "العودة إلى الرئيسية" },
  result_tax: { fr: "Impôt estimé", ar: "الضريبة المقدّرة" },
  estimated_to_pay: { fr: "Montant estimé à payer", ar: "المبلغ المقدّر للدفع" },
  summary: { fr: "Détail du calcul", ar: "تفاصيل الاحتساب" },
  explanation: { fr: "Explication", ar: "توضيح" },
  taxable_info: { fr: "Données prises en compte", ar: "المعطيات المعتمدة" },
  rules_pending: {
    fr: "Les règles officielles ne sont pas encore chargées. Le moteur de calcul est prêt à recevoir les règles validées.",
    ar: "لم يتم بعد تحميل القواعد الرسمية. محرك الاحتساب جاهز لاستقبال القواعد المعتمدة.",
  },
  applicable: { fr: "Applicable", ar: "منطبقة" },
  not_applicable: { fr: "Non applicable", ar: "غير منطبقة" },
  undetermined: { fr: "À déterminer", ar: "قيد التحديد" },
  social_situation: { fr: "Votre situation", ar: "وضعيتك" },
  sit_main: { fr: "Activité principale", ar: "نشاط رئيسي" },
  sit_secondary: { fr: "Activité secondaire", ar: "نشاط ثانوي" },
  sit_covered: { fr: "Déjà couvert par un autre régime", ar: "مغطّى بنظام آخر" },
  result_social: { fr: "Contribution sociale estimée", ar: "المساهمة الاجتماعية المقدّرة" },

  st_upcoming: { fr: "À venir", ar: "قادم" },
  st_soon: { fr: "Bientôt", ar: "قريباً" },
  st_urgent: { fr: "Urgent", ar: "عاجل" },
  st_overdue: { fr: "Échéance dépassée", ar: "تجاوز الأجل" },
  st_done: { fr: "Payé / Déclaré", ar: "خُلّص / صُرّح" },
  mark_done: { fr: "Marquer comme payé / déclaré", ar: "تسجيل كمدفوع" },
  due_date: { fr: "Date d'échéance", ar: "تاريخ الأجل" },
  amount: { fr: "Montant", ar: "المبلغ" },
  alert_soon: {
    fr: "Une échéance approche. Pensez à préparer votre paiement.",
    ar: "يقترب أحد الآجال. استعدّ للدفع.",
  },

  new_invoice: { fr: "+ Nouvelle facture", ar: "+ فاتورة جديدة" },
  invoice_history: { fr: "Historique des factures", ar: "سجلّ الفواتير" },
  seller: { fr: "Vendeur", ar: "البائع" },
  customer: { fr: "Client", ar: "الحريف" },
  name: { fr: "Nom / Raison sociale", ar: "الاسم / التسمية" },
  identifier: { fr: "Identifiant", ar: "المعرّف" },
  address: { fr: "Adresse", ar: "العنوان" },
  phone: { fr: "Téléphone", ar: "الهاتف" },
  email: { fr: "Email", ar: "البريد الإلكتروني" },
  invoice_number: { fr: "Numéro de facture", ar: "رقم الفاتورة" },
  invoice_date: { fr: "Date de facture", ar: "تاريخ الفاتورة" },
  currency: { fr: "Devise", ar: "العملة" },
  designation: { fr: "Désignation", ar: "بيان" },
  quantity: { fr: "Quantité", ar: "الكمية" },
  unit_price: { fr: "Prix unitaire", ar: "السعر الوحدوي" },
  line_amount: { fr: "Montant", ar: "المبلغ" },
  add_line: { fr: "+ Ajouter une ligne", ar: "+ إضافة سطر" },
  subtotal: { fr: "Sous-total", ar: "المجموع الفرعي" },
  total: { fr: "Total", ar: "المجموع" },
  paid_amount: { fr: "Montant payé", ar: "المبلغ المدفوع" },
  remaining: { fr: "Reste à payer", ar: "الباقي" },
  save: { fr: "Enregistrer", ar: "حفظ" },
  cancel: { fr: "Annuler", ar: "إلغاء" },
  download_pdf: { fr: "Télécharger la facture PDF", ar: "تحميل الفاتورة PDF" },
  filter_all: { fr: "Toutes", ar: "الكل" },
  inv_draft: { fr: "Brouillon", ar: "مسودة" },
  inv_sent: { fr: "Envoyée", ar: "مُرسلة" },
  inv_partial: { fr: "Partiellement payée", ar: "مدفوعة جزئياً" },
  inv_paid: { fr: "Payée", ar: "مدفوعة" },
  inv_unpaid: { fr: "Impayée", ar: "غير مدفوعة" },
  no_invoices: { fr: "Aucune facture pour le moment.", ar: "لا توجد فواتير حالياً." },
  equiv_tnd: { fr: "Équivalent en TND", ar: "ما يعادله بالدينار" },
  rate_note: {
    fr: "Taux de change à configurer dans le profil.",
    ar: "سعر الصرف يُضبط في الحساب.",
  },
  saved: { fr: "Enregistré", ar: "تم الحفظ" },
  profile_intro: {
    fr: "Ces informations apparaissent sur vos factures.",
    ar: "تظهر هذه المعلومات على فواتيرك.",
  },
  language: { fr: "Langue", ar: "اللغة" },
  exchange_rates: { fr: "Taux de change (1 devise = X TND)", ar: "أسعار الصرف (1 عملة = X د.ت)" },
  notifications: { fr: "Rappels d'échéance", ar: "تنبيهات الآجال" },
  notif_note: {
    fr: "Alertes affichées dans l'application. Email et notifications mobiles pourront être branchés plus tard.",
    ar: "تنبيهات داخل التطبيق. يمكن ربط البريد والإشعارات لاحقاً.",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict) => string };

const I18nContext = createContext<Ctx>({
  lang: "fr",
  setLang: () => {},
  t: (k) => dict[k]?.fr ?? String(k),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("mb_lang") : null;
    if (stored === "ar" || stored === "fr") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("mb_lang", l);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (k) => dict[k]?.[lang] ?? String(k) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export function formatMoney(value: number, currency = "TND") {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${currency}`;
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}
