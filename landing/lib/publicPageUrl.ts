/**
 * Absolute URLs for exported static pages (S3 / LocalStack) and next dev.
 *
 * Prefer NEXT_PUBLIC_APP_URL (full site root, often including base path) so
 * links in emails match the deployed site even when the trial form was opened
 * from a wrong path. Otherwise use origin + NEXT_PUBLIC_BASE_PATH.
 */

function normalizeBasePath(raw: string | undefined): string {
  const s = (raw || "").trim();
  if (!s) return "";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
}

function siteRoot(): string {
  const explicit = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (explicit) {
    return explicit;
  }
  if (typeof window === "undefined") {
    return "";
  }
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
  return `${window.location.origin}${basePath}`;
}

/**
 * @param page Route name without extension, e.g. "verify", "trial-verified", "trial"
 */
export function publicPageUrl(page: string): string {
  const name = (page || "").replace(/^\//, "").replace(/\.html$/, "");
  const isDev = process.env.NODE_ENV === "development";
  const path = isDev ? `/${name}` : `/${name}.html`;
  const root = siteRoot();
  if (!root) {
    return path;
  }
  return `${root}${path}`;
}
