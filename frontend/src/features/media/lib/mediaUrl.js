// Static `/uploads/...` paths are served by the backend, but embedded media
// (<video>, <img>) is subject to Cross-Origin-Resource-Policy. To stay
// frontend-only we keep media URLs origin-relative and let Vite's dev proxy
// (or the production reverse proxy) forward `/uploads/*` to the backend.
// Absolute http(s) URLs pass through unchanged.

export function buildMediaUrl(fileUrl) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
}
