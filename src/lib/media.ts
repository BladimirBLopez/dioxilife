const EXTENSIONES_VIDEO = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
  ".ogv",
];

export function esVideo(url?: string | null): boolean {
  if (!url) return false;
  const limpio = url.split("?")[0].toLowerCase();
  return EXTENSIONES_VIDEO.some((ext) => limpio.endsWith(ext));
}
