// components/dashboard/admin/Directories.tsx
"use client";
import React from "react";
import { getDevicesOfSite, getUsersOfSite } from "../common/helpers";
import type { Site } from "../common/types";
import { StatusBadge } from "../common/ui";

export function DevicesDirectory({ sites }: { sites: Site[] }) {
  const rows = sites.flatMap((s) => getDevicesOfSite(s).map((d) => ({ site: s.nombre, device: d })));
  if (rows.length === 0) return <p className="text-sm text-slate-500">No hay dispositivos.</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Directorio de dispositivos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-3">Sitio</th>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">MAC</th>
              <th className="px-6 py-3">IP</th>
              <th className="px-6 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map(({ site, device }) => (
              <tr key={`${site}-${device.id}`}>
                <td className="px-6 py-3">{site}</td>
                <td className="px-6 py-3">{device.nombre}</td>
                <td className="px-6 py-3">{device.macAddress}</td>
                <td className="px-6 py-3">{device.ipAddress || "N/A"}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={device.Status?.nombre ?? "Desconocido"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ClientsDirectory({ sites }: { sites: Site[] }) {
  const rows = sites.flatMap((s) => getUsersOfSite(s).map((u) => ({ site: s.nombre, user: u })));
  if (rows.length === 0) return <p className="text-sm text-slate-500">No hay usuarios asignados a sitios.</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Directorio de clientes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-3">Sitio</th>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map(({ site, user }) => (
              <tr key={`${site}-${user.id}`}>
                <td className="px-6 py-3">{site}</td>
                <td className="px-6 py-3">{user.nombre}</td>
                <td className="px-6 py-3">{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
