import React, { useState } from 'react';
import { ResponseItem, SessionState } from '../types';
import { CATEGORY_THEMES, DEFAULT_THEME } from '../utils/grouping';
import {
  Send,
  Heart,
  CheckCircle2,
  PlusCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearnerScreenProps {
  session: SessionState;
  responses: ResponseItem[];
  onSubmit: (text: string, note?: string) => Promise<boolean>;
  onLike: (id: string) => void;
  onSwitchToPresenter: () => void;
  isConnected: boolean;
}

export const LearnerScreen: React.FC<LearnerScreenProps> = ({
  session,
  responses,
  onSubmit,
  onLike,
  onSwitchToPresenter,
  isConnected,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastSubmittedText, setLastSubmittedText] = useState('');
  const [filterText, setFilterText] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onSubmit(inputText.trim(), inputNote.trim() || undefined);
    setIsSubmitting(false);

    if (success) {
      setLastSubmittedText(inputText.trim());
      setHasSubmitted(true);
      setInputText('');
      setInputNote('');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const handleLike = (id: string) => {
    onLike(id);
    setLikedIds((prev) => new Set(prev).add(id));
  };

  const filteredResponses = responses.filter(
    (r) =>
      r.text.toLowerCase().includes(filterText.toLowerCase()) ||
      r.category.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight block">
                학습자 실시간 응답방
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {isConnected ? '실시간 연결됨' : '연결 중...'}
              </span>
            </div>
          </div>

          <button
            onClick={onSwitchToPresenter}
            className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 transition-colors"
          >
            <span>강사용 대형 화면</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto px-4 pt-5 flex-1 flex flex-col gap-6">
        {/* Question Card */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
              강의 질문 Q
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              익명 참여 · 이름 불필요
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2 tracking-tight break-keep">
            {session.title}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            {session.subTitle}
          </p>

          {!session.isOpen && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center gap-2 text-rose-300 text-xs font-semibold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>현재 강사님이 답변 접수를 마감했습니다.</span>
            </div>
          )}
        </div>

        {/* Success Banner if already submitted */}
        {hasSubmitted && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-emerald-300">
                  답변이 성공적으로 등록되었습니다!
                </div>
                <div className="text-xs text-emerald-200/80 mt-0.5">
                  "{lastSubmittedText}" 내용이 대형 화면에 실시간 반영되었습니다.
                </div>
              </div>
            </div>
            <button
              onClick={() => setHasSubmitted(false)}
              className="shrink-0 p-1.5 rounded-lg bg-emerald-900/60 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>또 남기기</span>
            </button>
          </div>
        )}

        {/* Submission Form (shown if not submitted or if learner wants to submit again) */}
        {(!hasSubmitted || !lastSubmittedText) && session.isOpen && (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                내가 가장 먼저 할 일 (필수)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="팀장님께 지시를 받은 직후, 내가 가장 먼저 취할 행동이나 생각을 솔직하게 적어주세요..."
                rows={4}
                maxLength={100}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 px-0.5">
                <span>학습자의 솔직한 첫 행동을 자유롭게 남겨주세요</span>
                <span className="font-mono text-slate-500">{inputText.length} / 100자</span>
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                이유나 팁이 있다면? (선택)
              </label>
              <input
                type="text"
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                placeholder="예: 마감일을 모르면 일을 어디까지 파야할지 모호해서"
                maxLength={150}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <span>등록 중...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>익명으로 답변 제출하기</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Live Aggregation & Empathy Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>다른 학습자들의 답변 ({responses.length}개)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              하트를 누르면 대형화면 폰트가 커집니다!
            </span>
          </div>

          {/* Search/filter within mobile */}
          {responses.length > 5 && (
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="답변 검색하기..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          )}

          {/* Responses List */}
          <div className="space-y-2.5">
            {filteredResponses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                아직 등록된 답변이 없습니다. 첫 답변을 작성해보세요!
              </div>
            ) : (
              filteredResponses.map((item) => {
                const theme = CATEGORY_THEMES[item.category] || DEFAULT_THEME;
                const isLikedByMe = likedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${theme.badge}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-100 leading-snug break-keep">
                        {item.text}
                      </div>
                      {item.note && (
                        <div className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                          <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-slate-500" />
                          <span>{item.note}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleLike(item.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-90 ${
                        isLikedByMe
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLikedByMe ? 'fill-white text-white' : 'text-rose-400'
                        }`}
                      />
                      <span>{item.likes}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
