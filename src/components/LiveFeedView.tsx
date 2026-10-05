import React from 'react';
import { ResponseItem } from '../types';
import { Heart, Clock, MessageSquare } from 'lucide-react';
import { CATEGORY_THEMES, DEFAULT_THEME } from '../utils/grouping';

interface LiveFeedViewProps {
  responses: ResponseItem[];
  onLike: (id: string) => void;
}

export const LiveFeedView: React.FC<LiveFeedViewProps> = ({ responses, onLike }) => {
  // Sort responses newest first
  const sorted = [...responses].sort((a, b) => b.createdAt - a.createdAt);

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return new Date(ts).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        답변이 등록되면 실시간 타임라인 피드로 표시됩니다.
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      {sorted.map((item) => {
        const theme = CATEGORY_THEMES[item.category] || DEFAULT_THEME;
        return (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badge}`}
                >
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {formatTime(item.createdAt)}
                </span>
              </div>
              <div className="text-base font-bold text-slate-100 break-keep">
                {item.text}
              </div>
              {item.note && (
                <div className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                  <span>{item.note}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onLike(item.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700/80 text-xs font-bold text-slate-300 transition-all"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{item.likes}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
