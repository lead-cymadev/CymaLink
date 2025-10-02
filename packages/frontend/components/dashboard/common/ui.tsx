// components/dashboard/common/ui.tsx
"use client";

import * as React from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Bars3Icon,
  BellIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PowerIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { User, UserRole } from "./types";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p className="text-slate-600">Cargando dashboard...</p>
      </div>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full mx-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error al Cargar Datos</h3>
          <p className="text-slate-600 mb-6">{message}</p>
          <button onClick={onRetry} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const value = status?.toLowerCase();
  const styles =
    value === "online"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : value === "offline"
      ? "bg-rose-100 text-rose-700 border border-rose-200"
      : "bg-slate-100 text-slate-600 border border-slate-200";

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status ?? "Sin estado"}</span>;
}

export function DashboardTopBar({
  title,
  subtitle,
  actions,
  onRefresh,
  onMenuToggle,
  navItems,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  onMenuToggle?: () => void;
  navItems?: Array<{ label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; badge?: string; active?: boolean; onClick?: () => void }>;
}) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-300 hover:text-red-600 lg:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">CymaLink</p>
            <h1 className="text-2xl font-semibold text-blue-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <MagnifyingGlassIcon className="mr-2 h-5 w-5 text-slate-400" />
            <input type="search" placeholder="Buscar sitios o dispositivos" className="w-64 border-none bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none" />
          </div>
          <button className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 sm:flex">
            <BellIcon className="h-5 w-5" />
          </button>
          {actions}
        </div>
      </div>
      {navItems && <MobileNavBar navItems={navItems} />}
    </header>
  );
}

export function Sidebar({
  user,
  roleLabel,
  onLogout,
  navItems,
  onItemClick,
  onClose,
}: {
  user: User;
  roleLabel: UserRole;
  onLogout: () => void;
  navItems: Array<{ label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; badge?: string; active?: boolean }>;
  onItemClick?: (label: string) => void;
  onClose?: () => void;
}) {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/95 pb-6 backdrop-blur lg:flex">
      <div className="flex h-full flex-col pb-6">
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">CymaLink</p>
            <h2 className="text-xl font-bold text-blue-900">Network Center</h2>
          </div>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 capitalize">{roleLabel}</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                item.active ? "bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-700 shadow-sm" : "text-slate-600 hover:bg-red-50 hover:text-red-700"
              }`}
              onClick={() => onItemClick?.(item.label)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center">
              <UserCircleIcon className="mr-3 h-10 w-10 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">{user.nombre}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button onClick={onLogout} className="text-slate-400 transition hover:text-red-600">
                <PowerIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNavBar({
  navItems,
}: {
  navItems: Array<{ label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; badge?: string; active?: boolean; onClick?: () => void }>;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            item.active ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
