import { ResponseItem, ClusteredGroup } from '../types';

export const CATEGORY_THEMES: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
    badge: string;
    lightBg: string;
  }
> = {
  '마감일 및 일정 확인': {
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    text: 'text-rose-300',
    glow: 'shadow-rose-500/20',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    lightBg: 'from-rose-500/20 to-red-500/10',
  },
  '업무 목적 및 기대결과 확인': {
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    lightBg: 'from-amber-500/20 to-orange-500/10',
  },
  '추가 질문 및 지시 재확인': {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    lightBg: 'from-emerald-500/20 to-teal-500/10',
  },
  '메모 및 요구사항 정리': {
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    glow: 'shadow-sky-500/20',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    lightBg: 'from-sky-500/20 to-cyan-500/10',
  },
  '기존 자료 및 레퍼런스 탐색': {
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-500/40',
    text: 'text-indigo-300',
    glow: 'shadow-indigo-500/20',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    lightBg: 'from-indigo-500/20 to-violet-500/10',
  },
  '일정 계획 및 To-Do 분해': {
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    lightBg: 'from-purple-500/20 to-fuchsia-500/10',
  },
  '동료/선배 조언 및 협업 조율': {
    bg: 'bg-pink-950/40',
    border: 'border-pink-500/40',
    text: 'text-pink-300',
    glow: 'shadow-pink-500/20',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    lightBg: 'from-pink-500/20 to-rose-500/10',
  },
  '마음가짐 & 멘탈 정돈': {
    bg: 'bg-teal-950/40',
    border: 'border-teal-500/40',
    text: 'text-teal-300',
    glow: 'shadow-teal-500/20',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    lightBg: 'from-teal-500/20 to-emerald-500/10',
  },
  '기타 실행 방안': {
    bg: 'bg-slate-900/60',
    border: 'border-slate-700',
    text: 'text-slate-300',
    glow: 'shadow-slate-500/10',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    lightBg: 'from-slate-800/40 to-slate-900/30',
  },
};

export const DEFAULT_THEME = CATEGORY_THEMES['기타 실행 방안'];

/**
 * Groups raw responses into semantic cluster groups.
 * Computes total score (likes + occurrences) for font scaling.
 */
export function clusterResponses(responses: ResponseItem[]): ClusteredGroup[] {
  const map = new Map<string, ResponseItem[]>();

  responses.forEach((item) => {
    const cat = item.category || '기타 실행 방안';
    if (!map.has(cat)) {
      map.set(cat, []);
    }
    map.get(cat)!.push(item);
  });

  const clusters: ClusteredGroup[] = [];

  map.forEach((items, category) => {
    // Sort items inside cluster by likes descending
    items.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);

    const totalScore = items.reduce((sum, item) => sum + item.likes, 0);

    clusters.push({
      id: 'cluster_' + encodeURIComponent(category),
      category,
      title: category,
      totalScore,
      itemsCount: items.length,
      items,
      colorTheme: CATEGORY_THEMES[category] || DEFAULT_THEME,
    });
  });

  // Sort clusters by overall score descending
  clusters.sort((a, b) => b.totalScore - a.totalScore || b.itemsCount - a.itemsCount);

  return clusters;
}

/**
 * Calculates dynamic font size styling in rem based on min/max scores in current dataset
 */
export function calculateDynamicFontSize(
  score: number,
  minScore: number,
  maxScore: number
): {
  fontSizeRem: number;
  fontSizeClass: string;
  paddingClass: string;
  isHighTier: boolean;
} {
  if (maxScore <= minScore) {
    return {
      fontSizeRem: 1.25,
      fontSizeClass: 'text-xl',
      paddingClass: 'px-4 py-2.5',
      isHighTier: false,
    };
  }

  // Normalized ratio 0.0 to 1.0
  const ratio = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));

  // Font size range from 1.05rem (small) to 2.85rem (huge)
  const fontSizeRem = Number((1.05 + ratio * 1.8).toFixed(2));

  let fontSizeClass = 'text-base font-medium';
  let paddingClass = 'px-3.5 py-2';
  let isHighTier = false;

  if (ratio > 0.75) {
    fontSizeClass = 'text-3xl md:text-4xl font-extrabold tracking-tight';
    paddingClass = 'px-6 py-4';
    isHighTier = true;
  } else if (ratio > 0.45) {
    fontSizeClass = 'text-2xl md:text-3xl font-bold';
    paddingClass = 'px-5 py-3.5';
    isHighTier = true;
  } else if (ratio > 0.2) {
    fontSizeClass = 'text-lg md:text-xl font-semibold';
    paddingClass = 'px-4 py-2.5';
  }

  return {
    fontSizeRem,
    fontSizeClass,
    paddingClass,
    isHighTier,
  };
}
