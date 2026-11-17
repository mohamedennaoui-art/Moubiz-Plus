# Moubiz Plus — MVP roadmap

- [ ] Harden administration-only access, verify server 403 and the signed-out/admin/user cases without changing stored data or publishing.

- [x] Protect functional URLs using the shared session gate, preserve local return URLs and public homepage metadata; verified signed-out/owner direct access, refresh, sign-out and 17 access-rule tests. Normal-user live verification blocked by declined temporary test account; email/password return flow not exercised with real credentials.

- [x] Translate remaining tax/social page text in AR only; verified both forms and exempt/payable results, unchanged FR and saved values, 30 engine tests passed.

- [x] Light mode theme: pure white background, dark text, high-contrast accents
- [x] FR/AR bilingual with RTL support + language switcher
- [x] Dashboard with 4 cards (impôt, contribution, échéance, factures)
- [x] Tax calculation page — real V26 engine (fixed amount by location, rules_version 2026, 75 000 TND ceiling checked separately, 7 tests passing)
- [x] Social contribution engine: 2026 tranches 1–10 + crafts reference, yearly params, salaried = same amounts, exemption reused (10 tests passing)
- [x] Deadline engine v1.1: no obligations before registration, payment exemption = registration + 12 months extended to quarter end (declaration always required), declaration + payment statuses, zero-declaration / unpaid counters with 5 and 4 consecutive warnings, notifications at 30/15/7/3/1 days and overdue (13 tests passing)
- [x] Turnover ceiling engine (rules_version 2026, 75 000 TND, thresholds 80/90/95/100/above) + dashboard indicator with year selector (3 tests passing)
- [x] Invoicing: list, filters, new invoice, totals, paid/remaining, overdue badge, dashboard payment summary (5 tests passing)
- [x] Bilingual printable PDF invoice
- [x] Profile page
- [ ] Accounts + cloud database (needs Lovable Cloud enabled — pending user go-ahead)
- [x] Storage sync: AppData persisted per connected user in public.user_data (upsert on user_id, auth-change reload, race-safe, local key untouched); signed-in sync untested (test user declined)
- [ ] Google Search Console connection (user declined the connect card — retry on request)
- [ ] Load validated tax/CNSS rules from the Excel prototype (pending user data)
