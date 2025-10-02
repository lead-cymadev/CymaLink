import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/lib/api/apiConfig';

// Tipos mínimos (ajústalos si ya los tienes centralizados)
type Status = { id?: number; nombre: string };
type Device = { id:number; nombre:string; macAddress:string; ipAddress:string|null; statusId?: number|null; siteId?: number; Status?: Status };
type User = { id:number; nombre:string; email:string; rol?: string; idRol?: number; Rol?: { NombreRol:string } };
type Site = { id:number; nombre:string; ubicacion:string; raspberries?: Device[]; Raspberries?: Device[]; users?: User[]; Users?: User[] };
type DashboardStats = { totalSites:number; onlineDevices:number; totalDevices:number; alerts:number; systemHealth:string; healthPercentage?:number };

export default class ApiService {
  private baseUrl: string;
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl; // ← incluye /api
  }
  private get token() {
    return Cookies.get('access_token') || null;
  }
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers, credentials: 'include' });

    if (res.status === 204) return { success: true, data: null };
    let payload: any = null;
    try { payload = await res.json(); } catch {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, data: null };
    }
    if (!res.ok) {
      const msg = payload?.message || `HTTP ${res.status}`;
      const err = new Error(msg) as Error & { status?: number };
      (err as any).status = res.status;
      throw err;
    }
    return (typeof payload === 'object' && 'data' in payload) ? payload : { success: true, data: payload };
  }

  // Sites (listas)
  getSitesForUser(): Promise<Site[]> { return this.fetch('/sites').then(r => r.data || []); }
  getAllSitesForAdmin(): Promise<Site[]> { return this.fetch('/sites/all').then(r => r.data || []); }

  // Dashboard
  getDashboardStats(): Promise<DashboardStats> { return this.fetch('/dashboard/stats').then(r => r.data); }

  // Sites (CRUD)
  createSite(payload: { nombre:string; ubicacion?:string; userIds?:number[]; raspberries?: Array<{ nombre:string; macAddress:string; ipAddress?:string; statusId?:number }> }) {
    return this.fetch('/sites', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.data);
  }
  updateSite(id:number, payload: { nombre?:string; ubicacion?:string; userIds?:number[] }) {
    return this.fetch(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(r => r.data);
  }
  deleteSite(id:number) { return this.fetch(`/sites/${id}`, { method: 'DELETE' }).then(() => true); }

  // Usuarios en Site
  getSiteUsers(siteId:number) { return this.fetch(`/sites/${siteId}/users`).then(r => r.data as Array<{id:number; nombre:string; email:string}>); }
  assignUserByEmail(siteId:number, email:string) {
    return this.fetch(`/sites/${siteId}/users/by-email`, { method: 'POST', body: JSON.stringify({ email }) });
  }
  addUsersToSite(id:number, userIds:number[]) {
    return this.fetch(`/sites/${id}/users`, { method: 'POST', body: JSON.stringify({ userIds }) }).then(r => r.data);
  }
  removeUserFromSite(id:number, userId:number) { return this.fetch(`/sites/${id}/users/${userId}`, { method: 'DELETE' }).then(() => true); }

  // Devices en Site
  getSiteDevices(siteId:number) {
    return this.fetch(`/sites/${siteId}/devices`).then(r => r.data as Array<{ id:number; nombre:string; macAddress:string; ipAddress:string|null; statusId:number|null; siteId:number; Status?: { id:number; nombre:string } }>);
  }
  createDevice(siteId:number, payload:{ nombre:string; macAddress:string; ipAddress?:string; statusId?:number }) {
    return this.fetch(`/sites/${siteId}/devices`, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.data);
  }
  bulkCreateDevices(siteId:number, devices:Array<{ nombre:string; macAddress:string; ipAddress?:string; statusId?:number }>) {
    return this.fetch(`/sites/${siteId}/devices/bulk`, { method: 'POST', body: JSON.stringify({ devices }) }).then(r => r.data);
  }
  updateDevice(siteId:number, deviceId:number, payload:{ nombre?:string; macAddress?:string; ipAddress?:string; statusId?:number }) {
    return this.fetch(`/sites/${siteId}/devices/${deviceId}`, { method: 'PUT', body: JSON.stringify(payload) }).then(r => r.data);
  }
  deleteDevice(siteId:number, deviceId:number) {
    return this.fetch(`/sites/${siteId}/devices/${deviceId}`, { method: 'DELETE' }).then(() => true);
  }
}
