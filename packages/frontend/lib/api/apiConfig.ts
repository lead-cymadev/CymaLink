// lib/api/apiConfig.ts
const FALLBACK_HOST = 'http://pruebas:8000';

const envCandidates = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_BACKEND_COMPLETE_URL,
  process.env.NEXT_PUBLIC_BACKEND_SHORT_URL,
];

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const pickBackendHost = (): string => {
  const candidate = envCandidates.find((item) => typeof item === 'string' && item.trim().length > 0);
  return candidate?.trim() || FALLBACK_HOST;
};

export const resolveBackendBaseUrl = (): string => stripTrailingSlash(pickBackendHost());

const ensureApiPrefix = (base: string): string => {
  if (!base) return '/api';
  const clean = stripTrailingSlash(base);
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const resolveApiBaseUrl = (): string => ensureApiPrefix(resolveBackendBaseUrl());

export const API_BASE_URL = resolveApiBaseUrl();

export const buildApiUrl = (endpoint: string, base = API_BASE_URL): string => {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanPath}`;
};
