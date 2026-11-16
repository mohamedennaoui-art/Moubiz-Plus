<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Translate tax/social engine messages in the presentation-only calculation-text module; keep engines and stored results language-independent to preserve calculations and French output.
- Business data (profile, invoices, tax, social) is stored per connected user in `public.user_data` (JSONB) via `src/lib/store.tsx`; the legacy localStorage key `moubiz_plus_data_v1` is left untouched (no import, no deletion) — its migration is a separate, owner-verified step.
- Admin access is decided server-side via the `user_roles` table + `has_role`; the owner email in `src/lib/admin.functions.ts` is auto-granted admin only after email confirmation — never trust client checks.
- Functional pages live under the shared client-only `_authenticated` session gate; public `/` retains verification metadata and forwards to `/dashboard`, and sign-in restores only sanitized local destinations. This protects direct URLs without changing storage or RLS.
