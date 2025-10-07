import Cookies from 'js-cookie';
import { resolveApiBaseUrl } from './apiConfig';

type HeadersMaybe = HeadersInit | undefined;

type SerializableBody = Record<string, unknown> | Array<unknown>;

type ApiRequestBody = RequestInit['body'] | SerializableBody;

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: ApiRequestBody;
  skipAuth?: boolean;
};

type ApiPayload<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
};

export type DashboardStats = {
  totalSites: number;
  onlineDevices: number;
  totalDevices: number;
  alerts: number;
  systemHealth: string;
  healthPercentage?: number;
};

const USER_STORAGE_KEY = 'dashboard:user';

const isBrowser = typeof window !== 'undefined';

const cookieDefaults = {
  sameSite: 'lax' as const,
  secure: isBrowser ? window.location.protocol === 'https:' : true,
};

const normaliseBase = (base: string) => base.replace(/\/+$/, '');

const ensureJsonBody = (body: ApiRequestOptions['body']): BodyInit | null | undefined => {
  if (body === undefined || body === null) return body;
  if (typeof body === 'string') return body;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (isFormData) return body as BodyInit;

  const isUrlParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
  if (isUrlParams) return body as BodyInit;

  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  if (isBlob) return body as BodyInit;

  const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
  if (isArrayBuffer) return body as BodyInit;

  const isArrayBufferView = typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body as ArrayBufferView<ArrayBuffer>);
  if (isArrayBufferView) return body as BodyInit;

  const isReadableStream = typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
  if (isReadableStream) return body as BodyInit;

  if (typeof body === 'object') {
    return JSON.stringify(body);
  }

  return body as unknown as BodyInit;
};

export class ApiService {
  constructor(private readonly baseResolver: () => string = resolveApiBaseUrl) {}

  private buildUrl(endpoint: string): string {
    const base = normaliseBase(this.baseResolver());
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  private getToken(): string | null {
    return Cookies.get('access_token') ?? null;
  }

  private composeHeaders(init: HeadersMaybe, skipAuth: boolean, body: ReturnType<typeof ensureJsonBody>): Headers {
    const headers = new Headers(init);

    if (!skipAuth) {
      const token = this.getToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (typeof body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  private async request<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiPayload<T>> {
    const { skipAuth = false, body: rawBody, headers: initialHeaders, ...rest } = options;
    const body = ensureJsonBody(rawBody);
    const headers = this.composeHeaders(initialHeaders, skipAuth, body);

    const response = await fetch(this.buildUrl(endpoint), {
      credentials: rest.credentials ?? 'include',
      ...rest,
      body,
      headers,
    });

    if (response.status === 204) {
      return { success: true, data: null as T }; // explicit null
    }

    let payload: ApiPayload<T> | null = null;
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        payload = await response.json();
      } catch (error) {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }
    }

    if (!response.ok) {
      const message = payload?.message || `HTTP ${response.status}`;
      const err = new Error(message) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    if (payload) {
      return payload;
    }

    return { success: true, data: (null as unknown) as T };
  }

  /* =============================
   *  Session helpers
   * ============================= */

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  getStoredUser<T = any>(): T | null {
    if (!isBrowser) return null;
    const raw = window.sessionStorage.getItem(USER_STORAGE_KEY) ?? null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setStoredUser(user: unknown): void {
    if (!isBrowser) return;
    if (user === null || user === undefined) {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  clearStoredUser(): void {
    if (!isBrowser) return;
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
  }

  persistSession(token: string, user?: unknown, days = 1): void {
    Cookies.set('access_token', token, { ...cookieDefaults, expires: days });
    if (user !== undefined) {
      this.setStoredUser(user);
    }
  }

  logout(): void {
    Cookies.remove('access_token');
    this.clearStoredUser();
  }

  getCurrentUser<T = any>() {
    return this.getStoredUser<T>();
  }

  setCurrentUser(user: unknown) {
    this.setStoredUser(user);
  }

  /* =============================
   *  Auth endpoints
   * ============================= */

  async login(email: string, password: string): Promise<ApiPayload>;
  async login(payload: { email: string; password: string }): Promise<ApiPayload>;
  async login(
    emailOrPayload: string | { email: string; password: string },
    maybePassword?: string,
  ): Promise<ApiPayload> {
    const payload = typeof emailOrPayload === 'string'
      ? { email: emailOrPayload, password: maybePassword ?? '' }
      : emailOrPayload;

    const response = await this.request('/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });

    if (response.success && response.access_token) {
      this.persistSession(response.access_token, response.user);
    }
    return response;
  }

  /* =============================
   *  Domain endpoints
   * ============================= */

  async getSitesForUser() {
    const { data } = await this.request<Array<any>>('/sites');
    return Array.isArray(data) ? data : [];
  }

  async getAllSitesForAdmin() {
    const { data } = await this.request<Array<any>>('/sites/all');
    return Array.isArray(data) ? data : [];
  }

  async getDashboardStats() {
    const { data } = await this.request<DashboardStats>('/dashboard/stats');
    return data as DashboardStats;
  }

  async createSite(body: Record<string, unknown>) {
    const { data } = await this.request('/sites', { method: 'POST', body });
    return data;
  }

  async updateSite(id: number, body: Record<string, unknown>) {
    const { data } = await this.request(`/sites/${id}`, { method: 'PUT', body });
    return data;
  }

  async deleteSite(id: number) {
    await this.request(`/sites/${id}`, { method: 'DELETE' });
    return true;
  }

  async getSiteUsers(siteId: number) {
    const { data } = await this.request<Array<any>>(`/sites/${siteId}/users`);
    return Array.isArray(data) ? data : [];
  }

  async assignUserByEmail(siteId: number, email: string) {
    return this.request(`/sites/${siteId}/users/by-email`, {
      method: 'POST',
      body: { email },
    });
  }

  async removeUserFromSite(siteId: number, userId: number) {
    await this.request(`/sites/${siteId}/users/${userId}`, { method: 'DELETE' });
    return true;
  }

  async getSiteDevices(siteId: number) {
    const { data } = await this.request<Array<any>>(`/sites/${siteId}/devices`);
    return Array.isArray(data) ? data : [];
  }

  async createDevice(siteId: number, body: Record<string, unknown>) {
    const { data } = await this.request(`/sites/${siteId}/devices`, { method: 'POST', body });
    return data;
  }

  async bulkCreateDevices(siteId: number, devices: Array<Record<string, unknown>>) {
    const { data } = await this.request(`/sites/${siteId}/devices/bulk`, {
      method: 'POST',
      body: { devices },
    });
    return data;
  }

  async updateDevice(siteId: number, deviceId: number, body: Record<string, unknown>) {
    const { data } = await this.request(`/sites/${siteId}/devices/${deviceId}`, {
      method: 'PUT',
      body,
    });
    return data;
  }

  async deleteDevice(siteId: number, deviceId: number) {
    await this.request(`/sites/${siteId}/devices/${deviceId}`, { method: 'DELETE' });
    return true;
  }

  async getTailscaleDevices() {
    const { data } = await this.request<Array<{
      id: string | null;
      name: string;
      hostname: string | null;
      addresses: string[];
      primaryIp: string | null;
      macAddress: string | null;
      os: string | null;
      lastSeen: string | null;
      tags: string[];
    }>>('/tailscale/devices');
    return Array.isArray(data) ? data : [];
  }

  async exportSites(format: 'csv' | 'xml', scope: 'all' | 'mine', q?: string) {
    const params = new URLSearchParams({ format, scope });
    if (q?.trim()) params.set('q', q.trim());

    const url = this.buildUrl(`/sites/export?${params.toString()}`);
    const headers = this.composeHeaders(undefined, false, undefined);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const maybeJson = await response.json().catch(() => null);
      const message = maybeJson?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const cd = response.headers.get('Content-Disposition') || '';
    const match = /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
    const suggested = match ? decodeURIComponent(match[2]) : `sites_export.${format}`;

    const blob = await response.blob();
    return { blob, filename: suggested };
  }

  async getAlerts() {
    // Placeholder: backend aún no expone alertas dedicadas
    return [] as Array<unknown>;
  }

  async getSites() {
    return this.getSitesForUser();
  }

  async getAllSites() {
    return this.getAllSitesForAdmin();
  }

  async getProfile() {
    try {
      const response = await this.request<any>('/profile/me');
      if (response.success && response.data) {
        this.setCurrentUser(response.data);
        return response.data;
      }
      throw new Error(response.message || 'Perfil no disponible');
    } catch (error) {
      const stored = this.getStoredUser();
      if (stored) return stored;
      throw error instanceof Error
        ? error
        : new Error('No se pudo obtener el perfil del usuario');
    }
  }

  async updateProfile(payload: {
    nombre?: string;
    preferredLanguage?: string;
    timezone?: string;
    notifyByEmail?: boolean;
  }) {
    const response = await this.request<any>('/profile/me', {
      method: 'PATCH',
      body: payload,
    });

    if (response.success && response.data) {
      this.setCurrentUser(response.data);
      return response.data;
    }

    throw new Error(response.message || 'No se pudo actualizar el perfil');
  }
}

export const apiService = new ApiService();

export const createApiService = (base?: string | (() => string)) => {
  if (!base) return new ApiService();
  if (typeof base === 'function') return new ApiService(base);
  return new ApiService(() => base);
};
