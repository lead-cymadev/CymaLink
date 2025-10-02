// components/dashboard/sites/ManageSiteModal.tsx
"use client";
import React from "react";
import type { Site } from "../common/types";

export default function ManageSiteModal({
  site,
  users,
  devices,
  onClose,
  onRemoveUser,
  onDeleteDevice,
  onDeleteSite,
}: {
  site: Site;
  users: Array<{ id: number; nombre: string; email: string }>;
  devices: Array<{ id: number; nombre: string; macAddress: string; ipAddress: string | null; Status?: { nombre: string } }>;
  onClose: () => void;
  onRemoveUser: (userId: number) => Promise<void> | void;
  onDeleteDevice: (deviceId: number) => Promise<void> | void;
  onDeleteSite: () => Promise<void> | void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-800">
            Gestionar sitio: <span className="text-blue-800">{site.nombre}</span>
          </h4>
          <button onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-red-300 hover:text-red-600">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Usuarios */}
          <div className="rounded-xl border border-slate-200 p-3">
            <h5 className="mb-2 text-sm font-semibold text-slate-800">Usuarios asignados</h5>
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">Sin usuarios</p>
            ) : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{u.nombre}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <button onClick={() => onRemoveUser(u.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dispositivos */}
          <div className="rounded-xl border border-slate-200 p-3">
            <h5 className="mb-2 text-sm font-semibold text-slate-800">Dispositivos</h5>
            {devices.length === 0 ? (
              <p className="text-sm text-slate-500">No hay dispositivos</p>
            ) : (
              <ul className="space-y-2">
                {devices.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{d.nombre}</p>
                      <p className="text-xs text-slate-500">{d.macAddress} • {d.ipAddress || "N/A"}</p>
                    </div>
                    <button onClick={() => onDeleteDevice(d.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <button onClick={onDeleteSite} className="text-sm font-semibold text-red-600 hover:text-red-700">
            Eliminar sitio
          </button>
        </div>
      </div>
    </div>
  );
}
