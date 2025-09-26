"use client";
import {
  BellIcon,
  ChartBarIcon,
  ChevronDownIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  GlobeAltIcon,
  PlusIcon,
  PowerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UsersIcon,
  WifiIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

// --- TIPOS BASADOS EN TU BACKEND ---
type User = {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
};

type Status = {
  nombre: string;
};

type Device = {
  id: number;
  nombre: string;
  macAddress: string;
  ipAddress: string;
  Status: Status;
};

type Site = {
  id: number;
  nombre: string;
  ubicacion: string;
  Raspberries: Device[];
  Users?: User[]; // Solo disponible en la vista de admin
};

type DashboardStats = {
  totalSites: number;
  onlineDevices: number;
  totalDevices: number;
  alerts: number;
  systemHealth: string;
};

// --- SERVICIOS PARA API ---
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = "http://localhost:8000/api";
    // En un entorno real, el token vendría de localStorage
    this.token = "your-jwt-token-here";
  }

  setToken(token: string) {
    this.token = token;
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

  async getSites(): Promise<Site[]> {
    const response = await this.fetch('/sites/');
    return response.data || [];
  }

  async getAllSites(): Promise<Site[]> {
    const response = await this.fetch('/sites/all');
    return response.data || [];
  }

  async login(email: string, password: string) {
    const response = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }
}

// --- HOOK PERSONALIZADO PARA DASHBOARD ---
function useDashboard(user: User | null) {
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSites: 0,
    onlineDevices: 0,
    totalDevices: 0,
    alerts: 0,
    systemHealth: 'Excelente'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiService = new ApiService();

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Decidir qué endpoint usar según el rol
        const sitesData = user.rol === 'admin' 
          ? await apiService.getAllSites()
          : await apiService.getSites();

        setSites(sitesData);

        // Calcular estadísticas
        const totalSites = sitesData.length;
        const allDevices = sitesData.flatMap(site => site.Raspberries || []);
        const totalDevices = allDevices.length;
        const onlineDevices = allDevices.filter(device => 
          device.Status?.nombre?.toLowerCase() === 'online'
        ).length;
        
        // Simular alertas (dispositivos offline)
        const alerts = totalDevices - onlineDevices;
        
        // Determinar salud del sistema
        const healthPercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 100;
        let systemHealth = 'Crítico';
        if (healthPercentage >= 90) systemHealth = 'Excelente';
        else if (healthPercentage >= 70) systemHealth = 'Bueno';
        else if (healthPercentage >= 50) systemHealth = 'Regular';

        setStats({
          totalSites,
          onlineDevices,
          totalDevices,
          alerts,
          systemHealth
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return { sites, stats, loading, error, refetch: () => {} };
}

// --- COMPONENTE DE LOADING ---
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-600">Cargando dashboard...</p>
      </div>
    </div>
  );
}

// --- COMPONENTE DE ERROR ---
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full mx-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error al cargar datos</h3>
          <p className="text-slate-600 mb-6">{message}</p>
          <button 
            onClick={onRetry}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD PARA ADMINISTRADOR ---
function AdminDashboard({ user, sites, stats }: { user: User; sites: Site[]; stats: DashboardStats }) {
  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-screen font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-5 lg:grid-rows-5 gap-6 h-full">
        
        {/* === HEADER === */}
        <header className="lg:col-start-2 lg:col-span-3 bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Vista Global de Administrador</h1>
            <p className="text-slate-500">Supervisando {stats.totalSites} sitios y {stats.totalDevices} dispositivos.</p>
          </div>
          <button className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 flex items-center transition-colors">
            <PlusIcon className="h-5 w-5 mr-2" />
            Añadir Sitio
          </button>
        </header>

        {/* === SIDEBAR === */}
        <aside className="lg:row-span-3 bg-white p-6 rounded-xl shadow-sm flex flex-col">
          <div className="text-2xl font-bold text-indigo-600 mb-10">CymaLink</div>
          <nav className="flex-grow space-y-2">
            <a href="#" className="flex items-center p-3 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
              <ChartBarIcon className="h-6 w-6 mr-3" /> Dashboard
            </a>
            <a href="#" className="flex items-center p-3 text-slate-600 hover:bg-slate-50 rounded-lg">
              <UsersIcon className="h-6 w-6 mr-3" /> Gestionar Usuarios
            </a>
            <a href="#" className="flex items-center p-3 text-slate-600 hover:bg-slate-50 rounded-lg">
              <BellIcon className="h-6 w-6 mr-3" /> Alertas Globales
            </a>
          </nav>
          <div className="border-t pt-6">
            <div className="flex items-center">
              <UserCircleIcon className="h-10 w-10 text-slate-400 mr-3" />
              <div>
                <p className="font-semibold text-slate-800">{user.nombre}</p>
                <p className="text-sm text-slate-500 capitalize">{user.rol}</p>
              </div>
              <button className="ml-auto text-slate-500 hover:text-red-600">
                <PowerIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </aside>

        {/* === KPI CARDS === */}
        <div className="lg:col-start-2 lg:row-start-2 bg-white p-5 rounded-xl shadow-sm flex items-center">
          <div className="bg-blue-100 p-3 rounded-full"><GlobeAltIcon className="h-6 w-6 text-blue-600" /></div>
          <div className="ml-4">
            <p className="text-slate-500 text-sm">Total Sitios</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalSites}</p>
          </div>
        </div>
        
        <div className="lg:col-start-3 lg:row-start-2 bg-white p-5 rounded-xl shadow-sm flex items-center">
          <div className="bg-green-100 p-3 rounded-full"><WifiIcon className="h-6 w-6 text-green-600" /></div>
          <div className="ml-4">
            <p className="text-slate-500 text-sm">Dispositivos Online</p>
            <p className="text-2xl font-bold text-slate-800">{stats.onlineDevices} / {stats.totalDevices}</p>
          </div>
        </div>
        
        <div className="lg:col-start-2 lg:row-start-3 bg-white p-5 rounded-xl shadow-sm flex items-center">
          <div className="bg-red-100 p-3 rounded-full"><BellIcon className="h-6 w-6 text-red-600" /></div>
          <div className="ml-4">
            <p className="text-slate-500 text-sm">Alertas Activas</p>
            <p className="text-2xl font-bold text-slate-800">{stats.alerts}</p>
          </div>
        </div>
        
        <div className="lg:col-start-3 lg:row-start-3 bg-white p-5 rounded-xl shadow-sm flex items-center">
          <div className="bg-purple-100 p-3 rounded-full"><ShieldCheckIcon className="h-6 w-6 text-purple-600" /></div>
          <div className="ml-4">
            <p className="text-slate-500 text-sm">Salud del Sistema</p>
            <p className={`text-2xl font-bold ${
              stats.systemHealth === 'Excelente' ? 'text-green-600' :
              stats.systemHealth === 'Bueno' ? 'text-yellow-600' : 'text-red-600'
            }`}>{stats.systemHealth}</p>
          </div>
        </div>

        {/* === TABLA DE SITIOS === */}
        <div className="lg:col-start-2 lg:col-span-4 lg:row-start-4 lg:row-span-2 bg-white p-6 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Todos los Sitios</h2>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left">
              <thead className="text-sm text-slate-500">
                <tr>
                  <th className="p-3">Sitio</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">Dispositivos</th>
                  <th className="p-3">Online</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Propietarios</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sites.map(site => {
                  const devices = site.Raspberries || [];
                  const onlineDevices = devices.filter(d => d.Status?.nombre?.toLowerCase() === 'online').length;
                  const status = onlineDevices === devices.length ? 'ok' : onlineDevices > 0 ? 'warning' : 'error';
                  
                  return (
                    <tr key={site.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-700">{site.nombre}</td>
                      <td className="p-3 text-slate-600">{site.ubicacion}</td>
                      <td className="p-3 text-slate-600">{devices.length}</td>
                      <td className="p-3 text-slate-600">{onlineDevices}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          status === 'ok' ? 'bg-green-100 text-green-700' :
                          status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {status === 'ok' ? 'Operativo' : status === 'warning' ? 'Parcial' : 'Alerta'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {site.Users?.length || 0} usuario(s)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD PARA USUARIO ---
function UserDashboard({ user, sites }: { user: User; sites: Site[] }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100 font-sans">
      {/* === SIDEBAR === */}
      <aside className="w-full lg:w-64 bg-white p-6 shadow-lg flex-shrink-0">
        <div className="text-2xl font-bold text-indigo-600 mb-10">CymaLink</div>
        <nav className="space-y-2">
          <a href="#" className="flex items-center p-3 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
            <WifiIcon className="h-6 w-6 mr-3" /> Mis Sitios
          </a>
          <a href="#" className="flex items-center p-3 text-slate-600 hover:bg-slate-50 rounded-lg">
            <BellIcon className="h-6 w-6 mr-3" /> Mis Alertas
          </a>
          <a href="#" className="flex items-center p-3 text-slate-600 hover:bg-slate-50 rounded-lg">
            <Cog6ToothIcon className="h-6 w-6 mr-3" /> Ajustes
          </a>
        </nav>
        <div className="mt-auto border-t pt-6">
          <div className="flex items-center">
            <UserCircleIcon className="h-10 w-10 text-slate-400 mr-3" />
            <div>
              <p className="font-semibold text-slate-800">{user.nombre}</p>
              <p className="text-sm text-slate-500 capitalize">{user.rol}</p>
            </div>
            <button className="ml-auto text-slate-500 hover:text-red-600">
              <PowerIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </aside>

      {/* === CONTENIDO PRINCIPAL === */}
      <main className="flex-1 p-6 lg:p-10">
        <header className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">Mis Sitios</h1>
          <p className="text-slate-500 mt-1">Monitoreando tus {sites.length} sitios asignados.</p>
        </header>
        
        {sites.length === 0 ? (
          <div className="text-center py-12">
            <GlobeAltIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No tienes sitios asignados</h3>
            <p className="text-slate-500">Contacta a tu administrador para que te asigne sitios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sites.map(site => {
              const devices = site.Raspberries || [];
              const onlineDevices = devices.filter(d => d.Status?.nombre?.toLowerCase() === 'online');
              const offlineDevices = devices.filter(d => d.Status?.nombre?.toLowerCase() !== 'online');
              const status = onlineDevices.length === devices.length ? 'ok' : onlineDevices.length > 0 ? 'warning' : 'error';
              
              return (
                <div key={site.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{site.nombre}</h2>
                      <p className="text-sm text-slate-500">{site.ubicacion}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      status === 'ok' ? 'bg-green-100 text-green-700' :
                      status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {status === 'ok' ? 'Operativo' : status === 'warning' ? 'Parcial' : 'Alerta'}
                    </span>
                  </div>
                  <div className="mt-6 border-t pt-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Dispositivos</p>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span><WifiIcon className="h-5 w-5 inline mr-2 text-green-500"/>Online</span>
                      <span className="font-bold">{onlineDevices.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 mt-1">
                      <span><WifiIcon className="h-5 w-5 inline mr-2 text-red-500"/>Offline</span>
                      <span className="font-bold">{offlineDevices.length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function DashboardPage() {
  // Simulación de usuario autenticado (en tu app real vendrá del contexto de autenticación)
  const [user, setUser] = useState<User | null>({
    id: 1,
    nombre: "Admin General",
    email: "admin@cymatel.com",
    rol: "admin"
  });

  const { sites, stats, loading, error, refetch } = useDashboard(user);

  // Simulador de cambio de rol para testing
  const toggleRole = () => {
    setUser(prev => prev ? {
      ...prev,
      rol: prev.rol === 'admin' ? 'usuario' : 'admin',
      nombre: prev.rol === 'admin' ? 'Usuario Cliente' : 'Admin General',
      email: prev.rol === 'admin' ? 'cliente@empresa.com' : 'admin@cymatel.com'
    } : null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!user) return <div>No hay usuario autenticado</div>;

  return (
    <>
      {/* Botón para simular cambio de rol */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={toggleRole}
          className="bg-black text-white px-4 py-2 rounded-full shadow-lg font-semibold"
        >
          Ver como: {user.rol === 'admin' ? 'Usuario' : 'Admin'}
        </button>
      </div>

      {/* Renderizado condicional del Dashboard */}
      {user.rol === 'admin' 
        ? <AdminDashboard user={user} sites={sites} stats={stats} /> 
        : <UserDashboard user={user} sites={sites} />
      }
    </>
  );
}