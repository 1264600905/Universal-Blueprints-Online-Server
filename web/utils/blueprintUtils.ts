import { BlueprintRaw, BlueprintDerived, SortOption, TimeFilterOption, Language } from '../types';

export const OFFICIAL_CATEGORY_ORDER: string[] = [
  'Dormitory', 'Workshop', 'Storage', 'AnimalFarm',
  'PlantingArea', 'Canteen', 'RecreationArea',
  'DefenseWorks', 'Power', 'Medical', 'Research', 'Prison',
  'OdysseyDLC', 'RoyaltyDLC', 'IdeologyDLC', 'BiotechDLC', 'AnomalyDLC',
  'BaseBlueprint', 'Other'
];

export const mapToOfficialCategoryKey = (rawCategory: string | null | undefined): string | null => {
  if (!rawCategory) return null;
  if (OFFICIAL_CATEGORY_ORDER.includes(rawCategory)) return rawCategory;

  switch (rawCategory) {
    case '宿舍': return 'Dormitory';
    case '车间': return 'Workshop';
    case 'Labor': return 'Workshop';
    case '储藏室': return 'Storage';
    case 'Storeroom': return 'Storage';
    case '动物农场': return 'AnimalFarm';
    case '种植区': return 'PlantingArea';
    case 'Plantation': return 'PlantingArea';
    case '食堂': return 'Canteen';
    case '娱乐区': return 'RecreationArea';
    case '防御工事': return 'DefenseWorks';
    case '电力': return 'Power';
    case '医疗': return 'Medical';
    case '科研': return 'Research';
    case '牢房': return 'Prison';
    case '奥德赛DLC': return 'OdysseyDLC';
    case '皇权DLC': return 'RoyaltyDLC';
    case '文化DLC': return 'IdeologyDLC';
    case '生物科技DLC': return 'BiotechDLC';
    case '异常DLC': return 'AnomalyDLC';
    case '基地蓝图': return 'BaseBlueprint';
    case '其他': return 'Other';
    default: return null;
  }
};

export const getDisplayCategoryName = (category: string, lang: Language): string => {
  if (category === 'All') return lang === 'cn' ? '全部' : 'All';

  const officialKey = mapToOfficialCategoryKey(category) ?? (OFFICIAL_CATEGORY_ORDER.includes(category) ? category : null);
  if (!officialKey) return category;

  if (lang === 'en') return officialKey;

  switch (officialKey) {
    case 'Dormitory': return '宿舍';
    case 'Workshop': return '车间';
    case 'Storage': return '储藏室';
    case 'AnimalFarm': return '动物农场';
    case 'PlantingArea': return '种植区';
    case 'Canteen': return '食堂';
    case 'RecreationArea': return '娱乐区';
    case 'DefenseWorks': return '防御工事';
    case 'Power': return '电力';
    case 'Medical': return '医疗';
    case 'Research': return '科研';
    case 'Prison': return '牢房';
    case 'OdysseyDLC': return '奥德赛DLC';
    case 'RoyaltyDLC': return '皇权DLC';
    case 'IdeologyDLC': return '文化DLC';
    case 'BiotechDLC': return '生物科技DLC';
    case 'AnomalyDLC': return '异常DLC';
    case 'BaseBlueprint': return '基地蓝图';
    case 'Other': return '其他';
    default: return officialKey;
  }
};

export const getTimeFilterCutoff = (option: TimeFilterOption, now: Date = new Date()): Date | null => {
  const d = new Date(now.getTime());
  switch (option) {
    case 'last7Days': d.setDate(d.getDate() - 7); return d;
    case 'last15Days': d.setDate(d.getDate() - 15); return d;
    case 'last30Days': d.setDate(d.getDate() - 30); return d;
    case 'last3Months': d.setMonth(d.getMonth() - 3); return d;
    case 'last6Months': d.setMonth(d.getMonth() - 6); return d;
    case 'lastYear': d.setFullYear(d.getFullYear() - 1); return d;
    case 'all':
    default:
      return null;
  }
};

export const getLikeRatio = (likes: number, dislikes: number): number => {
  const totalVotes = likes + dislikes;
  if (totalVotes === 0) return 0;
  if (totalVotes < 3) return 0.5;
  return likes / totalVotes;
};

export const calculatePopularityScore = (likes: number, dislikes: number, downloads: number): number => {
  const likeDiff = likes - dislikes;
  const ratioBonus = getLikeRatio(likes, dislikes) * 20;
  const downloadScore = downloads * 0.1;
  return likeDiff + ratioBonus + downloadScore;
};

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

  const popularityScore = calculatePopularityScore(raw.s_l, raw.s_d, raw.s_dl);

  return {
    ...raw,
    imageMain,
    imageMinimap,
    rating,
    popularityScore,
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
        return (b.s_l + getLikeRatio(b.s_l, b.s_d) * 10) - (a.s_l + getLikeRatio(a.s_l, a.s_d) * 10);
      case 'popularity':
      default:
        return b.popularityScore - a.popularityScore;
    }
  });
};

export const buildXmlUrl = (raw: BlueprintRaw, basePath: string = './'): string => {
  // If raw.p is like 'blueprints/xxx.xml', construct the URL based on basePath or REMOTE_BASE_URL
  if (basePath.startsWith('http')) {
    return `${basePath}${raw.p}`;
  }
  return `${basePath}${raw.p}`;
};

export const formatBlueprintDate = (dt: string, lang: Language): string => {
  try {
    const date = new Date(dt);
    if (isNaN(date.getTime())) return dt;
    return date.toLocaleDateString(lang === 'cn' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dt;
  }
};

export const resolveAssetUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  // Use import.meta.env.BASE_URL for static assets
  const base = import.meta.env.BASE_URL;
  return path.startsWith('/') ? `${base}${path.slice(1)}` : `${base}${path}`;
};
