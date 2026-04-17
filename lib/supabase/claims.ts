/**
 * Helper untuk membaca custom claims dari Supabase JWT.
 *
 * Claims di-embed oleh custom_access_token_hook saat login:
 * - app_roles:         role RBAC user (super_admin, admin, anggota, caang)
 * - app_departments:   slug departemen jabatan user
 * - app_divisions:     slug divisi user
 * - app_div_positions: posisi di setiap divisi (ketua, wakil_ketua, anggota)
 */

export interface AppClaims {
  app_roles: string[];
  app_departments: string[];
  app_divisions: string[];
  app_div_positions: string[];
}

const EMPTY_CLAIMS: AppClaims = {
  app_roles: [],
  app_departments: [],
  app_divisions: [],
  app_div_positions: [],
};

/** Decode JWT payload dan kembalikan AppClaims */
export function decodeJwtClaims(token: string): AppClaims {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    return {
      app_roles: payload.app_roles ?? [],
      app_departments: payload.app_departments ?? [],
      app_divisions: payload.app_divisions ?? [],
      app_div_positions: payload.app_div_positions ?? [],
    };
  } catch {
    return EMPTY_CLAIMS;
  }
}

/** Cek apakah claims punya salah satu dari role yang diberikan */
export function hasRole(claims: AppClaims, ...roles: string[]): boolean {
  return roles.some((r) => claims.app_roles.includes(r));
}

/** Cek apakah claims punya jabatan di salah satu departemen yang diberikan */
export function hasDepartment(claims: AppClaims, ...depts: string[]): boolean {
  return depts.some((d) => claims.app_departments.includes(d));
}

/** Cek apakah user adalah bypass role (super_admin atau admin) */
export function isBypassRole(claims: AppClaims): boolean {
  return hasRole(claims, "super_admin", "admin");
}

/**
 * Cek apakah user punya akses ke modul berdasarkan kombinasi
 * bypass role ATAU (role anggota + departemen yang sesuai)
 */
export function hasModuleAccess(
  claims: AppClaims,
  requiredDept: string,
): boolean {
  if (isBypassRole(claims)) return true;
  return hasRole(claims, "anggota") && hasDepartment(claims, requiredDept);
}
