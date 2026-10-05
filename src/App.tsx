/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { ResponseItem, SessionState } from './types';
import { clusterResponses } from './utils/grouping';
import { PresenterScreen } from './components/PresenterScreen';
import { LearnerScreen } from './components/LearnerScreen';
import { Monitor, Smartphone } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold mb-2">화면을 불러오는 중 오류가 발생했습니다</h2>
          <p className="text-xs text-slate-400 mb-5 max-w-xs">{this.state.error?.message || '새로고침을 눌러 다시 접속해 주세요.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            페이지 새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<'presenter' | 'learner'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'learner' || window.location.hash.includes('learner')) {
        return 'learner';
      }
    }
    return 'presenter';
  });

  const [session, setSession] = useState<SessionState>({
    title: '팀장님께서 지시한 업무! 나는 무엇부터 할 것인가?',
    subTitle: '지시받은 즉시 나의 첫 번째 행동을 솔직하게 남겨주세요.',
    isOpen: true,
    totalParticipants: 0,
  });

  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Compute absolute join URL for learners to scan
  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/?view=learner`;
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.session) setSession(data.session);
            if (Array.isArray(data.responses)) setResponses(data.responses);
          } catch (err) {
            console.error('Failed to parse init event', err);
          }
        });

        eventSource.addEventListener('response:added', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.item) {
              setResponses((prev) => {
                const idx = prev.findIndex((r) => r.id === data.item.id);
                if (idx !== -1) {
                  const updated = [...prev];
                  updated[idx] = data.item;
                  return updated;
                }
                return [data.item, ...prev];
              });
            }
            if (data.session) {
              setSession(data.session);
            }
          } catch (err) {
            console.error('Failed to parse response:added event', err);
          }
        });

        eventSource.addEventListener('response:liked', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.id && typeof data.likes === 'number') {
              setResponses((prev) =>
                prev.map((r) => (r.id === data.id ? { ...r, likes: data.likes } : r))
              );
            }
          } catch (err) {
            console.error('Failed to parse response:liked event', err);
          }
        });

        eventSource.addEventListener('session:updated', (e: MessageEvent) => {
          try {
            const newSession = JSON.parse(e.data);
            setSession(newSession);
          } catch (err) {
            console.error('Failed to parse session:updated event', err);
          }
        });

        eventSource.addEventListener('session:reset', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.session) setSession(data.session);
            if (Array.isArray(data.responses)) setResponses(data.responses);
          } catch (err) {
            console.error('Failed to parse session:reset event', err);
          }
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Reconnect with backoff
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        console.error('SSE connection failed', err);
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 3000);
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Clustered groups
  const groups = useMemo(() => clusterResponses(responses), [responses]);

  // Handle learner submit
  const handleSubmitResponse = useCallback(
    async (text: string, note?: string) => {
      try {
        const res = await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, note }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || '답변 등록에 실패했습니다.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Submit response error:', err);
        alert('서버 연결 중 문제가 발생했습니다.');
        return false;
      }
    },
    []
  );

  // Handle like / empathy
  const handleLike = useCallback(async (id: string) => {
    // Optimistic UI update
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r))
    );

    try {
      await fetch(`/api/responses/${id}/like`, { method: 'POST' });
    } catch (err) {
      console.error('Like error:', err);
    }
  }, []);

  // Handle reset
  const handleReset = useCallback(async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (err) {
      console.error('Reset error:', err);
    }
  }, []);

  // Handle sample seed
  const handleSeed = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (err) {
      console.error('Seed error:', err);
    }
  }, []);

  // Handle status toggle (open / closed)
  const handleToggleStatus = useCallback(async () => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !session.isOpen }),
      });
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  }, [session.isOpen]);

  const switchView = (view: 'presenter' | 'learner') => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'learner') {
      url.searchParams.set('view', 'learner');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        {/* View Switcher Floating Badge (Presenter <-> Learner) */}
        <aside aria-label="화면 전환" className="fixed top-3 right-3 z-50 flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs">
          <button
            onClick={() => switchView('presenter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
              currentView === 'presenter'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>강사용 화면</span>
          </button>
          <button
            onClick={() => switchView('learner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
              currentView === 'learner'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>학습자 화면</span>
          </button>
        </aside>

        {/* Active Screen */}
        {currentView === 'presenter' ? (
          <PresenterScreen
            session={session}
            responses={responses}
            groups={groups}
            joinUrl={joinUrl}
            onLike={handleLike}
            onReset={handleReset}
            onSeed={handleSeed}
            onToggleStatus={handleToggleStatus}
            isConnected={isConnected}
          />
        ) : (
          <LearnerScreen
            session={session}
            responses={responses}
            onSubmit={handleSubmitResponse}
            onLike={handleLike}
            onSwitchToPresenter={() => switchView('presenter')}
            isConnected={isConnected}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
