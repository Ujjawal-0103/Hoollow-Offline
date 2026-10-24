export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  streak: number;
  learningGoal?: string;
  currentSkill?: string;
  joinedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  description?: string;
}

export interface LearnerProfile {
  id: string;
  displayName: string | null;
  preferredLanguage: string;
  currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  learningGoal: string;
  minutesPerDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  order: number;
  durationMinutes: number;
  learningObjectives?: string[];
  content?: string;
  examples?: string[];
  keyTakeaways?: string[];
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  order: number;
  estimatedDurationMinutes: number;
  lessons: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Roadmap {
  id: string;
  learnerId: string;
  title: string;
  skill: string;
  currentLevel: string;
  goal: string;
  estimatedDurationMinutes: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlanTask {
  lessonId: string;
  title: string;
  durationMinutes: number;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  milestoneId: string;
  milestoneTitle: string;
  roadmapId: string;
  roadmapTitle: string;
}

export interface DailyPlanResponse {
  learnerId: string;
  date: string;
  availableMinutes: number;
  plannedMinutes: number;
  tasks: DailyPlanTask[];
  nextLessonId: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NO_ROADMAPS';
}

export interface SafeQuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  order: number;
}

export interface SafeQuiz {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  questions: SafeQuizQuestion[];
}

export interface QuestionReviewResult {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmissionResult {
  attemptId: string;
  quizId: string;
  learnerId: string;
  score: number;
  percentageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  results: QuestionReviewResult[];
  review: QuestionReviewResult[];
}

export interface LearnerAttemptItem {
  id: string;
  quizId: string;
  quizTitle: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
}

export interface QuizBestScore {
  quizId: string;
  quizTitle: string;
  bestScore: number;
  latestScore: number;
  attemptsCount: number;
}

export interface LearnerQuizPerformance {
  learnerId: string;
  totalAttempts: number;
  uniqueQuizzesAttempted: number;
  averageScore: number;
  averagePercentageScore: number;
  latestAttempt: LearnerAttemptItem | null;
  quizScores: QuizBestScore[];
}

export interface RoadmapProgressSummary {
  roadmapId: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface LearnerProgressSummary {
  learnerId: string;
  totalRoadmaps: number;
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  progressPercent: number;
  roadmaps: RoadmapProgressSummary[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  unlockedAt?: string;
  iconName: 'sparkles' | 'flame' | 'award' | 'trophy' | 'target' | 'bookOpen';
}
