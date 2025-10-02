// components/dashboard/common/summary.tsx
"use client";
import { ChartBarIcon, GlobeAltIcon, ShieldCheckIcon, BellIcon } from "@heroicons/react/24/outline";
import type { DashboardStats } from "./types";

const BRAND_RED_GRADIENT = "from-red-600 via-red-500 to-red-600";
const BRAND_RED_LIGHT_GRADIENT = "from-red-500 via-red-400 to-red-500";
const BRAND_BLUE_GRADIENT = "from-blue-600 via-blue-500 to-blue-600";

function SummaryCard({
  title,
  value,
  icon: Icon,
  footnote,
  accent,
}: {
  title: string;
  value: string | number;
  icon: typeof GlobeAltIcon;
  footnote?: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-br ${accent} opacity-20 blur-3xl`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-blue-900">{value}</p>
          {footnote && <p className="mt-3 text-xs font-medium text-slate-500">{footnote}</p>}
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

export function SummaryGrid({ stats }: { stats: DashboardStats }) {
  const cards = [
    { title: "Sitios totales", value: stats.totalSites, icon: GlobeAltIcon, footnote: "Distribución global monitoreada", accent: BRAND_BLUE_GRADIENT },
    { title: "Dispositivos monitoreados", value: stats.totalDevices, icon: ShieldCheckIcon, footnote: `${stats.onlineDevices} en línea actualmente`, accent: BRAND_RED_GRADIENT },
    { title: "Salud del sistema", value: stats.systemHealth, icon: ChartBarIcon, footnote: stats.healthPercentage ? `${stats.healthPercentage}% disponibilidad` : undefined, accent: BRAND_BLUE_GRADIENT },
    { title: "Alertas activas", value: stats.alerts, icon: BellIcon, footnote: stats.alerts > 0 ? "Revisa los dispositivos con incidencias" : "Todo funcionando al 100%", accent: BRAND_RED_LIGHT_GRADIENT },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}
