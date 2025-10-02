// lib/api/jwt.ts
export function isJwtExpired(token?: string | null) {
  if (!token) return true;
  try {
    const [, payloadB64] = token.split('.');
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    if (!payload?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return false;
  }
}
