const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export interface Learner {
  id: string;
  displayName: string;
  preferredLanguage: string;
  currentLevel: string;
  learningGoal: string;
  minutesPerDay: number;
}

export interface Roadmap {
  id: string;
  learnerId: string;
  title: string;
  skill: string;
  currentLevel: string;
  goal: string;
  version: number;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  roadmapId: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  order: number;
  durationMinutes: number;
  learningObjectives: string[];
  content: string;
  examples: string[];
  keyTakeaways: string[];
  completed?: boolean;
}

export interface IndustryEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  summary: string;
  canonicalUrl: string;
  publishedAt: string;
  detectedAt: string;
  changeType?: string;
  importance?: string;
  confidence?: number;
  skills?: Array<{ skill: { name: string; slug: string } }>;
}

export interface RoadmapUpdate {
  id: string;
  roadmapId: string;
  industryEventId: string;
  proposedChanges: any[];
  rationale: string;
  evidenceReferences: string[];
  impactScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  approvalStatus: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'FAILED';
  createdAt: string;
  reviewedAt?: string;
  appliedAt?: string;
  industryEvent?: IndustryEvent;
}

export interface RoadmapVersion {
  id: string;
  roadmapId: string;
  versionNumber: number;
  changeSummary: string;
  changeReason: string;
  publishedAt: string;
  triggeringEvent?: IndustryEvent;
  snapshot: any;
}

export interface NotificationItem {
  id: string;
  learnerId: string;
  roadmapUpdateId?: string;
  title: string;
  message: string;
  reason: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ResourceRecommendation {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  provider: string;
  durationSeconds?: number;
  channelTitle?: string;
  relevanceScore: number;
}

export interface MonitoringStatus {
  totalSources: number;
  activeSources: number;
  totalEvents: number;
  pendingAnalysisCount: number;
  analyzedEventsCount: number;
  lastScanAt: string | null;
  sources: Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    lastSuccessfulCheck: string | null;
    errorState: string | null;
  }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    const errorMsg = data?.error?.message || data?.message || `HTTP error ${res.status}`;
    throw new Error(errorMsg);
  }

  return data.data;
}

export const api = {
  // Learners
  createLearner: (body: Partial<Learner>) =>
    request<Learner>('/learners', { method: 'POST', body: JSON.stringify(body) }),
  getLearner: (id: string) => request<Learner>(`/learners/${id}`),

  // Roadmaps
  createRoadmap: (learnerId: string, skill: string) =>
    request<Roadmap>('/roadmaps', { method: 'POST', body: JSON.stringify({ learnerId, skill }) }),
  getRoadmap: (id: string) => request<Roadmap>(`/roadmaps/${id}`),
  getRoadmapLessons: (roadmapId: string, learnerId?: string) =>
    request<Lesson[]>(`/roadmaps/${roadmapId}/lessons${learnerId ? `?learnerId=${learnerId}` : ''}`),

  // Adaptation & Versions
  getRoadmapUpdates: (roadmapId: string) =>
    request<RoadmapUpdate[]>(`/roadmaps/${roadmapId}/updates`),
  adaptRoadmap: (roadmapId: string) =>
    request<{ newProposalsCount: number; updates: RoadmapUpdate[] }>(`/roadmaps/${roadmapId}/adapt`, {
      method: 'POST',
    }),
  approveUpdate: (roadmapId: string, updateId: string) =>
    request<{ version: RoadmapVersion; update: RoadmapUpdate }>(
      `/roadmaps/${roadmapId}/updates/${updateId}/approve`,
      { method: 'POST' }
    ),
  rejectUpdate: (roadmapId: string, updateId: string, reason?: string) =>
    request<RoadmapUpdate>(`/roadmaps/${roadmapId}/updates/${updateId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getRoadmapVersions: (roadmapId: string) =>
    request<RoadmapVersion[]>(`/roadmaps/${roadmapId}/versions`),
  getRoadmapVersion: (roadmapId: string, versionId: string) =>
    request<RoadmapVersion>(`/roadmaps/${roadmapId}/versions/${versionId}`),

  // Industry Intelligence
  getIndustrySources: () => request<any[]>('/industry/sources'),
  getIndustryEvents: (skillSlug?: string) =>
    request<IndustryEvent[]>(`/industry/events${skillSlug ? `?skill=${skillSlug}` : ''}`),
  getIndustryStatus: () => request<MonitoringStatus>('/industry/status'),
  triggerScan: () =>
    request<{ results: any[]; totalNewEvents: number }>('/industry/scan', { method: 'POST' }),

  // Notifications
  getNotifications: (learnerId: string) =>
    request<NotificationItem[]>(`/learners/${learnerId}/notifications`),
  markNotificationRead: (learnerId: string, notificationId: string) =>
    request<NotificationItem>(`/learners/${learnerId}/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),

  // Recommendations
  getLessonRecommendations: (lessonId: string) =>
    request<ResourceRecommendation[]>(`/lessons/${lessonId}/recommendations`),

  // Lesson Completion
  completeLesson: (lessonId: string, learnerId: string) =>
    request<any>(`/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ learnerId }),
    }),
};
