// lib/api/ApiService.ts
import Cookies from "js-cookie";

export type DashboardStats = {
  totalSites: number;
  onlineDevices: number;
  totalDevices: number;
  alerts: number;
  systemHealth: string;
  healthPercentage?: number;
};

export default class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = Cookies.get("access_token") || null;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers, credentials: "include" });

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

    return typeof payload === "object" && "data" in payload
      ? payload
      : { success: true, data: payload };
  }

  // ---- API ----
  async getSitesForUser()        { return (await this.fetch("/sites")).data || []; }
  async getAllSitesForAdmin()    { return (await this.fetch("/sites/all")).data || []; }
  async getDashboardStats()      { return (await this.fetch("/dashboard/stats")).data as DashboardStats; }

  async createSite(body: any)    { return (await this.fetch("/sites", { method:"POST", body: JSON.stringify(body)})).data; }
  async updateSite(id:number, body:any){ return (await this.fetch(`/sites/${id}`, { method:"PUT", body: JSON.stringify(body)})).data; }
  async deleteSite(id:number)    { await this.fetch(`/sites/${id}`, { method:"DELETE" }); return true; }

  async getSiteUsers(siteId:number) {
    return (await this.fetch(`/sites/${siteId}/users`)).data as Array<{id:number;nombre:string;email:string}>;
  }
  async assignUserByEmail(siteId:number, email:string) {
    return await this.fetch(`/sites/${siteId}/users/by-email`, { method:"POST", body: JSON.stringify({ email })});
  }
  async removeUserFromSite(id:number, userId:number) {
    await this.fetch(`/sites/${id}/users/${userId}`, { method:"DELETE" }); return true;
  }

  async getSiteDevices(siteId:number){
    return (await this.fetch(`/sites/${siteId}/devices`)).data as Array<{
      id:number; nombre:string; macAddress:string; ipAddress:string|null;
      statusId:number|null; siteId:number; status?: { id:number; nombre:string }; Status?: { id:number; nombre:string }
    }>;
  }
  async createDevice(siteId:number, body:any){ return (await this.fetch(`/sites/${siteId}/devices`, { method:"POST", body: JSON.stringify(body)})).data; }
  async bulkCreateDevices(siteId:number, devices:any[]){ return (await this.fetch(`/sites/${siteId}/devices/bulk`, { method:"POST", body: JSON.stringify({ devices })})).data; }
  async updateDevice(siteId:number, deviceId:number, body:any){
    return (await this.fetch(`/sites/${siteId}/devices/${deviceId}`, { method:"PUT", body: JSON.stringify(body)})).data;
  }
  async deleteDevice(siteId:number, deviceId:number){ await this.fetch(`/sites/${siteId}/devices/${deviceId}`, { method:"DELETE"}); return true; }

  // ---- EXPORT (CSV/XML) ----
  async exportSites(
    format: "csv" | "xml",
    scope: "all" | "mine",
    q?: string
  ): Promise<{ blob: Blob; filename: string }> {
    const params = new URLSearchParams({ format, scope });
    if (q && q.trim()) params.set("q", q.trim());

    const url = `${this.baseUrl}/sites/export?${params.toString()}`;
    const headers: HeadersInit = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    const res = await fetch(url, { method: "GET", headers, credentials: "include" });
    if (!res.ok) {
      const maybeJson = await res.json().catch(() => null);
      const msg = maybeJson?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const cd = res.headers.get("Content-Disposition") || "";
    const match = /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
    const suggested = match ? decodeURIComponent(match[2]) : `sites_export.${format}`;

    const blob = await res.blob();
    return { blob, filename: suggested };
  }
}
