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
- Business data (profile, invoices, tax, social) stays in browser localStorage; accounts only gate the admin area — keeps existing modules unchanged.
- Admin access is decided server-side via the `user_roles` table + `has_role`; the owner email in `src/lib/admin.functions.ts` is auto-granted admin only after email confirmation — never trust client checks.
