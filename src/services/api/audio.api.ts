import { buildApiResourceUrl, api } from 'src/lib/api-client';
import type { AudioByTypeResponse, MeditationAudioType } from 'src/types/audio.interface';

/**
 * API аудио.
 */
export const audioApi = {
  /**
   * Получить список аудио по типу.
   */
  async getByType(type: MeditationAudioType): Promise<AudioByTypeResponse> {
    const response = await api.get<AudioByTypeResponse>(`/audio/by-type/${type}`);
    return response.data;
  },

  /**
   * Получить ссылку на поток аудио.
   */
  getStreamUrl(audioId: number): string {
    return buildApiResourceUrl(`/audio/${audioId}/stream`);
  },

  /**
   * Получить аудиопоток как Blob (с авторизацией через axios).
   */
  async getStreamBlob(audioId: number): Promise<Blob> {
    const response = await api.get<Blob>(`/audio/${audioId}/stream`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
