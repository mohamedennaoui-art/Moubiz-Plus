# Moubiz Plus — MVP roadmap

- [x] Light mode theme: pure white background, dark text, high-contrast accents
- [x] FR/AR bilingual with RTL support + language switcher
- [x] Dashboard with 4 cards (impôt, contribution, échéance, factures)
- [x] Tax calculation page — real V26 engine (fixed amount by location, rules_version 2026, 75 000 TND ceiling checked separately, 7 tests passing)
- [x] Social contribution page (configurable rule engine)
- [x] Deadline engine v1.1: no obligations before registration, payment exemption = registration + 12 months extended to quarter end (declaration always required), declaration + payment statuses, zero-declaration / unpaid counters with 5 and 4 consecutive warnings, notifications at 30/15/7/3/1 days and overdue (13 tests passing)
- [x] Turnover ceiling engine (rules_version 2026, 75 000 TND, thresholds 80/90/95/100/above) + dashboard indicator with year selector (3 tests passing)
- [x] Invoicing: list, filters, new invoice, totals, paid/remaining, overdue badge, dashboard payment summary (5 tests passing)
- [x] Bilingual printable PDF invoice
- [x] Profile page
- [ ] Accounts + cloud database (needs Lovable Cloud enabled — pending user go-ahead)
- [ ] Load validated tax/CNSS rules from the Excel prototype (pending user data)
