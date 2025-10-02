// components/dashboard/DashboardClient.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { LoadingSpinner, ErrorMessage } from "./common/ui";
import { resolveUserRole } from "./common/helpers";
import type { User, Site, DashboardStats } from "./common/types";
import ApiService from "@/lib/api/ApiService";

import AdminDashboard from "./admin/AdminDashboard";
import UserDashboard from "./user/UserDashboard";

function useDashboard(user: User | null) {
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiService = useMemo(() => new ApiService(process.env.NEXT_PUBLIC_API_BASE_URL ?? ""), []);
  const isAdmin = resolveUserRole(user) === "admin";

  const redirectToLogin = useCallback(() => {
    Cookies.remove("access_token");
    localStorage.removeItem("user");
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

      const [sitesData, statsData] = await Promise.all([isAdmin ? apiService.getAllSitesForAdmin() : apiService.getSitesForUser(), apiService.getDashboardStats()]);

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
  }, [user, isAdmin, apiService, redirectToLogin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { sites, stats, loading, error, refetch: fetchDashboardData };
}

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = useCallback(() => {
    Cookies.remove("access_token");
    localStorage.removeItem("user");
    window.location.href = "/auth/login";
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = Cookies.get("access_token");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error al parsear datos de usuario, cerrando sesión.", e);
        handleLogout();
      }
    } else {
      window.location.href = "/auth/login";
    }
  }, [handleLogout]);

  const { sites, stats, loading, error, refetch } = useDashboard(user);
  const resolvedRole = resolveUserRole(user);
  const isAdmin = resolvedRole === "admin";

  if (!user || loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!stats) return <ErrorMessage message={"No se pudieron cargar las estadísticas del dashboard."} onRetry={refetch} />;

  return isAdmin ? (
    <AdminDashboard user={user} sites={sites} stats={stats} onLogout={handleLogout} onRefetch={refetch} />
  ) : (
    <UserDashboard user={user} sites={sites} onLogout={handleLogout} onRefetch={refetch} />
  );
}
