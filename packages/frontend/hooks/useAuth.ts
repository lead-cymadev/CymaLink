// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
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
    // Verificar si hay un usuario guardado en localStorage
    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const userData = apiService.getCurrentUser();
          if (userData) {
            // Verificar que el token sigue siendo válido obteniendo el perfil
            try {
              const profile = await apiService.getProfile();
              setUser(profile);
            } catch (error) {
              // Token inválido, limpiar
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Hacer todas las peticiones en paralelo
        const [sitesData, statsData, alertsData] = await Promise.all([
          isAdmin ? apiService.getAllSites() : apiService.getSites(),
          apiService.getDashboardStats(),
          apiService.getAlerts()
        ]);

        setSites(sitesData);
        setStats(statsData);
        setAlerts(alertsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAdmin]);

  const refetch = async () => {
    if (user) {
      await fetchDashboardData();
    }
  };

  return { sites, stats, alerts, loading, error, refetch };
}