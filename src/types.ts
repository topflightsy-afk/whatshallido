export interface ResponseItem {
  id: string;
  text: string;
  category: string;
  note?: string;
  likes: number;
  createdAt: number;
}

export interface SessionState {
  title: string;
  subTitle: string;
  isOpen: boolean;
  totalParticipants: number;
}

export interface ClusteredGroup {
  id: string;
  category: string;
  title: string;
  totalScore: number; // likes sum + count
  itemsCount: number;
  items: ResponseItem[];
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    glow: string;
    badge: string;
  };
}

export interface AIAnalysisResult {
  topInsight: string;
  clusters: Array<{
    name: string;
    percentage: number;
    description: string;
    recommendedAdvice: string;
    samplePhrases: string[];
  }>;
  lecturerKeyTakeaway: string;
}
