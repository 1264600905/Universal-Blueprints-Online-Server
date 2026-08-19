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
  am?: number; // Architectural Medal (0 or 1) (optional)
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
  popularityScore: number; // For sorting (matches in-game "Popularity" concept)
}

export interface BlueprintListItem extends BlueprintDerived {
  // Can add list-specific properties here if needed in the future
}

export interface ModInfo {
  packageId: string;
  name: string;
}

export interface BlueprintDetailData {
  description: string;
  mods: ModInfo[];
  referenceUrl: string;
  referenceUrlName?: string;
  rawXml: string;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface FilterCounts {
  category: Record<string, number>;
  time: Record<TimeFilterOption, number>;
  sort: Record<SortOption, number>;
}

export type SortOption = 'popularity' | 'likes' | 'downloads' | 'newest' | 'featured' | 'medal';
export type TimeFilterOption = 'all' | 'last7Days' | 'last15Days' | 'last30Days' | 'last3Months' | 'last6Months' | 'lastYear';
export type Language = 'en' | 'cn';
