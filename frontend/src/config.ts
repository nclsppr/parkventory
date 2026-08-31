export const baseUrl = import.meta.env.BASE_URL;
export const homeUrl = baseUrl;
export const appUrl = `${baseUrl}app`;
export const shareUrl = `${baseUrl}app/partager`;
export const findUrl = `${baseUrl}app/trouver`;
export const adminUrl = `${baseUrl}admin`;
export const adminTenantsUrl = `${baseUrl}admin/tenants`;
export const adminUsersUrl = `${baseUrl}admin/users`;
export const adminOperationsUrl = `${baseUrl}admin/operations`;
export const authCallbackUrl = `${baseUrl}auth/callback`;
export const privacyUrl = `${baseUrl}confidentialite`;
export const legalUrl = `${baseUrl}mentions-legales`;
export const environmentLabel = "Version bêta";

export function adminTenantUrl(id: string) {
  return `${adminTenantsUrl}/${encodeURIComponent(id)}`;
}

export function relativePathname(pathname: string, base = baseUrl) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const relative = normalizedBase && pathname === normalizedBase
    ? "/"
    : normalizedBase && pathname.startsWith(`${normalizedBase}/`)
      ? pathname.slice(normalizedBase.length)
      : pathname;

  return relative.replace(/\/+$/, "") || "/";
}
