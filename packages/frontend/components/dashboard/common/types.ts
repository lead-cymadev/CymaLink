// components/dashboard/common/types.ts
export type UserRole = "admin" | "usuario";

export type User = {
  id: number;
  nombre: string;
  email: string;
  rol?: UserRole;
  idRol?: number;
  Rol?: { NombreRol: string };
  preferredLanguage?: string | null;
  timezone?: string | null;
  notifyByEmail?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Status = { nombre: string };

export type Device = {
  id: number;
  nombre: string;
  macAddress: string;
  ipAddress: string | null;
  hostname?: string | null;
  tailscaleIp?: string | null;
  tipo?: string | null;
  Status?: Status;
  statusId?: number | null;
  siteId?: number;
};

export type Site = {
  id: number;
  nombre: string;
  ubicacion: string;
  Raspberries?: Device[];
  raspberries?: Device[];
  Users?: User[];
  users?: User[];
};

export type DashboardStats = {
  totalSites: number;
  onlineDevices: number;
  totalDevices: number;
  alerts: number;
  systemHealth: string;
  healthPercentage?: number;
};
