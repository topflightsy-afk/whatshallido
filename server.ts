import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Data structures
export interface ResponseItem {
  id: string;
  text: string;
  category: string;
  note?: string;
  likes: number;
  createdAt: number;
  clientIpHash?: string;
}

export interface SessionState {
  title: string;
  subTitle: string;
  isOpen: boolean;
  totalParticipants: number;
}

// Ensure data directory
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'responses.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state with disk persistence
let session: SessionState = {
  title: '팀장님께서 지시한 업무! 나는 무엇부터 할 것인가?',
  subTitle: '지시받은 즉시 나의 첫 번째 행동을 솔직하게 남겨주세요.',
  isOpen: true,
  totalParticipants: 0,
};

let responses: ResponseItem[] = [];

// Load persisted data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.responses)) {
      responses = parsed.responses;
    }
    if (parsed.session) {
      session = { ...session, ...parsed.session };
    }
  }
} catch (err) {
  console.warn('Failed to load responses from disk, using fresh state', err);
}

function persistData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ session, responses }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Error saving data to disk:', err);
  }
}

// SSE Clients for real-time live push
type SSEClient = {
  id: number;
  res: Response;
};
let sseClients: SSEClient[] = [];
let nextClientId = 1;

function broadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client dropped
    }
  });
}

// Keyword categorization helper for Korean business context
export function autoCategorize(text: string): string {
  const t = text.toLowerCase().replace(/\s+/g, '');
  if (/마감|기한|일정|스케줄|언제|납기|데드라인|timeline|due/.test(t)) {
    return '마감일 및 일정 확인';
  }
  if (/목표|의도|배경|의중|왜|목적|방향|취지|이유|핵심|결과물|와이|why/.test(t)) {
    return '업무 목적 및 기대결과 확인';
  }
  if (/질문|재확인|물어|여쭤|물어보|확인|소통|피드백|싱크/.test(t)) {
    return '추가 질문 및 지시 재확인';
  }
  if (/메모|기록|정리|노트|받아적|적어|정리하|요약/.test(t)) {
    return '메모 및 요구사항 정리';
  }
  if (/자료|레퍼런스|양식|기존|과거|검색|조사|벤치마킹|사례/.test(t)) {
    return '기존 자료 및 레퍼런스 탐색';
  }
  if (/쪼개|분해|to-do|todo|우선순위|계획|단계|절차|할일|순서/.test(t)) {
    return '일정 계획 및 To-Do 분해';
  }
  if (/동료|선배|팀원|협업|부서|물어봐|도움|공유/.test(t)) {
    return '동료/선배 조언 및 협업 조율';
  }
  if (/심호흡|커피|화장실|멘탈|한숨|당황|차분|멘붕/.test(t)) {
    return '마음가짐 & 멘탈 정돈';
  }
  return '기타 실행 방안';
}

// SSE endpoint
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = nextClientId++;
  sseClients.push({ id: clientId, res });

  // Send initial full snapshot
  const initialData = {
    session,
    responses,
  };
  res.write(`event: init\ndata: ${JSON.stringify(initialData)}\n\n`);

  // Heartbeat interval to prevent socket timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// REST: Get all responses & session status
app.get('/api/responses', (_req: Request, res: Response) => {
  res.json({
    session,
    responses,
  });
});

// REST: Submit a response (Learner)
app.post('/api/responses', (req: Request, res: Response) => {
  if (!session.isOpen) {
    return res.status(403).json({ error: '현재 답변 접수가 마감되었습니다.' });
  }

  const { text, note, category } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '답변 내용을 입력해주세요.' });
  }

  const trimmedText = text.trim().slice(0, 100);
  const detectedCategory = category || autoCategorize(trimmedText);

  // Check if identical exact phrase already exists to group or create item
  const existingIndex = responses.findIndex(
    (r) => r.text.toLowerCase().trim() === trimmedText.toLowerCase().trim()
  );

  let newItem: ResponseItem;

  if (existingIndex !== -1) {
    // If exact same phrase, increase like/weight count
    responses[existingIndex].likes += 1;
    if (note && !responses[existingIndex].note) {
      responses[existingIndex].note = note.trim().slice(0, 200);
    }
    newItem = responses[existingIndex];
  } else {
    newItem = {
      id: 'resp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: trimmedText,
      category: detectedCategory,
      note: note ? String(note).trim().slice(0, 200) : undefined,
      likes: 1,
      createdAt: Date.now(),
    };
    responses.unshift(newItem);
  }

  session.totalParticipants += 1;
  persistData();

  broadcast('response:added', {
    item: newItem,
    totalCount: responses.length,
    session,
  });

  res.status(201).json({ success: true, item: newItem });
});

// REST: Like / Empathy button (+1)
app.post('/api/responses/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = responses.find((r) => r.id === id);
  if (!item) {
    return res.status(404).json({ error: '해당 답변을 찾을 수 없습니다.' });
  }

  item.likes += 1;
  persistData();

  broadcast('response:liked', {
    id: item.id,
    likes: item.likes,
  });

  res.json({ success: true, likes: item.likes });
});

// REST: Update Session settings (Host)
app.post('/api/session', (req: Request, res: Response) => {
  const { isOpen, title, subTitle } = req.body;
  if (typeof isOpen === 'boolean') session.isOpen = isOpen;
  if (typeof title === 'string' && title.trim()) session.title = title.trim();
  if (typeof subTitle === 'string') session.subTitle = subTitle.trim();

  persistData();
  broadcast('session:updated', session);
  res.json({ success: true, session });
});

// REST: Reset all responses (Host)
app.post('/api/reset', (_req: Request, res: Response) => {
  responses = [];
  session.totalParticipants = 0;
  persistData();
  broadcast('session:reset', { session, responses });
  res.json({ success: true, message: '모든 응답이 초기화되었습니다.' });
});

// REST: Seed realistic sample data for lecture demonstration
app.post('/api/seed', (_req: Request, res: Response) => {
  const sampleItems: Array<{ text: string; note: string; likes: number }> = [
    { text: '마감 기한(언제까지)과 우선순위 재확인', note: '급한 건지 중요한 건지 명확히 파악', likes: 18 },
    { text: '지시 내용 메모 및 내 말로 다시 요약해 확인', note: '"팀장님 말씀하신 게 이것 맞을까요?" 더블체크', likes: 14 },
    { text: '업무의 핵심 목표와 기대하는 결과물 형태 질문', note: '보고서인지 엑셀인지 슬라이드인지 확인', likes: 12 },
    { text: '과거 유사 보고서 및 사내 레퍼런스 양식 탐색', note: '사내 드라이브에서 이전 프로젝트 산출물 찾기', likes: 10 },
    { text: '전체 과정을 단계별 To-Do로 쪼개고 소요시간 계산', note: 'WBS처럼 1단계, 2단계 업무 분해', likes: 9 },
    { text: '팀장님의 의중과 배경(Why) 질문하기', note: '왜 이 업무가 갑자기 나왔는지 맥락 파악', likes: 8 },
    { text: '마감일 역산하여 중간 공유(중간보고) 일정 잡기', note: '초안 30% 시점에 피드백 받기 위한 일정 등록', likes: 7 },
    { text: '유관 부서 및 협업할 동료에게 사전 현황 공유', note: '타 부서 데이터 협조가 필요한지 확인', likes: 6 },
    { text: '일단 심호흡하고 커피 한 잔 마시며 마인드 컨트롤', note: '당황하지 않고 차분하게 생각 정리하기', likes: 5 },
    { text: '선배 사원에게 과거 유사 케이스 조언 구하기', note: '사수한테 팁 물어보기', likes: 5 },
    { text: '필요한 리소스와 권한(예산, 툴 접근) 요청', note: '작업에 필요한 계정 권한 확인', likes: 4 },
    { text: '현재 진행 중인 다른 업무들과의 일정 충돌 체크', note: '팀장님께 기존 업무 납기 조정 필요성 건의', likes: 6 },
    { text: '1장짜리 개요(Draft) 빠르게 만들어 방향성 컨펌', note: '삽질 방지용 퀵 스케치', likes: 8 },
  ];

  responses = sampleItems.map((s, idx) => ({
    id: 'seed_' + (Date.now() - idx * 1000),
    text: s.text,
    category: autoCategorize(s.text),
    note: s.note,
    likes: s.likes,
    createdAt: Date.now() - idx * 1000,
  }));

  session.totalParticipants = sampleItems.reduce((acc, cur) => acc + cur.likes, 0);
  persistData();

  broadcast('session:reset', { session, responses });
  res.json({ success: true, count: responses.length });
});

// REST: AI synthesis & executive cluster analysis via Gemini API
app.post('/api/ai-cluster', async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    if (responses.length === 0) {
      return res.status(400).json({ error: '분석할 응답 데이터가 없습니다.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const responsesSummary = responses
      .map((r) => `- [${r.category}] "${r.text}" (공감수: ${r.likes}${r.note ? `, 메모: ${r.note}` : ''})`)
      .join('\n');

    const prompt = `
당신은 비즈니스 리더십 및 신입/경력 사원 업무 소통 전문가입니다.
강의 주제: "팀장님께서 지시한 업무! 나는 무엇부터 할 것인가?"
학습자들의 실시간 익명 답변 데이터는 다음과 같습니다:

${responsesSummary}

위 학습자 답변들을 심층 분석하여 다음 JSON 형식으로만 반환해주세요. (마크다운 백틱 없이 순수 JSON)
{
  "topInsight": "전체 답변에서 도출된 핵심 관통 인사이트 (2~3문장)",
  "clusters": [
    {
      "name": "클러스터 대표 명칭 (예: 1. 방향성 & 마감 더블체크형)",
      "percentage": 42,
      "description": "이 그룹의 생각과 심리적 특성 설명",
      "recommendedAdvice": "강사가 학습자들에게 전해줄 전문가 피드백/조언 팁",
      "samplePhrases": ["대표 문구 1", "대표 문구 2"]
    }
  ],
  "lecturerKeyTakeaway": "강의 진행자를 위한 마무리 총평 가이드"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Gemini AI clustering error:', error);
    res.status(500).json({ error: error.message || 'AI 클러스터링 분석 중 오류가 발생했습니다.' });
  }
});

// Production or Vite Dev integration
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Export app for Vercel serverless deployment
export default app;

if (!process.env.VERCEL) {
  startServer();
}
