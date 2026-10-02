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
  social_activity: { fr: "Activité", ar: "النشاط" },
  social_act_other: { fr: "Autres activités", ar: "أنشطة أخرى" },
  social_act_craft: { fr: "Artisanat et industries traditionnelles", ar: "الحرف والصناعات التقليدية" },
  social_tranche: { fr: "Tranche choisie", ar: "الشريحة المختارة" },
  tranche: { fr: "Tranche", ar: "الشريحة" },
  sit_independent: { fr: "Auto-entrepreneur", ar: "مبادر ذاتي" },
  sit_private_employee: { fr: "Salarié secteur privé + auto-entrepreneur", ar: "أجير بالقطاع الخاص + مبادر ذاتي" },
  per_quarter: { fr: "trimestre", ar: "ثلاثي" },
  per_year: { fr: "an", ar: "سنة" },
  social_exempt: { fr: "Exonéré", ar: "معفى" },
  social_not_exempt: { fr: "Non exonéré", ar: "غير معفى" },
  social_exempt_until: { fr: "Période d'exonération jusqu'au", ar: "فترة الإعفاء إلى غاية" },
  result_social: { fr: "Contribution sociale estimée", ar: "المساهمة الاجتماعية المقدّرة" },

  st_upcoming: { fr: "À venir", ar: "قادم" },
  st_soon: { fr: "Bientôt", ar: "قريباً" },
  st_urgent: { fr: "Urgent", ar: "عاجل" },
  st_overdue: { fr: "Échéance dépassée", ar: "تجاوز الأجل" },
  st_done: { fr: "Payé / Déclaré", ar: "خُلّص / صُرّح" },
  mark_done: { fr: "Marquer comme payé / déclaré", ar: "تسجيل كمدفوع" },
  due_date: { fr: "Date d'échéance", ar: "تاريخ الأجل" },
  amount: { fr: "Montant", ar: "المبلغ" },
  quarter: { fr: "Trimestre", ar: "الثلاثية" },
  quarter_period: { fr: "Période du trimestre", ar: "فترة الثلاثية" },
  declaration: { fr: "Déclaration", ar: "التصريح" },
  payment: { fr: "Paiement", ar: "الدفع" },
  dec_todo: { fr: "À faire", ar: "لم يتم" },
  dec_declared: { fr: "Déclarée", ar: "تم التصريح" },
  dec_late: { fr: "En retard", ar: "متأخرة" },
  pay_to_pay: { fr: "À payer", ar: "للدفع" },
  pay_paid: { fr: "Payée", ar: "مدفوعة" },
  pay_late: { fr: "En retard", ar: "متأخرة" },
  exempt: { fr: "Exonéré — période d'exonération", ar: "معفى — فترة الإعفاء" },
  pay_exempt: { fr: "Exonéré", ar: "معفى" },
  dec_required: { fr: "À effectuer", ar: "يجب القيام به" },
  exemption_note: {
    fr: "Exonération calculée à partir de votre date d'inscription : 12 mois, prolongés jusqu'à la fin du trimestre. La déclaration reste obligatoire.",
    ar: "يُحتسب الإعفاء انطلاقاً من تاريخ التسجيل: 12 شهراً تُمدّد إلى نهاية الثلاثية. يبقى التصريح إجبارياً.",
  },
  exemption_until: { fr: "Fin de l'exonération", ar: "نهاية الإعفاء" },
  mark_declared: { fr: "Marquer déclarée", ar: "تسجيل التصريح" },
  mark_paid: { fr: "Marquer payée", ar: "تسجيل الدفع" },
  undo: { fr: "Annuler", ar: "تراجع" },
  declared_turnover: { fr: "CA déclaré (TND)", ar: "رقم المعاملات المصرّح (د.ت)" },
  zero_declarations: { fr: "Déclarations à zéro", ar: "تصاريح بصفر" },
  unpaid_contributions: { fr: "Contributions impayées", ar: "مساهمات غير مدفوعة" },
  warn_zero_declarations: {
    fr: "Attention : cinq déclarations consécutives sans chiffre d'affaires peuvent entraîner une radiation selon la réglementation applicable. Vérifiez votre situation.",
    ar: "تنبيه: خمسة تصاريح متتالية بدون رقم معاملات قد تؤدي إلى الشطب حسب التراتيب الجاري بها العمل. تحقق من وضعيتك.",
  },
  warn_unpaid_contributions: {
    fr: "Attention : quatre contributions consécutives impayées peuvent entraîner une radiation selon la réglementation applicable. Vérifiez votre situation.",
    ar: "تنبيه: أربع مساهمات متتالية غير مدفوعة قد تؤدي إلى الشطب حسب التراتيب الجاري بها العمل. تحقق من وضعيتك.",
  },
  annual_turnover: { fr: "Chiffre d'affaires annuel", ar: "رقم المعاملات السنوي" },
  ceiling_used: { fr: "du plafond utilisé", ar: "من السقف المستعمل" },
  ceiling_80: {
    fr: "Attention : vous avez atteint 80% du plafond annuel de 75 000 TND.",
    ar: "تنبيه: بلغت 80% من السقف السنوي 75.000 د.ت.",
  },
  ceiling_90: {
    fr: "Attention : vous approchez du plafond annuel de 75 000 TND.",
    ar: "تنبيه: أنت تقترب من السقف السنوي 75.000 د.ت.",
  },
  ceiling_95: {
    fr: "Attention : votre chiffre d'affaires est très proche du plafond annuel de 75 000 TND.",
    ar: "تنبيه: رقم معاملاتك قريب جداً من السقف السنوي 75.000 د.ت.",
  },
  ceiling_100: {
    fr: "Plafond annuel de 75 000 TND atteint.",
    ar: "تم بلوغ السقف السنوي 75.000 د.ت.",
  },
  ceiling_above: {
    fr: "Dépassement du plafond annuel — vérification de votre situation nécessaire.",
    ar: "تجاوز السقف السنوي — يجب التثبت من وضعيتك.",
  },
  unpaid_invoices: { fr: "Factures impayées", ar: "فواتير غير مدفوعة" },
  to_collect: { fr: "Montant à récupérer", ar: "المبلغ المطلوب استخلاصه" },
  inv_late: { fr: "En retard", ar: "متأخرة" },
  registration_date: { fr: "Date d'inscription", ar: "تاريخ التسجيل" },
  registration_note: {
    fr: "Sert à calculer l'exonération de 12 mois et vos trimestres.",
    ar: "تُستعمل لاحتساب الإعفاء لمدة 12 شهراً والثلاثيات.",
  },
  no_registration: {
    fr: "Ajoutez votre date d'inscription dans le profil pour afficher vos trimestres.",
    ar: "أضف تاريخ تسجيلك في الحساب لعرض ثلاثياتك.",
  },
  year: { fr: "Année", ar: "السنة" },
  notif_overdue: { fr: "Échéance dépassée", ar: "تجاوز الأجل" },
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
