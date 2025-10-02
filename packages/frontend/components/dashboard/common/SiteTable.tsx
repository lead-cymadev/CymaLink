// components/dashboard/common/SiteTable.tsx
'use client';
import { EllipsisHorizontalIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Device, Site, getDevicesOfSite, getUsersOfSite } from '@/lib/api/ApiService';

function StatusBadge({ status }: { status?: string }) {
  const value = status?.toLowerCase();
  const styles = value === 'online'
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : value === 'offline'
      ? 'bg-rose-100 text-rose-700 border border-rose-200'
      : 'bg-slate-100 text-slate-600 border border-slate-200';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status ?? 'Sin estado'}</span>;
}

function SiteHealthBadge({ raspberries }: { raspberries?: Device[] }) {
  const devices = raspberries ?? [];
  const total = devices.length;
  if (total === 0) {
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Sin dispositivos</span>;
  }
  const online = devices.filter(d => d.Status?.nombre?.toLowerCase() === 'online').length;
  const ratio = online / total;

  let label = 'Crítico';
  let styles = 'bg-red-100 text-red-700 border border-red-200';
  if (ratio >= 0.9) { label = 'Excelente'; styles = 'bg-blue-100 text-blue-700 border border-blue-200'; }
  else if (ratio >= 0.7) { label = 'Estable'; styles = 'bg-blue-50 text-blue-600 border border-blue-200'; }
  else if (ratio >= 0.5) { label = 'Vigilancia'; styles = 'bg-amber-100 text-amber-700 border border-amber-200'; }

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{label}</span>;
}

export default function SiteTable({
  sites,
  onAssignUser,
  onAddDevice,
  onManage,
}: {
  sites: Site[];
  onAssignUser: (site: Site) => void;
  onAddDevice: (site: Site) => void;
  onManage: (site: Site) => void;
}) {
  if (sites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-700">Aún no hay sitios registrados</h3>
        <p className="mt-2 text-sm text-slate-500">Crea un sitio para comenzar el monitoreo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Inventario de sitios</h3>
          <p className="text-sm text-slate-500">Monitorea el estado operativo y los dispositivos desplegados.</p>
        </div>
        {/* Botón de encabezado sin contexto de 'site' */}
        <button className="hidden items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:flex cursor-default">
          <EllipsisHorizontalIcon className="mr-1.5 h-5 w-5" /> Gestionar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-3">Sitio</th>
              <th className="px-6 py-3">Dispositivos</th>
              <th className="px-6 py-3">Usuarios asignados</th>
              <th className="px-6 py-3">Salud</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sites.map(site => {
              const devices = getDevicesOfSite(site);
              const totalDevices = devices.length;
              const onlineDevices = devices.filter(d => d.Status?.nombre?.toLowerCase() === 'online').length;
              const percentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
              const assignedUsers = getUsersOfSite(site).length;

              return (
                <tr key={site.id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4 align-top">
                    <p className="font-semibold text-blue-900">{site.nombre}</p>
                    <p className="mt-1 flex items-center text-xs text-slate-500">
                      <MapPinIcon className="mr-1.5 h-4 w-4" />
                      {site.ubicacion || 'Ubicación no definida'}
                    </p>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-blue-900">{onlineDevices}/{totalDevices} en línea</div>
                    <div className="mt-2 h-1.5 w-36 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {devices.slice(0, 3).map(device => (
                        <StatusBadge key={device.id} status={device.Status?.nombre ?? 'Desconocido'} />
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
                    <SiteHealthBadge raspberries={devices} />
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onAssignUser(site)}
                      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      Asignar usuario
                    </button>
                    <button
                      onClick={() => onAddDevice(site)}
                      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Agregar dispositivo
                    </button>
                    <button
                      onClick={() => onManage(site)}
                      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-red-300 hover:text-red-700"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
