import React from 'react';
import { X, Sparkles, Brain, Award, ArrowRight, Lightbulb, Users } from 'lucide-react';
import { AIAnalysisResult } from '../types';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: AIAnalysisResult | null;
  error?: string | null;
  onRetry: () => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  data,
  error,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  AI 스마트 그룹핑 & 강사용 인사이트 분석
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                학습자들의 실시간 답변 패턴을 심층 분석하고 강의 진행 조언을 제안합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative w-14 h-14 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                <div className="w-14 h-14 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-base font-semibold text-white">
                학습자들의 답변을 실시간 분석 중입니다...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                유사 키워드 군집화 및 비즈니스 소통 피드백 생성 중
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
              <p className="text-sm font-semibold text-rose-300 mb-2">{error}</p>
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                다시 시도하기
              </button>
            </div>
          )}

          {!isLoading && data && (
            <>
              {/* Top Insight Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-slate-900/50 border border-purple-500/30 shadow-lg">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>전체 응답 핵심 관통 인사이트</span>
                </div>
                <p className="text-base text-slate-100 font-medium leading-relaxed">
                  {data.topInsight}
                </p>
              </div>

              {/* Clusters Breakdown */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>학습자 행동 유형별 클러스터 ({data.clusters?.length || 0}개 그룹)</span>
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {data.clusters?.map((cluster, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                            {idx + 1}
                          </span>
                          {cluster.name}
                        </span>
                        {cluster.percentage && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                            약 {cluster.percentage}%
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                        {cluster.description}
                      </p>

                      {/* Sample phrases */}
                      {cluster.samplePhrases && cluster.samplePhrases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {cluster.samplePhrases.map((phrase, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-2.5 py-1 bg-slate-900/80 rounded-lg text-xs text-slate-300 border border-slate-700/60"
                            >
                              "{phrase}"
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Recommended lecture tip */}
                      <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-purple-200">
                          <strong className="text-amber-300 mr-1">강사 코칭 팁:</strong>
                          {cluster.recommendedAdvice}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Takeaway for Lecturer */}
              {data.lecturerKeyTakeaway && (
                <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>강의 마무리 총평 가이드</span>
                  </div>
                  <p className="text-sm text-emerald-100 font-medium leading-relaxed">
                    {data.lecturerKeyTakeaway}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
