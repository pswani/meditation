import type { Playlist } from '../types/playlist';
import { loadPlaylists, savePlaylists } from './storage';

export const PLAYLISTS_COLLECTION_ENDPOINT = '/api/playlists';

export function buildPlaylistDetailEndpoint(playlistId: string): string {
  return `${PLAYLISTS_COLLECTION_ENDPOINT}/${playlistId}`;
}

export async function listPlaylistsFromApi(): Promise<Playlist[]> {
  return loadPlaylists();
}

export async function persistPlaylistsToApi(playlists: Playlist[]): Promise<void> {
  savePlaylists(playlists);
}
