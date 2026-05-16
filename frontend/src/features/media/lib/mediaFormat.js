const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes <= 0) return "0 B";
  let value = Number(bytes);
  let i = 0;
  while (value >= 1024 && i < UNITS.length - 1) {
    value /= 1024;
    i += 1;
  }
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${UNITS[i]}`;
}

const TYPE_LABELS = {
  video: "Video",
  thumbnail: "Thumbnail",
  image: "Image",
  attachment: "Attachment",
};

const STATUS_LABELS = {
  active: "Active",
  missing: "Missing",
  deleted: "Deleted",
};

export function formatMediaType(type) {
  return TYPE_LABELS[type] || type || "-";
}

export function formatMediaStatus(status) {
  return STATUS_LABELS[status] || status || "Active";
}

export function mediaStatusTone(status) {
  if (status === "deleted") return "danger";
  if (status === "missing") return "warning";
  return "success";
}

export function isImageAsset(asset) {
  if (!asset) return false;
  if (asset.type === "thumbnail" || asset.type === "image") return true;
  return typeof asset.mimeType === "string" && asset.mimeType.startsWith("image/");
}

export function isVideoAsset(asset) {
  if (!asset) return false;
  if (asset.type === "video") return true;
  return typeof asset.mimeType === "string" && asset.mimeType.startsWith("video/");
}
