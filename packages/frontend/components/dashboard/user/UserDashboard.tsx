// components/dashboard/user/UserDashboard.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import type { Site } from "../common/types";
import { Sidebar, DashboardTopBar, StatusBadge } from "../common/ui";
import { getDevicesOfSite, resolveUserRole } from "../common/helpers";
import {
  ChevronRightIcon,
  MapPinIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  SparklesIcon,
  GlobeAmericasIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "@/lib/api/ApiService";
import { useI18n, formatMessage } from "@/lib/i18n";
import UserSettingsPanel from "../common/UserSettingsPanel";

function SiteDeviceList({ site, expanded, onToggle }: { site: Site; expanded: boolean; onToggle: (id: number) => void }) {
  const devices = getDevicesOfSite(site);
  const onlineDevices = devices.filter((d) => d.Status?.nombre?.toLowerCase() === "online").length;
  const totalDevices = devices.length;
  const t = useI18n();
  const healthLabel =
    totalDevices === 0
      ? t("user.health.none", "Sin dispositivos")
      : onlineDevices / totalDevices >= 0.9
      ? t("user.health.excellent", "Excelente")
      : onlineDevices / totalDevices >= 0.7
      ? t("user.health.operational", "Operativo")
      : t("user.health.review", "Revisar");

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-white px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              {t("user.site.assigned", "Sitio asignado")}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-blue-900">{site.nombre}</h3>
            <p className="mt-1 flex items-center text-sm text-slate-500">
              <MapPinIcon className="mr-1.5 h-4 w-4" />
              {site.ubicacion || t("user.site.noLocation", "Ubicación no definida")}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {healthLabel}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-4 px-6 py-5">
        {devices.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t("user.devices.none", "Aún no hay dispositivos configurados en este sitio.")}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>{t("table.device", "Dispositivo")}</span>
              <span>{t("table.status", "Estado")}</span>
            </div>
            <div className="space-y-2">
              {(expanded ? devices : devices.slice(0, 4)).map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{device.nombre}</p>
                    <p className="text-xs text-slate-500">{device.macAddress}</p>
                  </div>
                  <StatusBadge status={device.Status?.nombre ?? "Desconocido"} />
                </div>
              ))}
            </div>
            {devices.length > 4 && (
              <button
                onClick={() => onToggle(site.id)}
                className="text-xs font-semibold text-red-600 transition hover:text-red-700"
              >
                {expanded
                  ? t("user.showLess", "Mostrar menos")
                  : formatMessage(t("user.showMoreCount", "Ver {count} dispositivos adicionales"), {
                      count: devices.length - 4,
                    })}
              </button>
            )}
          </>
        )}
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800">
            {formatMessage(t("user.devices.onlineCount", "{online}/{total} dispositivos en línea"), {
              online: onlineDevices,
              total: totalDevices,
            })}
          </span>
          <button
            onClick={() => onToggle(site.id)}
            className="inline-flex items-center text-sm font-semibold text-red-600 transition hover:text-red-700"
          >
            {expanded ? t("user.hideDetails", "Ocultar detalles") : t("user.viewDetails", "Ver detalles")}
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function UserSiteGrid({ sites, expandedSiteId, onToggle }: { sites: Site[]; expandedSiteId: number | null; onToggle: (id: number) => void }) {
  const t = useI18n();
  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-700">{t("user.sites.none", "No tienes sitios asignados")}</h3>
        <p className="mt-2 text-sm text-slate-500">{t("user.sites.contact", "Comunícate con tu administrador para obtener acceso.")}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {sites.map((site) => (
        <SiteDeviceList key={site.id} site={site} expanded={expandedSiteId === site.id} onToggle={onToggle} />
      ))}
    </div>
  );
}

function SummaryPill({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-blue-900">{value}</p>
    </div>
  );
}

export default function UserDashboard({
  user,
  sites,
  onLogout,
  onRefetch,
  onUserChange,
}: {
  user: any;
  sites: Site[];
  onLogout: () => void;
  onRefetch: () => void;
  onUserChange?: (user: any) => void;
}) {
  const t = useI18n();
  const [activeNav, setActiveNav] = useState<'overview' | 'settings'>('overview');
  const [search, setSearch] = useState("");
  const [expandedSiteId, setExpandedSiteId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<"csv" | "xml" | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;
    const query = search.trim().toLowerCase();
    return sites.filter((site) => {
      const inName = site.nombre.toLowerCase().includes(query);
      const inLocation = site.ubicacion?.toLowerCase().includes(query);
      const devices = getDevicesOfSite(site);
      const inDevices = devices.some((device) =>
        [device.nombre, device.macAddress, device.ipAddress]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      );
      return inName || inLocation || inDevices;
    });
  }, [sites, search]);

  const totals = useMemo(() => {
    const totalSites = sites.length;
    const devices = sites.flatMap((site) => getDevicesOfSite(site));
    const totalDevices = devices.length;
    const onlineDevices = devices.filter((d) => d.Status?.nombre?.toLowerCase() === "online").length;
    return {
      totalSites,
      totalDevices,
      onlineDevices,
    };
  }, [sites]);

  const toggleExpanded = (id: number) => {
    setExpandedSiteId((prev) => (prev === id ? null : id));
  };

  const scrollToSettings = () => {
    setActiveNav("settings");
    settingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleExport = async (format: "csv" | "xml") => {
    try {
      setIsExporting(format);
      const { blob, filename } = await apiService.exportSites(format, "mine", search);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (error: any) {
      alert(error?.message || "No se pudo exportar los datos");
      console.error("user export error:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const roleLabel = (resolveUserRole(user) as string) || "usuario";

  const navItems = [
    {
      label: t("nav.overview", "Overview"),
      value: "overview",
      icon: ChevronRightIcon,
      active: activeNav === "overview",
      onClick: () => {
        setActiveNav("overview");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    },
    {
      label: t("nav.settings", "Configuración"),
      value: "settings",
      icon: Cog6ToothIcon,
      active: activeNav === "settings",
      onClick: () => {
        setActiveNav("settings");
        scrollToSettings();
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar
        user={user}
        roleLabel={roleLabel}
        onLogout={onLogout}
        navItems={navItems}
        onItemClick={(value) => {
          if (value === "settings") {
            setActiveNav("settings");
            scrollToSettings();
          } else {
            setActiveNav("overview");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />
      <div className="flex flex-1 flex-col">
        <DashboardTopBar
          title={t("dashboard.user.title", "Panel personal")}
          subtitle={formatMessage(t("dashboard.user.subtitle", "Monitoreando tus {sites} sitios asignados en tiempo real."), {
            sites: sites.length,
          })}
          navItems={navItems}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onRefetch()}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                <ArrowPathIcon className="mr-2 h-4 w-4" /> {t("actions.refresh", "Actualizar")}
              </button>
              <button
                disabled={isExporting === "csv"}
                onClick={() => handleExport("csv")}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
              >
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                {isExporting === "csv" ? t("user.exporting", "Exportando...") : t("user.exportCsv", "CSV")}
              </button>
              <button
                disabled={isExporting === "xml"}
                onClick={() => handleExport("xml")}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
              >
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                {isExporting === "xml" ? t("user.exporting", "Exportando...") : t("user.exportXml", "XML")}
              </button>
              <button
                onClick={scrollToSettings}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                <Cog6ToothIcon className="mr-2 h-4 w-4" /> {t("button.managePreferences", "Preferencias")}
              </button>
            </div>
          }
        />
        <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
          <section className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
              <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
              <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t("user.hero.badge", "Tu panel personal")}</p>
                  <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                    {formatMessage(t("user.hero.title", "Hola {name}, monitorea tus sitios en vivo"), {
                      name: user?.nombre ?? "CymaLink",
                    })}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-white/80">
                    {t(
                      "user.hero.subtitle",
                      "Sigue el estado de tus dispositivos, revisa la actividad reciente y mantén tu configuración al día."
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/80">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                      <GlobeAmericasIcon className="h-4 w-4" />
                      {t("user.hero.language", "Idioma actual")}: {user?.preferredLanguage?.toUpperCase?.() ?? "ES"}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                      <EnvelopeIcon className="h-4 w-4" />
                      {t("user.hero.notifications", "Notificaciones correo")}: {user?.notifyByEmail === false ? t("status.off", "Inactivas") : t("status.on", "Activas")}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 text-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-white/90">
                    <SparklesIcon className="h-5 w-5" />
                    {t("user.hero.tip", "Consejo: actualiza tus preferencias para personalizar la experiencia.")}
                  </div>
                  <button
                    onClick={scrollToSettings}
                    className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-white"
                  >
                    <Cog6ToothIcon className="mr-2 h-4 w-4" /> {t("button.managePreferences", "Preferencias")}
                  </button>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryPill
                label={t("summary.sites", "Sitios")}
                value={totals.totalSites}
                accent="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100"
              />
              <SummaryPill
                label={t("summary.devices", "Dispositivos")}
                value={totals.totalDevices}
                accent="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100"
              />
              <SummaryPill
                label={t("summary.online", "En línea")}
                value={totals.onlineDevices}
                accent="border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-100"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">{t("user.quick.statusTitle", "Estado general")}</h3>
                <p className="mt-1 text-xs text-slate-500">{t("user.quick.statusCopy", "Resumen de actividad de los últimos dispositivos sincronizados.")}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {formatMessage(t("user.quick.onlineDevices", "{count} dispositivos conectados ahora mismo."), {
                      count: totals.onlineDevices,
                    })}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    {formatMessage(t("user.quick.totalSites", "Supervisando {count} sitios asignados."), {
                      count: totals.totalSites,
                    })}
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-blue-900">{t("user.quick.reminderTitle", "Recordatorio")}</h3>
                <p className="mt-1 text-xs text-blue-900/80">{t("user.quick.reminderCopy", "Mantén tus datos actualizados para recibir notificaciones relevantes.")}</p>
                <button
                  onClick={scrollToSettings}
                  className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  <Cog6ToothIcon className="mr-2 h-4 w-4" /> {t("button.managePreferences", "Preferencias")}
                </button>
              </div>
            </section>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{t("user.section.sites", "Sitios")}</h3>
                <p className="text-sm text-slate-500">{t("user.section.sitesDescription", "Filtra y revisa los dispositivos asignados a tus ubicaciones.")}</p>
              </div>
              <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:w-auto">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("user.search.placeholder", "Buscar por sitio, ubicación o dispositivo")}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>
          </section>

          <UserSiteGrid sites={filteredSites} expandedSiteId={expandedSiteId} onToggle={toggleExpanded} />

          <section ref={settingsRef} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <UserSettingsPanel
              user={user}
              onLogout={onLogout}
              onUserUpdated={(updated) => {
                onUserChange?.(updated);
              }}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
