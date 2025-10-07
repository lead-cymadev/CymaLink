"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export type TailscaleDevice = {
  id: string | null;
  name: string;
  hostname: string | null;
  addresses: string[];
  primaryIp: string | null;
  macAddress: string | null;
  os: string | null;
  lastSeen: string | null;
  tags: string[];
};

const MANUAL_MAC_STORAGE_KEY = "cymalinks.admin.tailscale.manualMacs";
const CONNECTION_THRESHOLD_MINUTES = 2; // Consider a device connected if seen in the last 2 minutes

type DeviceWithStatus = TailscaleDevice & { isConnected: boolean };

function normalizeMac(value: string): string | null {
  const cleaned = value.trim().toUpperCase().replace(/[^0-9A-F]/g, "");
  if (cleaned.length !== 12) return null;
  const parts = cleaned.match(/.{1,2}/g);
  return parts ? parts.join(":") : null;
}

function getDeviceKey(device: TailscaleDevice): string {
  return [device.id, device.hostname, device.primaryIp, device.name]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join("|");
}

function isDeviceConnected(device: TailscaleDevice): boolean {
  if (!device.lastSeen) return false;
  const lastSeenDate = new Date(device.lastSeen);
  if (Number.isNaN(lastSeenDate.getTime())) return false;
  const diffMs = Date.now() - lastSeenDate.getTime();
  return diffMs <= CONNECTION_THRESHOLD_MINUTES * 60 * 1000;
}

function formatRelative(dateIso: string | null): string {
  if (!dateIso) return "Sin datos";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "Sin datos";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hace instantes";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export function TailscaleDevicesPanel({
  devices,
  loading,
  error,
  onRefresh,
}: {
  devices: TailscaleDevice[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [manualMacs, setManualMacs] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftMac, setDraftMac] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const devicesWithStatus = useMemo<DeviceWithStatus[]>(
    () => devices.map((device) => ({ ...device, isConnected: isDeviceConnected(device) })),
    [devices]
  );

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem(MANUAL_MAC_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        setManualMacs(parsed as Record<string, string>);
      }
    } catch (err) {
      console.warn("No se pudo restaurar el cache de MAC manuales", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MANUAL_MAC_STORAGE_KEY, JSON.stringify(manualMacs));
  }, [manualMacs]);

  useEffect(() => {
    setManualMacs((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const device of devicesWithStatus) {
        if (device.macAddress) {
          const key = getDeviceKey(device);
          if (next[key]) {
            delete next[key];
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [devicesWithStatus]);

  useEffect(() => {
    if (!editingKey) {
      setDraftMac("");
      setManualError(null);
      return;
    }
    setDraftMac(manualMacs[editingKey] ?? "");
    setManualError(null);
  }, [editingKey, manualMacs]);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingKey) return;
    const normalized = normalizeMac(draftMac);
    if (!normalized) {
      setManualError("Formato MAC inválido. Usa AA:BB:CC:DD:EE:FF");
      return;
    }
    setManualMacs((prev) => ({ ...prev, [editingKey]: normalized }));
    setEditingKey(null);
    setDraftMac("");
    setManualError(null);
  };

  const handleManualClear = (key: string) => {
    setManualMacs((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (editingKey === key) {
      setEditingKey(null);
      setDraftMac("");
      setManualError(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searchFiltered = devicesWithStatus.filter((device) => {
      const key = getDeviceKey(device);
      const manualMac = manualMacs[key]?.toLowerCase();
      return (
        !q ||
        device.name.toLowerCase().includes(q) ||
        device.hostname?.toLowerCase().includes(q) ||
        device.primaryIp?.toLowerCase().includes(q) ||
        device.macAddress?.toLowerCase().includes(q) ||
        manualMac?.includes(q)
      );
    });

    if (statusFilter === 'connected') {
      return searchFiltered.filter((device) => device.isConnected);
    }
    if (statusFilter === 'disconnected') {
      return searchFiltered.filter((device) => !device.isConnected);
    }
    return searchFiltered;
  }, [devicesWithStatus, manualMacs, query, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Dispositivos detectados en Tailscale</h3>
          <p className="text-sm text-slate-500">Visualiza todos los nodos conectados a tu tailnet y compara con el inventario.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, IP o MAC"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none sm:w-64"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600">
            {(
              [
                { value: 'all' as const, label: 'Todos' },
                { value: 'connected' as const, label: 'Conectados' },
                { value: 'disconnected' as const, label: 'Desconectados' },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-full px-3 py-1 transition ${
                  statusFilter === option.value
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-600 hover:bg-emerald-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </header>

      {error && <p className="px-6 py-3 text-sm text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Hostname</th>
              <th className="px-6 py-3">IP Tailscale</th>
              <th className="px-6 py-3">MAC</th>
              <th className="px-6 py-3">Último visto</th>
              <th className="px-6 py-3">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((device) => {
              const key = getDeviceKey(device);
              const manualMac = manualMacs[key];
              const macToDisplay = device.macAddress ?? manualMac ?? null;
              const isManual = Boolean(!device.macAddress && manualMac);
              const missingMac = !device.macAddress && !manualMac;
              const rowHighlight = device.isConnected
                ? "bg-emerald-50"
                : missingMac
                ? "bg-amber-50"
                : isManual
                ? "bg-amber-50/60"
                : undefined;

              return (
                <tr key={device.id ?? `${device.name}-${device.primaryIp ?? device.macAddress ?? ''}`} className={rowHighlight}>
                  <td className="px-6 py-3 text-blue-900 font-semibold">{device.name}</td>
                  <td className="px-6 py-3">{device.hostname ?? '—'}</td>
                  <td className="px-6 py-3">{device.primaryIp ?? '—'}</td>
                  <td className="px-6 py-3">
                    {macToDisplay ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span>{macToDisplay}</span>
                          {isManual && (
                            <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Manual
                            </span>
                          )}
                        </div>
                        {isManual && (
                          <button
                            type="button"
                            onClick={() => handleManualClear(key)}
                            className="self-start text-xs font-semibold text-amber-700 underline-offset-2 hover:underline"
                          >
                            Quitar carga manual
                          </button>
                        )}
                      </div>
                    ) : editingKey === key ? (
                      <form onSubmit={handleManualSubmit} className="space-y-2">
                        <input
                          value={draftMac}
                          onChange={(event) => setDraftMac(event.target.value)}
                          placeholder="AA:BB:CC:DD:EE:FF"
                          className="w-48 rounded-lg border border-amber-300 px-3 py-1 text-xs focus:border-amber-500 focus:outline-none"
                        />
                        {manualError && <p className="text-xs text-red-600">{manualError}</p>}
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Sin MAC reportada</span>
                        <button
                          type="button"
                          onClick={() => setEditingKey(key)}
                          className="self-start rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          Cargar manual
                        </button>
                      </div>
                    )}
                  </td>
                <td className="px-6 py-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        device.isConnected ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          device.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {device.isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                    <span className="text-slate-500">{formatRelative(device.lastSeen)}</span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  {device.tags.length === 0 ? (
                    <span className="text-xs text-slate-400">Sin etiquetas</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {device.tags.map((tag) => (
                        <span key={tag} className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {tag.replace('tag:', '')}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  No se encontraron dispositivos en la tailnet que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  Sincronizando con Tailscale...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
