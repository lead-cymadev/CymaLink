// components/dashboard/DashboardClient.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage } from "./common/ui";
import { resolveUserRole } from "./common/helpers";
import type { User, Site, DashboardStats } from "./common/types";
import { apiService } from "@/lib/api/ApiService";
import { LanguageProvider, inferLanguage, type Language } from "@/lib/i18n";

import AdminDashboard from "./admin/AdminDashboard";
import UserDashboard from "./user/UserDashboard";

function useDashboard(user: User | null) {
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = resolveUserRole(user) === "admin";

  const redirectToLogin = useCallback(() => {
    apiService.logout();
    window.location.href = "/auth/login";
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [sitesData, statsData] = await Promise.all([
        isAdmin ? apiService.getAllSitesForAdmin() : apiService.getSitesForUser(),
        apiService.getDashboardStats(),
      ]);

      setSites(Array.isArray(sitesData) ? sitesData : []);
      setStats(statsData ?? null);
    } catch (err: any) {
      const msg: string = err?.message || "Error desconocido";
      const status = err?.status as number | undefined;
      if (status === 401 || status === 403 || /token/i.test(msg)) {
        redirectToLogin();
        return;
      }
      setError(msg);
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, redirectToLogin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { sites, stats, loading, error, refetch: fetchDashboardData };
}

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [language, setLanguage] = useState<Language>("es");

  const handleLogout = useCallback(() => {
    apiService.logout();
    window.location.href = "/auth/login";
  }, []);

  useEffect(() => {
    const init = async () => {
      const tokenPresent = apiService.isAuthenticated();
      if (!tokenPresent) {
        window.location.href = "/auth/login";
        return;
      }

      try {
        const profile = await apiService.getProfile();
        setUser(profile as User);
        setLanguage(inferLanguage({
          preferredLanguage: (profile as User).preferredLanguage,
          timezone: (profile as User).timezone,
        }));
      } catch (error) {
        const storedUser = apiService.getStoredUser<User>();
        if (storedUser) {
          setUser(storedUser);
          setLanguage(inferLanguage({
            preferredLanguage: storedUser.preferredLanguage,
            timezone: storedUser.timezone,
          }));
          return;
        }

        console.error("No se pudo cargar el perfil del usuario:", error);
        window.location.href = "/auth/login";
      } finally {
        setLoadingUser(false);
      }
    };

    init();
  }, []);

  const { sites, stats, loading, error, refetch } = useDashboard(user);
  const resolvedRole = resolveUserRole(user);
  const isAdmin = resolvedRole === "admin";

  const handleUserChange = (updated: User) => {
    setUser(updated);
    setLanguage(inferLanguage({ preferredLanguage: updated.preferredLanguage, timezone: updated.timezone }));
  };

  const renderContent = () => {
    if (loadingUser || !user || loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={refetch} />;
    if (!stats) {
      return <ErrorMessage message={"No se pudieron cargar las estadísticas del dashboard."} onRetry={refetch} />;
    }

    return isAdmin ? (
      <AdminDashboard
        user={user}
        sites={sites}
        stats={stats}
        onLogout={handleLogout}
        onRefetch={refetch}
        onUserChange={handleUserChange}
      />
    ) : (
      <UserDashboard
        user={user}
        sites={sites}
        onLogout={handleLogout}
        onRefetch={refetch}
        onUserChange={handleUserChange}
      />
    );
  };

  return (
    <LanguageProvider language={language}>
      {renderContent()}
    </LanguageProvider>
  );
}
