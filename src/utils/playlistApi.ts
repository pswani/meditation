import type { Playlist } from '../types/playlist';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { loadPlaylists, savePlaylists } from './storage';

export const PLAYLISTS_COLLECTION_PATH = '/playlists';
export const PLAYLISTS_COLLECTION_ENDPOINT = buildApiPath(PLAYLISTS_COLLECTION_PATH);

export function buildPlaylistDetailEndpoint(playlistId: string): string {
  return buildApiPath(`${PLAYLISTS_COLLECTION_PATH}/${playlistId}`);
}

export function buildPlaylistCollectionUrl(apiBaseUrl?: string): string {
  return buildApiUrl(PLAYLISTS_COLLECTION_PATH, apiBaseUrl);
}

export function buildPlaylistDetailUrl(playlistId: string, apiBaseUrl?: string): string {
  return buildApiUrl(`${PLAYLISTS_COLLECTION_PATH}/${playlistId}`, apiBaseUrl);
}

export async function listPlaylistsFromApi(): Promise<Playlist[]> {
  return loadPlaylists();
}

export async function persistPlaylistsToApi(playlists: Playlist[]): Promise<void> {
  savePlaylists(playlists);
}
