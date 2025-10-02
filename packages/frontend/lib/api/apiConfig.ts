// lib/api/config.ts
const RAW = process.env.NEXT_PUBLIC_BACKEND_SHORT_URL || "http://pruebas:8000";
export const API_BASE_URL = `${RAW.replace(/\/$/, "")}/api`;
