import type { QueryCategory } from 'src/types/game.interface';

export interface QuerySuggestionsRequest {
  draft: string;
  category: QueryCategory;
  count: 10;
}

export interface QuerySuggestionItem {
  rank: number;
  text: string;
}

export interface QuerySuggestionsResponse {
  suggestions: QuerySuggestionItem[];
}
