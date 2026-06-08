/** Verifica se um e-mail está na allowlist (env, separada por vírgulas). */
export function isEmailAllowed(
  email: string | undefined | null,
  envValue: string | undefined | null
): boolean {
  if (!email || !envValue) return false;
  const target = email.trim().toLowerCase();
  if (!target) return false;
  const allowed = envValue
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(target);
}
