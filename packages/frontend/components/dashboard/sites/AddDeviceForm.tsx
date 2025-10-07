"use client";
import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/lib/api/ApiService';

export function AddDeviceForm({
  onCreate, onClose,
}: {
  onCreate: (payload: { nombre:string; macAddress:string; ipAddress?:string; statusId?:number }) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [mac, setMac] = useState('');
  const [ip, setIp] = useState('');
  const [statusId, setStatusId] = useState<number|''>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);
  const [devices, setDevices] = useState<Array<{ id: string | null; name: string; hostname: string | null; primaryIp: string | null; macAddress: string | null; tags: string[] }>>([]);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoadingDevices(true);
        setDevicesError(null);
        const list = await apiService.getTailscaleDevices();
        if (!ignore) {
          setDevices(
            list.map(item => ({
              id: item.id,
              name: item.name,
              hostname: item.hostname,
              primaryIp: item.primaryIp,
              macAddress: item.macAddress,
              tags: item.tags ?? [],
            }))
          );
        }
      } catch (error: any) {
        if (!ignore) {
          setDevicesError(error?.message || 'No se pudieron cargar los dispositivos de Tailscale');
        }
      } finally {
        if (!ignore) setLoadingDevices(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredDevices = useMemo(() => {
    if (!search.trim()) return devices;
    const q = search.trim().toLowerCase();
    return devices.filter(device => {
      return (
        device.macAddress?.toLowerCase().includes(q) ||
        device.name.toLowerCase().includes(q) ||
        device.hostname?.toLowerCase().includes(q) ||
        device.primaryIp?.toLowerCase().includes(q)
      );
    });
  }, [devices, search]);

  const handleSelectDevice = (device: { name: string; primaryIp: string | null; macAddress: string | null }) => {
    if (device.name) setNombre(device.name);
    if (device.primaryIp) setIp(device.primaryIp);
    if (device.macAddress) setMac(device.macAddress);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null);
    if (!nombre.trim() || !mac.trim()) return setErr('Nombre y MAC son obligatorios');
    try {
      setLoading(true);
      await onCreate({
        nombre: nombre.trim(),
        macAddress: mac.trim(),
        ipAddress: ip.trim() || undefined,
        statusId: typeof statusId === 'number' ? statusId : undefined,
      });
      setOk('Dispositivo creado.');
      setNombre(''); setMac(''); setIp(''); setStatusId('');
    } catch (error:any) {
      setErr(error?.message || 'Error al crear dispositivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Nombre del dispositivo"
               value={nombre} onChange={(e)=>setNombre(e.target.value)} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="MAC (AA:BB:CC:DD:EE:FF)"
               value={mac} onChange={(e)=>setMac(e.target.value)} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="IP (opcional)"
               value={ip} onChange={(e)=>setIp(e.target.value)} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="statusId (opcional, número)"
               value={statusId} onChange={(e)=>setStatusId(e.target.value ? Number(e.target.value) : '')} />
      </div>
      {devices.length > 0 && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispositivos detectados en Tailscale</p>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por MAC, nombre o IP"
              className="w-44 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {filteredDevices.map(device => (
              <button
                key={`${device.id ?? device.macAddress ?? device.name}`}
                type="button"
                onClick={() => handleSelectDevice(device)}
                className="flex w-full flex-col rounded-lg border border-transparent bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="text-sm font-semibold text-blue-900">{device.name}</span>
                <span className="text-xs text-slate-500">MAC: {device.macAddress ?? 'no disponible'}</span>
                <span className="text-xs text-slate-500">IP: {device.primaryIp ?? 'sin IP'}</span>
                {device.hostname && <span className="text-xs text-slate-400">Hostname: {device.hostname}</span>}
              </button>
            ))}
            {filteredDevices.length === 0 && (
              <p className="text-xs text-slate-500">No se encontraron coincidencias.</p>
            )}
          </div>
        </div>
      )}
      {loadingDevices && <p className="text-xs text-slate-500">Cargando dispositivos de Tailscale...</p>}
      {devicesError && <p className="text-xs text-red-500">{devicesError}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}
      <div className="flex gap-2">
        <button
          disabled={loading}
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar dispositivo'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cerrar
        </button>
      </div>
    </form>
  );
}
