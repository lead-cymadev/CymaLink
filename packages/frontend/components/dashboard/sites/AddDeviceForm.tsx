"use client";
import { useState } from 'react';

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
