export type MeditationAudioType = 'meditation_entry' | 'meditation_exit';

export interface AudioByTypeItem {
  id: number;
}

export interface AudioByTypeResponse {
  items: AudioByTypeItem[];
  total: number;
}
