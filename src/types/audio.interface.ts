export type MeditationAudioType = 'meditation_entry' | 'meditation_exit';

export interface AudioByTypeItem {
  id: number;
  title: string;
  type: MeditationAudioType;
  file_url: string;
  stream_url: string;
  created_at: string;
}

export interface AudioByTypeResponse {
  items: AudioByTypeItem[];
  total: number;
}
