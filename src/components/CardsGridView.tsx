import React from 'react';
import { ClusteredGroup, ResponseItem } from '../types';
import { Heart, Trophy, Flame } from 'lucide-react';
import { calculateDynamicFontSize } from '../utils/grouping';

interface CardsGridViewProps {
  groups: ClusteredGroup[];
  allResponses: ResponseItem[];
  onLike: (id: string) => void;
}

export const CardsGridView: React.FC<CardsGridViewProps> = ({
  groups,
  allResponses,
  onLike,
}) => {
  const totalScoreAll = allResponses.reduce((sum, r) => sum + r.likes, 0) || 1;
  const allLikes = allResponses.map((r) => r.likes);
  const minScore = allLikes.length > 0 ? Math.min(...allLikes) : 1;
  const maxScore = allLikes.length > 0 ? Math.max(...allLikes) : 1;

  if (groups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        답변이 등록되면 그룹별 순위 카드가 표시됩니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto pr-1">
      {groups.map((group, rankIdx) => {
        const percent = Math.round((group.totalScore / totalScoreAll) * 100);

        return (
          <div
            key={group.id}
            className={`rounded-3xl border ${group.colorTheme.border} ${group.colorTheme.bg} p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 text-xs font-black flex items-center justify-center border border-slate-700">
                    {rankIdx === 0 ? (
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      rankIdx + 1
                    )}
                  </span>
                  <h4 className="font-bold text-base text-white">{group.category}</h4>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white">{percent}%</span>
                  <div className="text-[10px] text-slate-400">총 {group.totalScore}점</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Item lists */}
              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const { fontSizeRem, isHighTier } = calculateDynamicFontSize(
                    item.likes,
                    minScore,
                    maxScore
                  );
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl bg-slate-900/80 border ${
                        isHighTier
                          ? 'border-blue-500/40 ring-1 ring-blue-500/20 shadow-md'
                          : 'border-slate-800'
                      } flex items-center justify-between gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          style={{ fontSize: `${Math.min(fontSizeRem, 1.4)}rem` }}
                          className={`font-semibold text-slate-100 leading-tight break-keep ${
                            isHighTier ? 'text-blue-200' : ''
                          }`}
                        >
                          {item.text}
                        </div>
                        {item.note && (
                          <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {item.note}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onLike(item.id)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/40 border border-slate-700/80 text-xs font-bold text-slate-300 transition-all"
                        title="공감"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500/30 text-rose-400" />
                        <span>{item.likes}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
              <span>{group.items.length}개의 개별 답변</span>
              {rankIdx === 0 && (
                <span className="flex items-center gap-1 text-amber-300 font-semibold text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  최다 선호 행동
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
