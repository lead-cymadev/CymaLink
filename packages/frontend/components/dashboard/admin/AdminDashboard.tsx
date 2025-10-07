// components/dashboard/admin/AdminDashboard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { DashboardStats, Site } from "../common/types";
import { resolveUserRole, getDevicesOfSite, getUsersOfSite } from "../common/helpers";
import { Sidebar, DashboardTopBar, StatusBadge } from "../common/ui";
import { SummaryGrid } from "../common/summary";
import { QuickActionsBar } from "../common/export";
import { DevicesDirectory, ClientsDirectory } from "./Directories";
import { TailscaleDevicesPanel, type TailscaleDevice } from "./TailscaleDevices";
import UserSettingsPanel from "../common/UserSettingsPanel";

import { apiService } from "@/lib/api/ApiService";
import { AssignUserForm } from "../sites/AssignUserForm";
import { AddDeviceForm } from "../sites/AddDeviceForm";
import ManageSiteModal from "../sites/ManageSiteModal";
import { useI18n, formatMessage } from "@/lib/i18n";

const ADMIN_NAV = ["overview", "devices", "clients", "settings"] as const;
type AdminTab = "overview" | "devices" | "clients" | "settings";
const NAV_FALLBACK: Record<(typeof ADMIN_NAV)[number], string> = {
  overview: "Overview",
  devices: "Dispositivos",
  clients: "Clientes",
  settings: "Configuración",
};

export default function AdminDashboard({
  user,
  sites,
  stats,
  onLogout,
  onRefetch,
  onUserChange,
}: {
  user: any;
  sites: Site[];
  stats: DashboardStats;
  onLogout: () => void;
  onRefetch: () => void;
  onUserChange: (user: any) => void;
}) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const createPanelRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const t = useI18n();

  const [activeSite, setActiveSite] = useState<Site | null>(null);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);

  const [showManage, setShowManage] = useState(false);
  const [manageUsers, setManageUsers] = useState<Array<{ id: number; nombre: string; email: string }>>([]);
  const [manageDevices, setManageDevices] = useState<
    Array<{ id: number; nombre: string; macAddress: string; ipAddress: string | null; status?: { nombre: string }; Status?: { nombre: string } }>
  >([]);
  const [tailscaleDevices, setTailscaleDevices] = useState<TailscaleDevice[]>([]);
  const [tailscaleLoading, setTailscaleLoading] = useState(false);
  const [tailscaleError, setTailscaleError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const api = apiService;
  const activeUser = currentUser ?? user;
  const isAdmin = resolveUserRole(activeUser) === "admin";

  const navItems = ADMIN_NAV.map((key) => ({
    label: t(`nav.${key}`, NAV_FALLBACK[key]),
    value: key,
    icon: PlusIcon,
    active: key === tab,
    onClick: () => setTab(key),
  }));

  const loadTailscaleDevices = useMemo(() => async () => {
    try {
      setTailscaleLoading(true);
      setTailscaleError(null);
      const list = await api.getTailscaleDevices();
      setTailscaleDevices(list);
    } catch (error: any) {
      setTailscaleError(error?.message || "No se pudieron sincronizar los dispositivos de Tailscale.");
    } finally {
      setTailscaleLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isAdmin) {
      loadTailscaleDevices();
    }
  }, [isAdmin, loadTailscaleDevices]);

  const openCreate = () => {
    setShowCreate(true);
    setTimeout(() => createPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const closeCreate = () => setShowCreate(false);

  const openAssignUser = (site: Site) => {
    setActiveSite(site);
    setShowAssignUser(true);
  };
  const openAddDevice = (site: Site) => {
    setActiveSite(site);
    setShowAddDevice(true);
  };
  const closeAssignUser = () => setShowAssignUser(false);
  const closeAddDevice = () => setShowAddDevice(false);

  const openManage = async (site: Site) => {
    if (!site || site.id === undefined || site.id === null) {
      console.error("❌ Site sin id:", site);
      alert("Este sitio no tiene un id válido. Revisa los datos.");
      return;
    }
    try {
      setActiveSite(site);
      const [u, d] = await Promise.all([api.getSiteUsers(site.id), api.getSiteDevices(site.id)]);
      setManageUsers(u);
      setManageDevices(d);
      setShowManage(true);
    } catch (e: any) {
      console.error("openManage error:", e);
      alert(e?.message ?? "No se pudo abrir la gestión del sitio");
    }
  };
  const closeManage = () => setShowManage(false);

  const doAssignUserByEmail = async (email: string) => {
    if (!activeSite) return;
    await api.assignUserByEmail(activeSite.id, email);
    await onRefetch();
  };

  const doCreateDevice = async (payload: { nombre: string; macAddress: string; ipAddress?: string; statusId?: number }) => {
    if (!activeSite) return;
    await api.createDevice(activeSite.id, payload);
    await onRefetch();
  };

  const doRemoveUser = async (userId: number) => {
    if (!activeSite) return;
    await api.removeUserFromSite(activeSite.id, userId);
    const u = await api.getSiteUsers(activeSite.id);
    setManageUsers(u);
    await onRefetch();
  };

  const doDeleteDevice = async (deviceId: number) => {
    if (!activeSite) return;
    if (!confirm("¿Eliminar dispositivo?")) return;
    await api.deleteDevice(activeSite.id, deviceId);
    const d = await api.getSiteDevices(activeSite.id);
    setManageDevices(d);
    await onRefetch();
  };

  const doDeleteSite = async () => {
    if (!activeSite) return;
    if (!confirm("¿Eliminar sitio y sus relaciones?")) return;
    await api.deleteSite(activeSite.id);
    setShowManage(false);
    await onRefetch();
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar
        user={activeUser}
        roleLabel={'admin'}
        onLogout={onLogout}
        navItems={navItems}
        onItemClick={(value) => setTab((value as AdminTab) ?? "overview")}
      />

      <div className="flex flex-1 flex-col">
        <DashboardTopBar
          title={t('dashboard.admin.title', 'Panel global')}
          subtitle={formatMessage(t('dashboard.admin.subtitle', 'Supervisando {sites} sitios y {devices} dispositivos activos.'), {
            sites: stats.totalSites,
            devices: stats.totalDevices,
          })}
          navItems={navItems}
          onMenuToggle={() => setMobileNavOpen(true)}
          actions={
            tab === "overview" ? (
              showCreate ? (
                <button
                  onClick={closeCreate}
                  className="inline-flex h-11 items-center rounded-full border border-red-300 bg-white px-5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  {t('actions.cancel', 'Cancelar')}
                </button>
              ) : (
                <button
                  onClick={openCreate}
                  className="inline-flex h-11 items-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  <PlusIcon className="mr-2 h-4 w-4" /> {t('actions.newSite', 'Nuevo sitio')}
                </button>
              )
            ) : null
          }
        />

        <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
          {tab === "overview" && (
            <>
              <SummaryGrid stats={stats} />

              {/* Panel plegable de creación */}
              <div
                ref={createPanelRef}
                className={`transition-all duration-300 ease-out overflow-hidden ${
                  showCreate ? "opacity-100 max-h-[500px] mt-0" : "opacity-0 max-h-0 -mt-4"
                }`}
              >
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
                  <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800">Registrar nuevo sitio</h3>
                  <button
                    onClick={closeCreate}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-red-300 hover:text-red-600"
                  >
                    {t('button.close', 'Cerrar')}
                  </button>
                </div>
                {/* <CreateSiteForm onCreated={() => { onRefetch(); setShowCreate(false); }} /> */}
                <p className="text-sm text-slate-500">
                  Integra aquí tu <code>CreateSiteForm</code>.
                  </p>
                </div>
              </div>

              {/* Export */}
              <QuickActionsBar isAdmin={isAdmin} />

              {/* Tabla de sitios */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{t('admin.sites.inventory', 'Inventario de sitios')}</h3>
                    <p className="text-sm text-slate-500">{t('admin.sites.description', 'Monitorea el estado operativo y los dispositivos desplegados.')}</p>
                  </div>
                  <div className="hidden sm:block text-xs text-slate-400" />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-6 py-3">{t('table.site', 'Sitio')}</th>
                        <th className="px-6 py-3">{t('table.devices', 'Dispositivos')}</th>
                        <th className="px-6 py-3">{t('table.assignees', 'Usuarios asignados')}</th>
                        <th className="px-6 py-3">{t('table.health', 'Salud')}</th>
                        <th className="px-6 py-3 text-right">{t('table.actions', 'Acciones')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {sites.map((site) => {
                        const devices = getDevicesOfSite(site);

                        const totalDevices = devices.length;
                        const onlineDevices = devices.filter((d: any) => {
                          const name = d?.status?.nombre ?? d?.Status?.nombre;
                          return typeof name === "string" && name.toLowerCase() === "online";
                        }).length;

                        const percentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
                        const assignedUsers = getUsersOfSite(site).length;

                        return (
                          <tr key={site.id} className="transition hover:bg-slate-50/60">
                            <td className="px-6 py-4 align-top">
                              <p className="font-semibold text-blue-900">{site.nombre}</p>
                              <p className="mt-1 flex items-center text-xs text-slate-500">
                                <MapPinIcon className="mr-1.5 h-4 w-4" />
                                {site.ubicacion || "Ubicación no definida"}
                              </p>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="text-sm font-semibold text-blue-900">
                                {onlineDevices}/{totalDevices} en línea
                              </div>
                              <div className="mt-2 h-1.5 w-36 rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {devices.slice(0, 3).map((device: any) => (
                                  <StatusBadge
                                    key={device.id}
                                    status={device?.status?.nombre ?? device?.Status?.nombre ?? "Desconocido"}
                                  />
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
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {percentage >= 90 ? "Excelente" : percentage >= 70 ? "Estable" : percentage >= 50 ? "Vigilancia" : "Crítico"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => openAssignUser(site)}
                                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                              >
                                {t('button.assignUser', 'Asignar usuario')}
                              </button>
                              <button
                                onClick={() => openAddDevice(site)}
                                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                              >
                                {t('button.addDevice', 'Agregar dispositivo')}
                              </button>
                              <button
                                onClick={() => openManage(site)}
                                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-red-300 hover:text-red-700"
                              >
                                {t('button.manage', 'Gestionar')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "devices" && (
            <>
              {isAdmin && (
                <TailscaleDevicesPanel
                  devices={tailscaleDevices}
                  loading={tailscaleLoading}
                  error={tailscaleError}
                  onRefresh={loadTailscaleDevices}
                />
              )}
              <DevicesDirectory sites={sites} />
            </>
          )}
          {tab === "clients" && <ClientsDirectory sites={sites} />}
          {tab === "settings" && activeUser && (
            <UserSettingsPanel
              user={activeUser}
              onLogout={onLogout}
              onUserUpdated={(updated) => {
                setCurrentUser(updated);
                onUserChange(updated);
              }}
            />
          )}
        </main>
      </div>

      {/* Modales */}
      {showAssignUser && activeSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="mb-3 text-base font-semibold text-slate-800">
              {t('admin.assignUser.title', 'Asignar usuario a:')} <span className="text-blue-800">{activeSite.nombre}</span>
            </h4>
            <AssignUserForm onAssign={doAssignUserByEmail} onClose={() => setShowAssignUser(false)} />
          </div>
        </div>
      )}

      {showAddDevice && activeSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="mb-3 text-base font-semibold text-slate-800">
              Agregar dispositivo a: <span className="text-blue-800">{activeSite.nombre}</span>
            </h4>
            <AddDeviceForm onCreate={doCreateDevice} onClose={() => setShowAddDevice(false)} />
          </div>
        </div>
      )}

      {showManage && activeSite && (
        <ManageSiteModal
          site={activeSite}
          users={manageUsers}
          devices={manageDevices}
          onClose={closeManage}
          onRemoveUser={doRemoveUser}
          onDeleteDevice={doDeleteDevice}
          onDeleteSite={doDeleteSite}
        />
      )}
    </div>
  );
}
