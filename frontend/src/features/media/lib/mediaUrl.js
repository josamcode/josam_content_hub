import { API_BASE_URL } from "../../../lib/constants";

// The backend serves uploaded media at /uploads/... from its own origin and
// sets `Cross-Origin-Resource-Policy: cross-origin` so frontends on a
// different origin can embed previews. We turn the backend's relative
// fileUrl into an absolute URL using the origin of VITE_API_BASE_URL,
// without preserving the `/api/v1` (or similar) path prefix.

function getStaticOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

const STATIC_ORIGIN = getStaticOrigin();

export function buildMediaUrl(fileUrl) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (!STATIC_ORIGIN) return fileUrl;
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${STATIC_ORIGIN}${path}`;
}
