import type { Lang } from "./i18n";

// Presentation-only translations: the engines and their stored results stay unchanged.
const arabic: Record<string, string> = {
  "Activité": "النشاط",
  "Localisation": "الموقع",
  "Période": "الفترة",
  "Annuel": "سنوي",
  "Services": "خدمات",
  "Commerce": "تجارة",
  "Artisanat": "حرف",
  "Zone communale": "داخل المنطقة البلدية",
  "Hors zone communale": "خارج المنطقة البلدية",
  "Chiffre d'affaires": "رقم المعاملات",
  "Plafond 75 000 TND": "السقف 75 000 TND",
  "Dans le plafond": "ضمن السقف",
  "Dépassé": "تم تجاوز السقف",
  "Paiement": "الدفع",
  "Exonéré — période d'exonération": "معفى — فترة الإعفاء",
  "Exigible": "مستحق للدفع",
  "Déclaration": "التصريح",
  "À effectuer": "يجب القيام به",
  "Montant théorique": "المبلغ النظري",
  "Montant exigible": "المبلغ المستحق للدفع",
  "jusqu'au": "إلى غاية",
  "Le chiffre d'affaires dépasse le plafond annuel de 75 000 TND.": "رقم المعاملات يتجاوز السقف السنوي البالغ 75 000 TND.",
  "Vous êtes dans la période d'exonération calculée depuis votre date d'inscription : le montant exigible est de 0 TND. La déclaration reste à effectuer.": "أنت ضمن فترة الإعفاء المحتسبة من تاريخ تسجيلك: المبلغ المستحق للدفع هو 0 TND. يبقى التصريح واجباً.",
  "Le montant de l'impôt est déterminé selon la localisation de l'activité. Le plafond de chiffre d'affaires est vérifié séparément.": "يُحدَّد مبلغ الضريبة حسب موقع النشاط. ويتم التحقق من سقف رقم المعاملات بشكل منفصل.",
  "Année / trimestre": "السنة / الثلاثي",
  "Artisanat et industries traditionnelles": "الحرف والصناعات التقليدية",
  "Autres activités": "أنشطة أخرى",
  "Situation": "الوضعية",
  "Salarié secteur privé + auto-entrepreneur": "أجير بالقطاع الخاص + مبادر ذاتي",
  "Auto-entrepreneur": "مبادر ذاتي",
  "Tranche": "الشريحة",
  "Tranche de référence": "الشريحة المرجعية",
  "Montant théorique / trimestre": "المبلغ النظري / الثلاثي",
  "Montant théorique / an": "المبلغ النظري / السنة",
  "Contribution / trimestre": "المساهمة / الثلاثي",
  "Contribution / an": "المساهمة / السنة",
  "Paramètres": "المعطيات المعتمدة",
  "Contribution calculée selon l'activité et la tranche choisie (paramètres de l'année).": "تُحتسب المساهمة حسب النشاط والشريحة المختارة (معطيات السنة).",
  "Connexion": "تسجيل الدخول",
  "Déconnexion": "تسجيل الخروج",
  "Admin": "الإدارة",
};

export function calculationText(text: string, lang: Lang): string {
  if (lang === "fr") return text;
  if (arabic[text]) return arabic[text];
  const tranche = /^Tranche (\d+)$/.exec(text);
  if (tranche) return `الشريحة ${tranche[1]}`;
  const exemption = /^Exonéré — période d'exonération \(calculée à partir de la date d'inscription, jusqu'au (.+)\)\.$/.exec(text);
  if (exemption) return `معفى — فترة الإعفاء (تُحتسب من تاريخ التسجيل، إلى غاية ${exemption[1]}).`;
  return text;
}