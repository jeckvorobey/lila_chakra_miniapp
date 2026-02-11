import { buildApiResourceUrl, api } from 'src/boot/axios';
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
};
