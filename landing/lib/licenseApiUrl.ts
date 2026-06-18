export function normalizeLicenseApiUrl(rawUrl: string): string {
  const trimmed = rawUrl.replace(/\/+$/, "");
  if (trimmed.includes("/restapis/") && trimmed.includes("//_user_request_")) {
    return trimmed.replace(
      /\/restapis\/([^/]+)\/\/_user_request_/,
      "/restapis/$1/$default/_user_request_",
    );
  }
  return trimmed;
}

