import { BlueprintRaw, BlueprintDerived, SortOption } from '../types';

export const parseBlueprintData = (raw: BlueprintRaw, basePath: string = './'): BlueprintDerived => {
  // Path Logic: blueprints/test_v1.xml -> images/test_v1.png
  // Remove 'blueprints/' prefix and '.xml' suffix
  const cleanPath = raw.p.replace(/^blueprints\//, '').replace(/\.xml$/, '');
  
  const imageMain = `${basePath}images/${cleanPath}.png`;
  const imageMinimap = `${basePath}images/${cleanPath}_minimap.png`;

  // Rating Logic
  const totalVotes = raw.s_l + raw.s_d;
  let rating: number | null = null;
  if (totalVotes > 5) {
    rating = (raw.s_l / totalVotes) * 100;
  }

  // Comprehensive Score (Custom Weighting)
  // Weighted algorithm: downloads * 1 + likes * 5 + (isFeatured * 50)
  const score = (raw.s_dl * 1) + (raw.s_l * 5) + (raw.fe * 50);

  return {
    ...raw,
    imageMain,
    imageMinimap,
    rating,
    comprehensiveScore: score,
  };
};

export const sortBlueprints = (blueprints: BlueprintDerived[], sortBy: SortOption): BlueprintDerived[] => {
  return [...blueprints].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.dt).getTime() - new Date(a.dt).getTime();
      case 'downloads':
        return b.s_dl - a.s_dl;
      case 'likes':
        return b.s_l - a.s_l;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'score':
      default:
        return b.comprehensiveScore - a.comprehensiveScore;
    }
  });
};