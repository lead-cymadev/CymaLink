"use client";
import { useState } from 'react';

export function AssignUserForm({
  onAssign, onClose,
}: {
  onAssign: (email: string) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null);
    if (!email.trim()) return setErr('El email es obligatorio');
    try {
      setLoading(true);
      await onAssign(email.trim());
      setOk('Usuario asignado correctamente.');
      setEmail('');
    } catch (error: any) {
      setErr(error?.message || 'Error al asignar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        type="email"
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}
      <div className="flex gap-2">
        <button
          disabled={loading}
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Asignando...' : 'Asignar'}
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

