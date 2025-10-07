'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/lib/api/ApiService';
import type { User } from './types';
import { useI18n, useLanguage } from '@/lib/i18n';

const LANGUAGE_OPTIONS: string[] = ['es', 'en', 'pt', 'fr'];

const TIMEZONE_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'America/Mexico_City', labelKey: 'form.timezone.cdmx' },
  { value: 'America/Bogota', labelKey: 'form.timezone.bogota' },
  { value: 'America/Argentina/Buenos_Aires', labelKey: 'form.timezone.buenosAires' },
  { value: 'Europe/Madrid', labelKey: 'form.timezone.madrid' },
  { value: 'UTC', labelKey: 'form.timezone.utc' },
];

type FormState = {
  nombre: string;
  preferredLanguage: string;
  timezone: string;
  notifyByEmail: boolean;
};

export default function UserSettingsPanel({
  user,
  onLogout,
  onUserUpdated,
}: {
  user: User;
  onLogout: () => void;
  onUserUpdated?: (user: User) => void;
}) {
  const t = useI18n();
  const { setLanguage } = useLanguage();
  const initialForm = useMemo<FormState>(() => ({
    nombre: user?.nombre ?? '',
    preferredLanguage: user?.preferredLanguage ?? 'es',
    timezone: user?.timezone ?? 'UTC',
    notifyByEmail: user?.notifyByEmail ?? true,
  }), [user]);

  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialForm);
    setSuccess(null);
    setError(null);
  }, [initialForm]);

  const isDirty = useMemo(() => {
    return (
      form.nombre !== initialForm.nombre ||
      form.preferredLanguage !== initialForm.preferredLanguage ||
      form.timezone !== initialForm.timezone ||
      form.notifyByEmail !== initialForm.notifyByEmail
    );
  }, [form, initialForm]);

  const languageOptions = useMemo(() => {
    if (!form.preferredLanguage) return LANGUAGE_OPTIONS;
    const normalized = form.preferredLanguage.toLowerCase();
    if (LANGUAGE_OPTIONS.includes(normalized as (typeof LANGUAGE_OPTIONS)[number])) {
      return LANGUAGE_OPTIONS;
    }
    return [...LANGUAGE_OPTIONS, normalized as (typeof LANGUAGE_OPTIONS)[number]];
  }, [form.preferredLanguage]);

  const timezoneOptions = useMemo(() => {
    if (!form.timezone) return TIMEZONE_OPTIONS;
    if (TIMEZONE_OPTIONS.some((option) => option.value === form.timezone)) {
      return TIMEZONE_OPTIONS;
    }
    return [...TIMEZONE_OPTIONS, { value: form.timezone, labelKey: form.timezone }];
  }, [form.timezone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !isDirty) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await apiService.updateProfile({
        nombre: form.nombre,
        preferredLanguage: form.preferredLanguage,
        timezone: form.timezone,
        notifyByEmail: form.notifyByEmail,
      });

      setSuccess(t('settings.success', 'Preferencias guardadas correctamente.'));
      setForm({
        nombre: updated.nombre,
        preferredLanguage: updated.preferredLanguage ?? form.preferredLanguage,
        timezone: updated.timezone ?? form.timezone,
        notifyByEmail: typeof updated.notifyByEmail === 'boolean' ? updated.notifyByEmail : form.notifyByEmail,
      });
      onUserUpdated?.(updated as User);
      setLanguage((updated.preferredLanguage?.toLowerCase?.() ?? 'es').startsWith('en') ? 'en' : 'es');
    } catch (err) {
      const defaultMessage = t('settings.error', 'No se pudo guardar la configuración');
      const message = err instanceof Error ? err.message : defaultMessage;
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{t('settings.title', 'Configuración de la cuenta')}</h3>
          <p className="text-sm text-slate-500">{t('settings.subtitle', 'Actualiza tus datos básicos y preferencias personales.')}</p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          {t('settings.logout', 'Cerrar sesión')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('settings.name', 'Nombre completo')}</span>
            <input
              value={form.nombre}
              onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
              placeholder={t('form.name.placeholder', 'Ingresa tu nombre')}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('settings.email', 'Correo electrónico')}</span>
            <input
              readOnly
              value={user.email}
              className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('settings.language', 'Idioma preferido')}</span>
            <select
              value={form.preferredLanguage}
              onChange={(event) => setForm((prev) => ({ ...prev, preferredLanguage: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {languageOptions.map((code) => (
                <option key={code} value={code}>
                  {t(`form.language.${code}`, code.toUpperCase())}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('settings.timezone', 'Zona horaria')}</span>
            <select
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey, option.value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t('settings.notifications', 'Recibir notificaciones por correo')}</p>
            <p className="text-xs text-slate-500">{t('settings.notifications.hint', 'Mantente al tanto de alertas e informes importantes.')}</p>
          </div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.notifyByEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, notifyByEmail: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-2 focus:ring-red-400"
            />
            <span className="text-sm text-slate-600">{t('settings.notifications.enabled', 'Activadas')}</span>
          </label>
        </div>

        {(error || success) && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              error ? 'border border-rose-300 bg-rose-50 text-rose-700' : 'border border-emerald-300 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {t('settings.lastUpdate', 'Última actualización')}: {new Date(user.updatedAt ?? new Date()).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!isDirty || saving}
              onClick={() => setForm(initialForm)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('settings.reset', 'Restablecer')}
            </button>
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="inline-flex items-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? t('settings.saving', 'Guardando...') : t('settings.save', 'Guardar cambios')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
