export interface Game {
  id: string;
  collectionId: string;
  name: string;
  yearPublished: number;
  image: string;
  thumbnail: string;
  players: {
    min: number;
    max: number;
  };
  playtime: {
    min: number;
    max: number;
  };
  numOwned: number;
  rating: {
    average: number;
    bayesAverage: number;
    usersRated: number;
    rank: number | null;
    strategyRank: number | null;
  };
  status: {
    owned: boolean;
    previouslyOwned: boolean;
    forTrade: boolean;
    want: boolean;
    wantToPlay: boolean;
    wantToBuy: boolean;
    wishlist: boolean;
    preordered: boolean;
    lastModified: string;
  };
  numPlays: number;
  description?: string;
  weight?: number; // complexity 1-5
  categories?: string[];
  mechanics?: string[];
  designers?: string[];
  userRating?: number;
}

export interface GameCollection {
  totalItems: number;
  pubDate: string;
  games: Game[];
}

export type SortOption = 
  | 'rating-high'
  | 'rating-low'
  | 'name-asc'
  | 'name-desc'
  | 'year-new'
  | 'year-old'
  | 'complexity-high'
  | 'complexity-low'
  | 'plays-high'
  | 'plays-low'
  | 'user-rating';

export interface FilterState {
  playerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  category: string | null;
}
