// components/dashboard/common/UserSettingsPanel.tsx
'use client';
import { User } from '@/lib/api/ApiService';

export default function UserSettingsPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Configuración de la cuenta</h3>
      <p className="mt-1 text-sm text-slate-500">Preferencias y datos del usuario actual.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Nombre</p>
          <p className="mt-1 text-sm text-slate-800">{user.nombre}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</p>
          <p className="mt-1 text-sm text-slate-800">{user.email}</p>
        </div>
      </div>

      <div className="mt-6">
        <button
