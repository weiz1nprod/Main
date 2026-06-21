export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  nextReviewDate: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  materialId?: string;
  userId?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  materialId: string;
  userId: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: number;
}

export interface MindMapData {
  nodes: { id: string; label: string }[];
  edges: { id: string; source: string; target: string; label?: string }[];
}

export interface Material {
  id: string;
  title: string;
  sourceType: 'drive';
  driveFileId?: string;
  createdAt: number;
  userId: string;
  mindmap?: MindMapData;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  comments: {
    authorId: string;
    authorName: string;
    content: string;
    createdAt: number;
  }[];
}
