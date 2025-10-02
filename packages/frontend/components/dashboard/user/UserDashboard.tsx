// components/dashboard/user/UserDashboard.tsx
"use client";

import React, { useState } from "react";
import type { Site } from "../common/types";
import { Sidebar, DashboardTopBar, StatusBadge } from "../common/ui";
import { getDevicesOfSite } from "../common/helpers";
import { ChevronRightIcon, MapPinIcon } from "@heroicons/react/24/outline";

function UserSiteCard({ site }: { site: Site }) {
  const devices = getDevicesOfSite(site);
  const onlineDevices = devices.filter((d) => d.Status?.nombre?.toLowerCase() === "online").length;
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
              {site.ubicacion || "Ubicación no definida"}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {totalDevices === 0 ? "Sin dispositivos" : onlineDevices / totalDevices >= 0.9 ? "Excelente" : "Operativo"}
          </span>
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
              {devices.slice(0, 4).map((device) => (
                <div key={device.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{device.nombre}</p>
                    <p className="text-xs text-slate-500">{device.macAddress}</p>
                  </div>
                  <StatusBadge status={device.Status?.nombre ?? "Desconocido"} />
                </div>
              ))}
            </div>
            {devices.length > 4 && <p className="text-xs font-semibold text-red-600">+{devices.length - 4} dispositivos adicionales</p>}
          </>
        )}
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800">
            {onlineDevices}/{totalDevices} dispositivos en línea
          </span>
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
      {sites.map((site) => (
        <UserSiteCard key={site.id} site={site} />
      ))}
    </div>
  );
}

export default function UserDashboard({
  user,
  sites,
  onLogout,
  onRefetch,
}: {
  user: any;
  sites: Site[];
  onLogout: () => void;
  onRefetch: () => void;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = [{ label: "Overview", icon: ChevronRightIcon, active: true }];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar user={user} roleLabel={"usuario"} onLogout={onLogout} navItems={navItems as any} />
      <div className="flex flex-1 flex-col">
        <DashboardTopBar title="Panel personal" subtitle={`Monitoreando tus ${sites.length} sitios asignados en tiempo real.`} navItems={navItems as any} onMenuToggle={() => setMobileNavOpen(true)} />
        <main className="flex-1 space-y-8 px-4 py-6 lg:px-8">
          <UserSiteGrid sites={sites} />
        </main>
      </div>
    </div>
  );
}
