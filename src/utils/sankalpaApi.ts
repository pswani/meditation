import type { SankalpaGoal } from '../types/sankalpa';
import { loadSankalpas, saveSankalpas } from './storage';

export const SANKALPAS_COLLECTION_ENDPOINT = '/api/sankalpas';

export function buildSankalpaDetailEndpoint(sankalpaId: string): string {
  return `${SANKALPAS_COLLECTION_ENDPOINT}/${sankalpaId}`;
}

export function listSankalpasFromApi(): SankalpaGoal[] {
  return loadSankalpas();
}

export function persistSankalpasToApi(sankalpas: SankalpaGoal[]): void {
  saveSankalpas(sankalpas);
}
