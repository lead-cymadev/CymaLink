// components/dashboard/modals/ManageSiteModal.tsx
'use client';
import { Site, Device } from '@/lib/api/ApiService';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ManageSiteModal({
  site, users, devices, onClose, onRemoveUser, onDeleteDevice, onDeleteSite
}: {
  site: Site;
  users: Array<{id:number; nombre:string; email:string}>;
  devices: Array<Device>;
  onClose: () => void;
  onRemoveUser: (userId: number) => Promise<void> | void;
  onDeleteDevice: (deviceId: number) => Promise<void> | void;
  onDeleteSite: () => Promise<void> | void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">
            Gestionar sitio: <span className="text-blue-800">{site.nombre}</span>
          </h3>
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-red-300 hover:text-red-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 p-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Usuarios asignados</h4>
            <ul className="space-y-2">
              {users.length === 0 && <li className="text-sm text-slate-500">Sin usuarios.</li>}
              {users.map(u => (
                <li key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <button
                    onClick={() => onRemoveUser(u.id)}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Dispositivos</h4>
            <ul className="space-y-2">
              {devices.length === 0 && <li className="text-sm text-slate-500">Sin dispositivos.</li>}
              {devices.map(d => (
                <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.nombre}</p>
                    <p className="text-xs text-slate-500">{d.macAddress} • {d.ipAddress || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => onDeleteDevice(d.id)}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600"
                  >
                    <TrashIcon className="mr-1 h-4 w-4" /> Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <div className="text-xs text-slate-500">Ubicación: {site.ubicacion || '—'}</div>
          <button
            onClick={onDeleteSite}
            className="inline-flex items-center rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            <TrashIcon className="mr-1 h-4 w-4" /> Eliminar sitio
          </button>
        </div>
      </div>
    </div>
  );
}
