// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { apiService } from '../services/apiService';

type User = {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const userData = apiService.getCurrentUser();
          if (userData) {
            try {
              const profile = await apiService.getProfile();
              setUser(profile);
            } catch (error) {
              apiService.logout();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.success) {
        const profile = await apiService.getProfile();
        setUser(profile);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Error de login' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Hook separado para el dashboard que usa autenticación
export function useDashboard() {
  const { user, isAdmin } = useAuth();
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // --- MODIFICACIÓN PARA MEJORAR EL DIAGNÓSTICO DE ERRORES ---
      // Se manejan las promesas individualmente para identificar cuál de ellas está fallando.
      const sitesPromise = (isAdmin ? apiService.getAllSites() : apiService.getSites())
        .catch(error => {
          console.error('Error al obtener los sitios (sites):', error);
          // Devuelve un valor por defecto para que Promise.all no falle por completo.
          return []; 
        });

      const statsPromise = apiService.getDashboardStats()
        .catch(error => {
          console.error('Error al obtener las estadísticas (stats):', error);
          return null;
        });

      const alertsPromise = apiService.getAlerts()
        .catch(error => {
          console.error('Error al obtener las alertas (alerts):', error);
          return [];
        });

      // Promise.all ahora recibirá promesas que no se rechazan,
      // permitiendo que la aplicación continúe y mostrando qué datos sí se pudieron cargar.
      const [sitesData, statsData, alertsData] = await Promise.all([
        sitesPromise,
        statsPromise,
        alertsPromise
      ]);

      setSites(sitesData);
      setStats(statsData);
      setAlerts(alertsData);

    } catch (err) {
      // Este bloque catch general ahora es menos probable que se active por fallos de red,
      // pero se mantiene por si ocurre otro tipo de error inesperado.
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error general en fetchDashboardData:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]); // Las dependencias aseguran que la función se actualice si el usuario o su rol cambian.


  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // useEffect ahora depende de la función memoizada.

  return { sites, stats, alerts, loading, error, refetch: fetchDashboardData };
}

