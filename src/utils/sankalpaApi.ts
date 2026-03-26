import type { SankalpaGoal } from '../types/sankalpa';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { loadSankalpas, saveSankalpas } from './storage';

export const SANKALPAS_COLLECTION_PATH = '/sankalpas';
export const SANKALPAS_COLLECTION_ENDPOINT = buildApiPath(SANKALPAS_COLLECTION_PATH);

export function buildSankalpaDetailEndpoint(sankalpaId: string): string {
  return buildApiPath(`${SANKALPAS_COLLECTION_PATH}/${sankalpaId}`);
}

export function buildSankalpaCollectionUrl(apiBaseUrl?: string): string {
  return buildApiUrl(SANKALPAS_COLLECTION_PATH, apiBaseUrl);
}

export function buildSankalpaDetailUrl(sankalpaId: string, apiBaseUrl?: string): string {
  return buildApiUrl(`${SANKALPAS_COLLECTION_PATH}/${sankalpaId}`, apiBaseUrl);
}

export function listSankalpasFromApi(): SankalpaGoal[] {
  return loadSankalpas();
}

export function persistSankalpasToApi(sankalpas: SankalpaGoal[]): void {
  saveSankalpas(sankalpas);
}
