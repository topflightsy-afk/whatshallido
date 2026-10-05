import React, { useState } from 'react';
import { ResponseItem, SessionState, ClusteredGroup, AIAnalysisResult } from '../types';
import { WordCloudView } from './WordCloudView';
import { CardsGridView } from './CardsGridView';
import { LiveFeedView } from './LiveFeedView';
import { QRCodeModal } from './QRCodeModal';
import { AIAnalysisModal } from './AIAnalysisModal';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Database,
  Pause,
  Play,
  Share2,
  Brain,
  Layers,
  LayoutGrid,
  ListOrdered,
  Users,
  Check,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PresenterScreenProps {
  session: SessionState;
  responses: ResponseItem[];
  groups: ClusteredGroup[];
  joinUrl: string;
  onLike: (id: string) => void;
  onReset: () => void;
  onSeed: () => void;
  onToggleStatus: () => void;
  isConnected: boolean;
}

export const PresenterScreen: React.FC<PresenterScreenProps> = ({
  session,
  responses,
  groups,
  joinUrl,
  onLike,
  onReset,
  onSeed,
  onToggleStatus,
  isConnected,
}) => {
  const [viewMode, setViewMode] = useState<'cloud' | 'cards' | 'feed'>('cloud');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const totalLikes = responses.reduce((acc, cur) => acc + cur.likes, 0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleExportCSV = () => {
    if (responses.length === 0) {
      alert('내보낼 답변 데이터가 없습니다.');
      return;
    }
    const headers = ['구분(카테고리)', '답변내용', '상세메모', '공감수', '작성일시'];
    const rows = responses.map((r) => [
      `"${r.category}"`,
      `"${r.text.replace(/"/g, '""')}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
      r.likes,
      `"${new Date(r.createdAt).toLocaleString('ko-KR')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `강의답변_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestAIAnalysis = async () => {
    if (responses.length === 0) {
      alert('분석할 응답 데이터가 없습니다. 먼저 답변을 수집하거나 [예시 데이터]를 채워보세요.');
      return;
    }
    setIsAIModalOpen(true);
    setIsAILoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI 분석 요청에 실패했습니다.');
      }
      setAiAnalysis(data.analysis);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setAiError(err.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Main Title & Subtitle */}
          <div className="flex items-center gap-3.5 text-center lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center lg:justify-start gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {session.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    session.isOpen
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      session.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {session.isOpen ? '답변 수집 중' : '답변 마감됨'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {session.subTitle}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {/* Realtime Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-slate-300 font-medium">
                {isConnected ? '실시간 연동됨' : '연결 중...'}
              </span>
            </div>

            {/* Response & Like Counters */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">답변</span>
              <strong className="text-white font-bold">{responses.length}개</strong>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">공감</span>
              <strong className="text-rose-400 font-bold">{totalLikes}회</strong>
            </div>

            {/* QR Code Big Button */}
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR코드 확대</span>
            </button>

            {/* AI Analysis Button */}
            <button
              onClick={handleRequestAIAnalysis}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>AI 스마트 분석</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Sub-toolbar (Views & Instructor Operations) */}
      <div className="bg-slate-950/90 border-b border-slate-800/60 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewMode('cloud')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'cloud'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>동적 워드클라우드</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>그룹별 카드 뷰</span>
            </button>

            <button
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'feed'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>실시간 피드</span>
            </button>
          </div>

          {/* Instructor Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Toggle Open/Closed */}
            <button
              onClick={onToggleStatus}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
                session.isOpen
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {session.isOpen ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>접수 일시중지</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>답변 다시받기</span>
                </>
              )}
            </button>

            {/* Seed Data Button */}
            <button
              onClick={onSeed}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
              title="강의 시연을 위한 모의 답변 13개 생성"
            >
              <Database className="w-3 h-3 text-cyan-400" />
              <span>예시 데이터 채우기</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={() => {
                if (window.confirm('정말 모든 답변을 초기화하시겠습니까?')) {
                  onReset();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-all"
              title="초기화"
            >
              <RefreshCw className="w-3 h-3" />
              <span>초기화</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
              title="CSV 다운로드"
            >
              <Share2 className="w-3 h-3" />
              <span>CSV 저장</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
              title={isFullscreen ? '전체화면 종료' : '전체화면 모드'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col relative">
        {viewMode === 'cloud' && (
          <WordCloudView
            groups={groups}
            allResponses={responses}
            onLike={onLike}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}

        {viewMode === 'cards' && (
          <CardsGridView
            groups={groups}
            allResponses={responses}
            onLike={onLike}
          />
        )}

        {viewMode === 'feed' && (
          <LiveFeedView
            responses={responses}
            onLike={onLike}
          />
        )}
      </main>

      {/* Floating QR Corner Widget for instant participant onboarding */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:flex flex-col items-center p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md group hover:border-blue-500 transition-all">
        <button
          onClick={() => setIsQRModalOpen(true)}
          className="flex flex-col items-center text-center cursor-pointer"
        >
          <div className="p-1.5 bg-white rounded-xl shadow-md mb-2">
            <QRCodeSVG value={joinUrl} size={88} level="M" />
          </div>
          <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1 group-hover:underline">
            <Smartphone className="w-3 h-3" />
            <span>스마트폰 참여</span>
          </span>
          <span className="text-[9px] text-slate-400">클릭하여 확대</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="mt-2 w-full py-1 text-[10px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          {copiedLink ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : null}
          <span>{copiedLink ? '복사됨' : '링크 복사'}</span>
        </button>
      </div>

      {/* QR Code Big Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        joinUrl={joinUrl}
      />

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        isLoading={isAILoading}
        data={aiAnalysis}
        error={aiError}
        onRetry={handleRequestAIAnalysis}
      />
    </div>
  );
};
