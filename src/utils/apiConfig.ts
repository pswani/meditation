export const DEFAULT_API_BASE_PATH = '/api';

function normalizeRelativeApiPath(path: string): string {
  const trimmedPath = path.trim();

  if (trimmedPath.length === 0 || trimmedPath === '/') {
    return '';
  }

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
}

export function normalizeApiBaseUrl(apiBaseUrl: string): string {
  const trimmedApiBaseUrl = apiBaseUrl.trim();

  if (trimmedApiBaseUrl.length === 0) {
    return DEFAULT_API_BASE_PATH;
  }

  const normalizedApiBaseUrl = trimmedApiBaseUrl.replace(/\/+$/, '');
  return normalizedApiBaseUrl.length > 0 ? normalizedApiBaseUrl : DEFAULT_API_BASE_PATH;
}

export function getApiBaseUrl(configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL): string {
  return normalizeApiBaseUrl(configuredApiBaseUrl ?? DEFAULT_API_BASE_PATH);
}

export function buildApiPath(path: string): string {
  return `${DEFAULT_API_BASE_PATH}${normalizeRelativeApiPath(path)}`;
}

export function buildApiUrl(path: string, configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL): string {
  return `${getApiBaseUrl(configuredApiBaseUrl)}${normalizeRelativeApiPath(path)}`;
}
