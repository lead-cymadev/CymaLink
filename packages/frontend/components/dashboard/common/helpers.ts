// components/dashboard/common/helpers.ts
import type { Site, Device, User, UserRole } from "./types";

export function getDevicesOfSite(site: Site): Device[] {
  return site.Raspberries ?? site.raspberries ?? [];
}
export function getUsersOfSite(site: Site): User[] {
  return site.Users ?? site.users ?? [];
}
export function resolveUserRole(user: User | null): UserRole {
  if (!user) return "usuario";
  const direct = typeof user.rol === "string" ? user.rol.toLowerCase() : undefined;
  if (direct === "admin" || direct === "usuario") return direct;
  const assoc = typeof user.Rol?.NombreRol === "string" ? user.Rol.NombreRol.toLowerCase() : undefined;
  if (assoc === "admin" || assoc === "usuario") return assoc;
  if (user.idRol === 1) return "admin";
  return "usuario";
}
