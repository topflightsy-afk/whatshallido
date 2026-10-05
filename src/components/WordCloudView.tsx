import React, { useState } from 'react';
import { ResponseItem, ClusteredGroup } from '../types';
import { calculateDynamicFontSize } from '../utils/grouping';
import { Heart, MessageSquare, Flame, Sparkles, Filter } from 'lucide-react';

interface WordCloudViewProps {
  groups: ClusteredGroup[];
  allResponses: ResponseItem[];
  onLike: (id: string) => void;
  selectedCategoryId: string | null;
  onSelectCategory: (catId: string | null) => void;
}

export const WordCloudView: React.FC<WordCloudViewProps> = ({
  groups,
  allResponses,
  onLike,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [activeItem, setActiveItem] = useState<ResponseItem | null>(null);

  // Compute min/max scores for normalization
  const allLikes = allResponses.map((r) => r.likes);
  const minScore = allLikes.length > 0 ? Math.min(...allLikes) : 1;
  const maxScore = allLikes.length > 0 ? Math.max(...allLikes) : 1;

  const filteredGroups = selectedCategoryId
    ? groups.filter((g) => g.id === selectedCategoryId)
    : groups;

  if (allResponses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 animate-pulse">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          아직 접수된 학습자 답변이 없습니다
        </h3>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          스마트폰으로 우측 상단 QR코드를 스캔하여 첫 번째 답변을 등록해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border ${
            selectedCategoryId === null
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>전체 통합 보기 ({allResponses.length}건)</span>
        </button>

        {groups.map((group) => {
          const isSelected = selectedCategoryId === group.id;
          return (
            <button
              key={group.id}
              onClick={() => onSelectCategory(isSelected ? null : group.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border ${
                isSelected
                  ? `${group.colorTheme.badge} ring-2 ring-blue-400/30 font-bold`
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80" />
              <span>{group.category}</span>
              <span className="opacity-70 text-[10px]">({group.items.length})</span>
            </button>
          );
        })}
      </div>

      {/* Main Dynamic Grouped Clusters & Word Cloud Canvas */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        {filteredGroups.map((group) => {
          return (
            <div
              key={group.id}
              className={`rounded-3xl border ${group.colorTheme.border} ${group.colorTheme.bg} p-6 sm:p-7 backdrop-blur-sm shadow-xl transition-all duration-300 relative overflow-hidden`}
            >
              {/* Category Header with summary */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-5 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${group.colorTheme.badge} uppercase tracking-wider flex items-center gap-1.5`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{group.category}</span>
                  </span>
                  <span className="text-slate-400 text-xs font-medium">
                    답변 {group.items.length}개 · 총 공감 {group.totalScore}점
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {((group.totalScore / (allResponses.reduce((s, r) => s + r.likes, 0) || 1)) * 100).toFixed(0)}% 비중
                </div>
              </div>

              {/* Dynamic Font-Sized Word Tags Grid inside Cluster */}
              <div className="flex flex-wrap items-center justify-start gap-3 sm:gap-4">
                {group.items.map((item) => {
                  const { fontSizeRem, fontSizeClass, paddingClass, isHighTier } =
                    calculateDynamicFontSize(item.likes, minScore, maxScore);

                  const isPopular = item.likes >= 5;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      style={{ fontSize: `${fontSizeRem}rem` }}
                      className={`group relative inline-flex items-center gap-2.5 rounded-2xl cursor-pointer border transition-all duration-300 select-none ${paddingClass} ${
                        isHighTier
                          ? 'bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-blue-400/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30 text-white hover:scale-105'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900/90 hover:scale-102'
                      }`}
                    >
                      {/* Popular Flame badge */}
                      {isPopular && (
                        <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      )}

                      {/* Main Text */}
                      <span className={`leading-snug break-keep ${fontSizeClass}`}>
                        {item.text}
                      </span>

                      {/* Empathy/Like badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike(item.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all ml-1"
                        title="공감 투표하기 (+1)"
                      >
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>{item.likes}</span>
                      </button>

                      {/* Note indicator if exists */}
                      {item.note && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="상세 메모 있음" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Detail Popover / Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                {activeItem.category}
              </span>
              <button
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg bg-slate-800"
              >
                닫기
              </button>
            </div>

            <h4 className="text-xl font-bold mb-3 text-white leading-relaxed">
              "{activeItem.text}"
            </h4>

            {activeItem.note ? (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 mb-5 leading-relaxed">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  학습자의 상세 메모 / 이유:
                </div>
                {activeItem.note}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-5">
                별도의 메모 없이 등록된 답변입니다.
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                총 {activeItem.likes}명이 이 답변에 공감했습니다.
              </span>
              <button
                onClick={() => {
                  onLike(activeItem.id);
                  setActiveItem({
                    ...activeItem,
                    likes: activeItem.likes + 1,
                  });
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>+1 공감하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
