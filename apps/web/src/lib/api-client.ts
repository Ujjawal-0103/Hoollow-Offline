import {
  ApiResponse,
  User,
  LearnerProfile,
  Roadmap,
  Lesson,
  DailyPlanResponse,
  SafeQuiz,
  QuizSubmissionResult,
  LearnerAttemptItem,
  LearnerQuizPerformance,
  LearnerProgressSummary,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Pre-seeded mock learner data for offline development
export const MOCK_USER: User = {
  id: 'learner-1',
  name: 'Alex Mercer',
  email: 'alex@upwise.learn',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  level: 'Beginner',
  xp: 450,
  streak: 3,
  learningGoal: 'Full-Stack Web Development with React & Node',
  currentSkill: 'Full-Stack Web Development',
  joinedAt: '2026-03-01T00:00:00.000Z',
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(): Promise<{ status: string; online: boolean; details?: unknown }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return { status: 'online', online: true, details: data };
      }
    } catch {
      // Server not reachable
    }
    return { status: 'mock-offline', online: false };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('upwise_token') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          error: json.error || {
            code: `HTTP_${res.status}`,
            message: json.message || 'Request failed',
          },
        };
      }

      return json as ApiResponse<T>;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to connect to server. Running in offline mode.';
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message,
        },
      };
    }
  }

  // --- Authentication Endpoints ---

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      return res;
    }

    // If server responded with a real validation/auth error, return it directly
    if (res.error && res.error.code !== 'NETWORK_ERROR') {
      return res;
    }

    // Fallback: only if network is completely unreachable, allow offline mock account
    if (email.trim().toLowerCase() === MOCK_USER.email && password === 'password123') {
      return {
        success: true,
        data: {
          user: MOCK_USER,
          token: `mock-jwt-token-${Date.now()}`,
        },
      };
    }

    return {
      success: false,
      error: res.error || {
        code: 'NETWORK_ERROR',
        message: 'Backend server is not reachable.',
      },
    };
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const res = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (res.success && res.data) {
      return res;
    }

    // If server responded with real error (e.g. user exists or validation failure), return it
    if (res.error && res.error.code !== 'NETWORK_ERROR') {
      return res;
    }

    // Offline fallback if network is unreachable
    const newUser: User = {
      id: `learner-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      level: 'Beginner',
      currentSkill: 'Full-Stack Web Development',
      xp: 100,
      streak: 1,
      learningGoal: 'Full-Stack Web Development with React & Node',
      joinedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        user: newUser,
        token: `mock-jwt-token-${Date.now()}`,
      },
    };
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const res = await this.request<User>('/auth/me', { method: 'GET' });
    if (res.success && res.data) {
      return res;
    }

    return {
      success: true,
      data: MOCK_USER,
    };
  }

  // --- Learner Profile & Preference Endpoints (/api/learners) ---

  async createLearnerProfile(data: {
    id?: string;
    displayName?: string;
    preferredLanguage?: string;
    currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    learningGoal: string;
    minutesPerDay?: number;
  }): Promise<ApiResponse<LearnerProfile>> {
    return this.request<LearnerProfile>('/learners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLearnerProfile(id: string): Promise<ApiResponse<LearnerProfile>> {
    return this.request<LearnerProfile>(`/learners/${id}`, { method: 'GET' });
  }

  async updateLearnerPreferences(
    id: string,
    preferences: {
      displayName?: string;
      preferredLanguage?: string;
      currentLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      learningGoal?: string;
      minutesPerDay?: number;
    }
  ): Promise<ApiResponse<LearnerProfile>> {
    return this.request<LearnerProfile>(`/learners/${id}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  async getLearnerProgress(id: string): Promise<ApiResponse<LearnerProgressSummary>> {
    return this.request<LearnerProgressSummary>(`/learners/${id}/progress`, { method: 'GET' });
  }

  async getDailyPlan(id: string): Promise<ApiResponse<DailyPlanResponse>> {
    return this.request<DailyPlanResponse>(`/learners/${id}/daily-plan`, { method: 'GET' });
  }

  async getLearnerRoadmaps(id: string): Promise<ApiResponse<Roadmap[]>> {
    return this.request<Roadmap[]>(`/learners/${id}/roadmaps`, { method: 'GET' });
  }

  async getLearnerQuizAttempts(id: string): Promise<ApiResponse<LearnerAttemptItem[]>> {
    return this.request<LearnerAttemptItem[]>(`/learners/${id}/quiz-attempts`, { method: 'GET' });
  }

  async getLearnerQuizPerformance(id: string): Promise<ApiResponse<LearnerQuizPerformance>> {
    return this.request<LearnerQuizPerformance>(`/learners/${id}/quiz-performance`, { method: 'GET' });
  }

  // --- Roadmap Endpoints (/api/roadmaps) ---

  async createRoadmap(data: {
    learnerId: string;
    skill: string;
    currentLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    goal?: string;
    minutesPerDay?: number;
    preferredLanguage?: string;
  }): Promise<ApiResponse<Roadmap>> {
    return this.request<Roadmap>('/roadmaps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRoadmap(roadmapId: string): Promise<ApiResponse<Roadmap>> {
    return this.request<Roadmap>(`/roadmaps/${roadmapId}`, { method: 'GET' });
  }

  async getRoadmapLessons(roadmapId: string): Promise<ApiResponse<Lesson[]>> {
    return this.request<Lesson[]>(`/roadmaps/${roadmapId}/lessons`, { method: 'GET' });
  }

  // --- Lesson Endpoints (/api/lessons) ---

  async getLesson(lessonId: string): Promise<ApiResponse<Lesson>> {
    return this.request<Lesson>(`/lessons/${lessonId}`, { method: 'GET' });
  }

  async completeLesson(lessonId: string, learnerId: string): Promise<ApiResponse<{ completed: boolean; message: string }>> {
    return this.request<{ completed: boolean; message: string }>(`/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ learnerId }),
    });
  }

  async getLessonQuizzes(lessonId: string): Promise<ApiResponse<SafeQuiz[]>> {
    return this.request<SafeQuiz[]>(`/lessons/${lessonId}/quiz`, { method: 'GET' });
  }

  // --- Quiz Endpoints (/api/quizzes) ---

  async getQuiz(quizId: string): Promise<ApiResponse<SafeQuiz>> {
    return this.request<SafeQuiz>(`/quizzes/${quizId}`, { method: 'GET' });
  }

  async submitQuiz(
    quizId: string,
    data: {
      learnerId: string;
      responses: Array<{ questionId: string; selectedAnswer: string }>;
    }
  ): Promise<ApiResponse<QuizSubmissionResult>> {
    return this.request<QuizSubmissionResult>(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
