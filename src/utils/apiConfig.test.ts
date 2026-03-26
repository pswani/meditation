import { describe, expect, it } from 'vitest';
import { buildApiPath, buildApiUrl, DEFAULT_API_BASE_PATH, getApiBaseUrl, normalizeApiBaseUrl } from './apiConfig';

describe('api config', () => {
  it('defaults to same-origin api path when no base is configured', () => {
    expect(DEFAULT_API_BASE_PATH).toBe('/api');
    expect(getApiBaseUrl(undefined)).toBe('/api');
    expect(buildApiPath('/playlists')).toBe('/api/playlists');
    expect(buildApiUrl('/playlists', undefined)).toBe('/api/playlists');
  });

  it('normalizes configured api base URLs for LAN-friendly overrides', () => {
    expect(normalizeApiBaseUrl(' http://192.168.1.25:8080/api/ ')).toBe('http://192.168.1.25:8080/api');
    expect(buildApiUrl('/playlists', 'http://192.168.1.25:8080/api/')).toBe('http://192.168.1.25:8080/api/playlists');
  });

  it('normalizes relative api base paths without duplicating slashes', () => {
    expect(normalizeApiBaseUrl('/api/')).toBe('/api');
    expect(buildApiUrl('sankalpas', '/api/')).toBe('/api/sankalpas');
    expect(buildApiUrl('/', '/api/')).toBe('/api');
  });
});
