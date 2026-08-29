const localOrigin = "https://dealwar.local";

export function safeReturnPath(value: unknown, fallback = "/my-deals") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;

  try {
    const url = new URL(value, localOrigin);
    const decodedPath = decodeURIComponent(url.pathname);
    if (url.origin !== localOrigin || decodedPath.includes("\\") || decodedPath.startsWith("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
