"use client";
import {
  ArrowPathIcon,
  Bars3Icon,
  ChevronRightIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  PowerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UsersIcon,
  WifiIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import Cookies from 'js-cookie';
// Se elimina la importación de 'next/navigation' para evitar el error de compilación.

// --- CONFIGURACIÓN CENTRAL DE LA API ---
const RAW_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_SHORT_URL || "http://localhost:8000";
const API_BASE_URL = `${RAW_BACKEND_URL.replace(/\/$/, '')}/api`;

const BRAND_RED_GRADIENT = 'from-red-600 via-red-500 to-red-600';
const BRAND_RED_LIGHT_GRADIENT = 'from-red-500 via-red-400 to-red-500';
const BRAND_BLUE_GRADIENT = 'from-blue-600 via-blue-500 to-blue-600';

// --- TIPOS ---
type UserRole = 'admin' | 'usuario';

type User = {
  id: number;
  nombre: string;
  email: string;
  rol?: UserRole;
  idRol?: number;
  Rol?: {
    NombreRol: string;
  };
};

type Status = {
  nombre: string;
};

type Device = {
  id: number;
  nombre: string;
  macAddress: string;
  ipAddress: string;
  Status?: Status;
};

type Site = {
  id: number;
  nombre: string;
  ubicacion: string;
  Raspberries: Device[];
  Users?: User[];
};

type DashboardStats = {
  totalSites: number;
  onlineDevices: number;
  totalDevices: number;
  alerts: number;
  systemHealth: string;
  healthPercentage?: number;
};

// --- SERVICIO DE API ---
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = Cookies.get("access_token") || null;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (response.status === 204) return null;
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async getSitesForUser(): Promise<Site[]> {
    const response = await this.fetch('/sites');
    return response.data || [];
  }

  async getAllSitesForAdmin(): Promise<Site[]> {
    const response = await this.fetch('/sites/all');
    return response.data || [];
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.fetch('/dashboard/stats');
    return response.data;
  }
}

// --- HOOK PARA EL DASHBOARD ---
function resolveUserRole(user: User | null): UserRole {
  if (!user) return 'usuario';

  const directRole = user.rol?.toLowerCase();
  if (directRole === 'admin' || directRole === 'usuario') {
    return directRole;
  }

  const associationRole = user.Rol?.NombreRol?.toLowerCase();
  if (associationRole === 'admin' || associationRole === 'usuario') {
    return associationRole;
  }

  if (user.idRol === 1) return 'admin';

  return 'usuario';
}

function useDashboard(user: User | null) {
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    };
    
    const apiService = new ApiService(API_BASE_URL);
    const isAdmin = resolveUserRole(user) === 'admin';

    try {
      setLoading(true);
      setError(null);

      const [sitesData, statsData] = await Promise.all([
        isAdmin
          ? apiService.getAllSitesForAdmin()
          : apiService.getSitesForUser(),
        apiService.getDashboardStats()
      ]);

      setSites(sitesData);
      setStats(statsData);

    } catch (err) {
      if (err instanceof Error && (err.message.includes('401') || err.message.toLowerCase().includes('token'))) {
         window.location.href = "/auth/login"; // Redirigir si el token es inválido
      }
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { sites, stats, loading, error, refetch: fetchDashboardData };
}

// --- COMPONENTES AUXILIARES ---
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p className="text-slate-600">Cargando dashboard...</p>
      </div>
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full mx-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error al Cargar Datos</h3>
          <p className="text-slate-600 mb-6">{message}</p>
          <button 
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- VISTAS DE DASHBOARD ---
type NavItem = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
  active?: boolean;
};

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: ChartBarIcon, active: true },
  { label: 'Dispositivos', icon: WifiIcon, badge: 'Live' },
  { label: 'Clientes', icon: UsersIcon },
  { label: 'Aplicaciones', icon: GlobeAltIcon },
  { label: 'Seguridad', icon: ShieldCheckIcon },
  { label: 'Configuración', icon: Cog6ToothIcon },
];

const USER_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: ChartBarIcon, active: true },
  { label: 'Mis sitios', icon: WifiIcon },
  { label: 'Aplicaciones', icon: GlobeAltIcon },
  { label: 'Soporte', icon: ShieldCheckIcon },
];

function SidebarContent({ user, roleLabel, onLogout, navItems, onClose }: { user: User; roleLabel: UserRole; onLogout: () => void; navItems: NavItem[]; onClose?: () => void; }) {
  return (
    <div className="flex h-full flex-col pb-6">
      <div className="flex items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">CymaLink</p>
          <h2 className="text-xl font-bold text-blue-900">Network Center</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 capitalize">{roleLabel}</span>
          {onClose && (
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:text-red-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-4">
        {navItems.map(item => (
          <button
            key={item.label}
            className={`flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              item.active
                ? 'bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-700 shadow-sm'
                : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
            }`}
            onClick={onClose}
          >
            <item.icon className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto px-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center">
            <UserCircleIcon className="mr-3 h-10 w-10 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">{user.nombre}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <button onClick={onLogout} className="text-slate-400 transition hover:text-red-600">
              <PowerIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, roleLabel, onLogout, navItems }: { user: User; roleLabel: UserRole; onLogout: () => void; navItems: NavItem[]; }) {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/95 pb-6 backdrop-blur lg:flex">
      <SidebarContent user={user} roleLabel={roleLabel} onLogout={onLogout} navItems={navItems} />
    </aside>
  );
}

function MobileNavBar({ navItems }: { navItems: NavItem[] }) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
      {navItems.map(item => (
        <button
          key={item.label}
          className={`inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            item.active
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600'
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function MobileNavSheet({ open, onClose, user, roleLabel, navItems, onLogout }: { open: boolean; onClose: () => void; user: User; roleLabel: UserRole; navItems: NavItem[]; onLogout: () => void; }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white shadow-xl">
        <SidebarContent user={user} roleLabel={roleLabel} onLogout={onLogout} navItems={navItems} onClose={onClose} />
      </div>
    </div>
  );
}

function DashboardTopBar({ title, subtitle, actions, onRefresh, onMenuToggle, navItems }: { title: string; subtitle: string; actions?: ReactNode; onRefresh?: () => void; onMenuToggle?: () => void; navItems?: NavItem[]; }) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-300 hover:text-red-600 lg:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">CymaLink</p>
            <h1 className="text-2xl font-semibold text-blue-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <MagnifyingGlassIcon className="mr-2 h-5 w-5 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar sitios o dispositivos"
              className="w-64 border-none bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 sm:flex">
            <BellIcon className="h-5 w-5" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
          {actions}
        </div>
      </div>
      {navItems && <MobileNavBar navItems={navItems} />}
    </header>
  );
}

function SummaryCard({ title, value, icon: Icon, footnote, accent }: { title: string; value: string | number; icon: ComponentType<SVGProps<SVGSVGElement>>; footnote?: string; accent: string; }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-br ${accent} opacity-20 blur-3xl`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-blue-900">{value}</p>
          {footnote && <p className="mt-3 text-xs font-medium text-slate-500">{footnote}</p>}
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

function SummaryGrid({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: 'Sitios totales',
      value: stats.totalSites,
      icon: GlobeAltIcon,
      footnote: 'Distribución global monitoreada',
      accent: BRAND_BLUE_GRADIENT,
    },
    {
      title: 'Dispositivos monitoreados',
      value: stats.totalDevices,
      icon: ShieldCheckIcon,
      footnote: `${stats.onlineDevices} en línea actualmente`,
      accent: BRAND_RED_GRADIENT,
    },
    {
      title: 'Salud del sistema',
      value: stats.systemHealth,
      icon: ChartBarIcon,
      footnote: stats.healthPercentage ? `${stats.healthPercentage}% disponibilidad` : undefined,
      accent: BRAND_BLUE_GRADIENT,
    },
    {
      title: 'Alertas activas',
      value: stats.alerts,
      icon: BellIcon,
      footnote: stats.alerts > 0 ? 'Revisa los dispositivos con incidencias' : 'Todo funcionando al 100%',
      accent: BRAND_RED_LIGHT_GRADIENT,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status?.toLowerCase();
  const styles = value === 'online'
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : value === 'offline'
      ? 'bg-rose-100 text-rose-700 border border-rose-200'
      : 'bg-slate-100 text-slate-600 border border-slate-200';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {status ?? 'Sin estado'}
    </span>
  );
}

function SiteHealthBadge({ raspberries }: { raspberries?: Device[] }) {
  const devices = raspberries ?? [];
  const total = devices.length;
  if (total === 0) {
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Sin dispositivos</span>;
  }

  const online = devices.filter(device => device.Status?.nombre?.toLowerCase() === 'online').length;
  const ratio = online / total;

  let label = 'Crítico';
  let styles = 'bg-red-100 text-red-700 border border-red-200';

  if (ratio >= 0.9) {
    label = 'Excelente';
    styles = 'bg-blue-100 text-blue-700 border border-blue-200';
  } else if (ratio >= 0.7) {
    label = 'Estable';
    styles = 'bg-blue-50 text-blue-600 border border-blue-200';
  } else if (ratio >= 0.5) {
    label = 'Vigilancia';
    styles = 'bg-amber-100 text-amber-700 border border-amber-200';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

function QuickActionCard({ icon: Icon, title, description }: { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; description: string; }) {
  return (
    <button className="group flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-red-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-blue-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </button>
  );
}

function QuickActionsBar() {
  const options = [
    { icon: PlusIcon, title: 'Registrar sitio', description: 'Crea un nuevo sitio y define su cobertura.' },
    { icon: UsersIcon, title: 'Asignar usuarios', description: 'Incorpora equipos de operación al sitio.' },
    { icon: Cog6ToothIcon, title: 'Plantillas de configuración', description: 'Aplica configuraciones consistentes rápidamente.' },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {options.map(option => (
        <QuickActionCard key={option.title} {...option} />
      ))}
    </section>
  );
}

function SiteTable({ sites }: { sites: Site[] }) {
  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-700">Aún no hay sitios registrados</h3>
        <p className="mt-2 text-sm text-slate-500">Utiliza las acciones rápidas para crear un sitio y comenzar el monitoreo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Inventario de sitios</h3>
          <p className="text-sm text-slate-500">Monitorea el estado operativo y los dispositivos desplegados.</p>
        </div>
        <button className="hidden items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-red-300 hover:text-red-600 sm:flex">
          <EllipsisHorizontalIcon className="mr-1.5 h-5 w-5" /> Gestionar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-3">Sitio</th>
              <th className="px-6 py-3">Dispositivos</th>
              <th className="px-6 py-3">Usuarios asignados</th>
              <th className="px-6 py-3">Salud</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sites.map(site => {
              const devices = site.Raspberries ?? [];
              const totalDevices = devices.length;
              const onlineDevices = devices.filter(device => device.Status?.nombre?.toLowerCase() === 'online').length;
              const percentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
              const assignedUsers = site.Users?.length ?? 0;

              return (
                <tr key={site.id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4 align-top">
                    <p className="font-semibold text-blue-900">{site.nombre}</p>
                    <p className="mt-1 flex items-center text-xs text-slate-500">
                      <MapPinIcon className="mr-1.5 h-4 w-4" />
                      {site.ubicacion || 'Ubicación no definida'}
                    </p>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-blue-900">{onlineDevices}/{totalDevices} en línea</div>
                    <div className="mt-2 h-1.5 w-36 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {devices.slice(0, 3).map(device => (
                        <StatusBadge key={device.id} status={device.Status?.nombre ?? 'Desconocido'} />
                      ))}
                      {devices.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          +{devices.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {assignedUsers > 0 ? (
                      <span className="font-semibold text-slate-800">{assignedUsers} usuarios</span>
                    ) : (
                      <span className="text-slate-400">Sin usuarios</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <SiteHealthBadge raspberries={devices} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center rounded-full border border-red-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:bg-red-50">
                      Ver detalles
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserSiteCard({ site }: { site: Site }) {
  const devices = site.Raspberries ?? [];
  const onlineDevices = devices.filter(device => device.Status?.nombre?.toLowerCase() === 'online').length;
  const totalDevices = devices.length;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Sitio asignado</p>
            <h3 className="mt-1 text-xl font-semibold text-blue-900">{site.nombre}</h3>
            <p className="mt-1 flex items-center text-sm text-slate-500">
              <MapPinIcon className="mr-1.5 h-4 w-4" />
              {site.ubicacion || 'Ubicación no definida'}
            </p>
          </div>
          <SiteHealthBadge raspberries={devices} />
        </div>
      </div>
      <div className="flex-1 space-y-4 px-6 py-5">
        {devices.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay dispositivos configurados en este sitio.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>Dispositivo</span>
              <span>Estado</span>
            </div>
            <div className="space-y-2">
              {devices.slice(0, 4).map(device => (
                <div key={device.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{device.nombre}</p>
                    <p className="text-xs text-slate-500">{device.macAddress}</p>
                  </div>
                  <StatusBadge status={device.Status?.nombre ?? 'Desconocido'} />
                </div>
              ))}
            </div>
            {devices.length > 4 && (
              <p className="text-xs font-semibold text-red-600">+{devices.length - 4} dispositivos adicionales</p>
            )}
          </>
        )}
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800">{onlineDevices}/{totalDevices} dispositivos en línea</span>
          <button className="inline-flex items-center text-sm font-semibold text-red-600 transition hover:text-red-700">
            Ver detalles
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function UserSiteGrid({ sites }: { sites: Site[] }) {
  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-700">No tienes sitios asignados</h3>
        <p className="mt-2 text-sm text-slate-500">Comunícate con tu administrador para obtener acceso.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {sites.map(site => (
        <UserSiteCard key={site.id} site={site} />
      ))}
    </div>
  );
}

function AdminDashboard({ user, roleLabel, sites, stats, onLogout, onRefetch }: { user: User; roleLabel: UserRole; sites: Site[]; stats: DashboardStats; onLogout: () => void; onRefetch: () => void; }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar user={user} roleLabel={roleLabel} onLogout={onLogout} navItems={ADMIN_NAV_ITEMS} />
      <div className="flex flex-1 flex-col">
        <DashboardTopBar
          title="Panel global"
          subtitle={`Supervisando ${stats.totalSites} sitios y ${stats.totalDevices} dispositivos activos.`}
          onRefresh={onRefetch}
          onMenuToggle={() => setMobileNavOpen(true)}
          navItems={ADMIN_NAV_ITEMS}
          actions={(
            <button className="inline-flex h-11 items-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">
              <PlusIcon className="mr-2 h-4 w-4" /> Nuevo sitio
            </button>
          )}
        />
        <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
          <SummaryGrid stats={stats} />
          <QuickActionsBar />
          <SiteTable sites={sites} />
        </main>
      </div>
      <MobileNavSheet open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} user={user} roleLabel={roleLabel} navItems={ADMIN_NAV_ITEMS} onLogout={onLogout} />
    </div>
  );
}

function UserDashboard({ user, roleLabel, sites, onLogout, onRefetch }: { user: User; roleLabel: UserRole; sites: Site[]; onLogout: () => void; onRefetch: () => void; }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar user={user} roleLabel={roleLabel} onLogout={onLogout} navItems={USER_NAV_ITEMS} />
      <div className="flex flex-1 flex-col">
        <DashboardTopBar
          title="Panel personal"
          subtitle={`Monitoreando tus ${sites.length} sitios asignados en tiempo real.`}
          onRefresh={onRefetch}
          onMenuToggle={() => setMobileNavOpen(true)}
          navItems={USER_NAV_ITEMS}
        />
        <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
          <UserSiteGrid sites={sites} />
        </main>
      </div>
      <MobileNavSheet open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} user={user} roleLabel={roleLabel} navItems={USER_NAV_ITEMS} onLogout={onLogout} />
    </div>
  );
}


// --- COMPONENTE CLIENTE PRINCIPAL ---
export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  
  const handleLogout = () => {
    Cookies.remove("access_token");
    localStorage.removeItem("user");
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = Cookies.get("access_token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch(e) {
        console.error("Error al parsear datos de usuario, cerrando sesión.", e);
        handleLogout();
      }
    } else {
      // Si no hay usuario o token, redirigir al login.
      window.location.href = "/auth/login";
    }
  }, []);

  const { sites, stats, loading, error, refetch } = useDashboard(user);
  const resolvedRole = resolveUserRole(user);
  const isAdmin = resolvedRole === 'admin';

  if (!user || loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!stats) return <ErrorMessage message={"No se pudieron cargar las estadísticas del dashboard."} onRetry={refetch} />;

  return (
    <>
      {isAdmin 
        ? (
          <AdminDashboard
            user={user}
            roleLabel={resolvedRole}
            sites={sites}
            stats={stats}
            onLogout={handleLogout}
            onRefetch={refetch}
          />
        ) : (
          <UserDashboard
            user={user}
            roleLabel={resolvedRole}
            sites={sites}
            onLogout={handleLogout}
            onRefetch={refetch}
          />
        )
      }
    </>
  );
}
