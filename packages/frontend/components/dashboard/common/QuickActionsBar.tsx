import Cookies from 'js-cookie';

const pickBaseUrl = () => {
  const short = process.env.NEXT_PUBLIC_BACKEND_SHORT_URL;
  const full  = process.env.NEXT_PUBLIC_BACKEND_COMPLETE_URL;
  const base = (short || full || '').replace(/\/+$/, '');
  return base ? `${base}/api` : '/api';
};
const API_BASE = pickBaseUrl();

function QuickActionsBar({ isAdmin, searchQuery }: { isAdmin?: boolean; searchQuery?: string }) {
  const scope = isAdmin ? 'all' : 'mine';

  const buildExportUrl = (format: 'csv' | 'xml') => {
    const qParam = searchQuery?.trim() ? `&q=${encodeURIComponent(searchQuery.trim())}` : '';
    return `${API_BASE}/sites/export?format=${format}&scope=${scope}${qParam}`;
  };

  const download = async (format: 'csv' | 'xml') => {
    try {
      const token = Cookies.get('access_token');
      if (!token) throw new Error('No hay token de sesión');

      const url = buildExportUrl(format);
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const maybeJson = await res.json().catch(() => null);
        const msg = maybeJson?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
      const suggested = match ? decodeURIComponent(match[2]) : `sites_export.${format}`;

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e: any) {
      alert(e?.message || 'No se pudo exportar');
      console.error('export error:', e);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <article className="group flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-red-100 p-5 shadow-sm md:col-span-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          {/* tu icono */}
        </span>
        <p className="mt-4 text-sm font-semibold text-blue-900">Exportar a archivo</p>
        <p className="mt-1 text-xs text-slate-500">Descarga el inventario de sitios y dispositivos en CSV o XML.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => download('csv')} className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold">Descargar CSV</button>
          <button onClick={() => download('xml')} className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold">Descargar XML</button>
        </div>
      </article>
    </section>
  );
}
