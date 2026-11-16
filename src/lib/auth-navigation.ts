/** Only local application destinations can be used after authentication. */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/";
  const url = new URL(value, "https://moubiz.invalid");
  if (url.origin !== "https://moubiz.invalid" || url.pathname === "/auth" || url.pathname.startsWith("/auth/")) return "/";
  return url.pathname + url.search + url.hash;
}