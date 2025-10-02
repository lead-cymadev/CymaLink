import { useMemo, useState } from 'react';
import Cookies from 'js-cookie';

const RAW_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_SHORT_URL || "http://localhost:8000";
const API_BASE_URL = `${RAW_BACKEND_URL.replace(/\/$/, '')}/api`;

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = Cookies.get("access_token") || null;
  }
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers });
    const payload = res.status !== 204 ? await res.json().catch(() => ({})) : { success: true, data: null };
    if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`);
    return payload;
  }
  async createSite(payload: { nombre: string; ubicacion?: string }) {
    const r = await this.fetch('/sites', { method: 'POST', body: JSON.stringify(payload) });
    return r.data;
  }
}

export function CreateSiteForm({ onCreated }: { onCreated: () => void }) {
  const api = useMemo(() => new ApiService(API_BASE_URL), []);
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!nombre.trim()) return setErr('El nombre es obligatorio.');
    try {
      setLoading(true);
      await api.createSite({ nombre: nombre.trim(), ubicacion: ubicacion.trim() || undefined });
      setNombre('');
      setUbicacion('');
      onCreated();
    } catch (error: any) {
      setErr(error?.message || 'Error al crear sitio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">Crear nuevo sitio</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nombre del sitio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Ubicación (opcional)"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        disabled={loading}
        className="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Creando...' : 'Crear sitio'}
      </button>
    </form>
  );
}
