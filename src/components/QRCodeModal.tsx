import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Smartphone, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinUrl: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, joinUrl }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="닫기"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>학습자 실시간 모바일 참여</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            스마트폰으로 QR코드를 스캔하세요
          </h2>
          <p className="text-slate-400 text-sm">
            별도의 앱 설치나 로그인 없이, 카메라로 비추면 바로 답변할 수 있습니다.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl shadow-xl ring-8 ring-blue-500/10">
            <QRCodeSVG
              value={joinUrl}
              size={240}
              level="H"
              includeMargin={false}
              className="rounded"
            />
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>이름 입력 없이 익명으로 안전하게 제출됩니다</span>
          </p>
        </div>

        {/* Join URL Box & Copy */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-6">
          <div className="text-xs text-slate-400 mb-1 font-medium">직접 접속 링크:</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="bg-transparent text-sm text-slate-200 w-full outline-none font-mono select-all truncate"
            />
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>링크 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>강의 중 언제든지 스캔 가능합니다</span>
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 underline underline-offset-4"
          >
            새 탭에서 학습자 화면 열기
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
