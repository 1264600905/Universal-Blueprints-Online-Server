export interface BlueprintRaw {
  id: string;
  n: string; // Name
  a: string; // Author
  sid: string;
  c: string; // Category
  v: string; // Version
  t: string;
  w: number; // Width
  h: number; // Height
  m: string[]; // Mods
  p: string; // XML Path
  s_l: number; // Likes
  s_d: number; // Dislikes
  s_dl: number; // Downloads
  dt: string; // Upload Date
  ut: string; // Update Date
  fe: number; // Featured (0 or 1)
}

export interface BlueprintIndex {
  version: string;
  generated_at: string;
  mode: string;
  count: number;
  blueprints: BlueprintRaw[];
}

export interface BlueprintDerived extends BlueprintRaw {
  imageMain: string;
  imageMinimap: string;
  rating: number | null; // Null if not enough votes
  comprehensiveScore: number; // For sorting
}

export type SortOption = 'newest' | 'downloads' | 'likes' | 'rating' | 'score';
export type Language = 'en' | 'cn';
