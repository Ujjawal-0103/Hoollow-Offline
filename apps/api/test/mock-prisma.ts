import {
  Learner,
  Milestone,
  Lesson,
  Roadmap,
  LessonProgress,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizResponse,
  IndustrySource,
  IndustryEvent,
  Skill,
  IndustryEventSkill,
  LessonSkill,
  RoadmapVersion,
  RoadmapUpdate,
  Notification,
  ResourceRecommendation,
} from '@prisma/client';
import { randomUUID } from 'crypto';

export interface MockPrismaStore {
  learners: Map<string, Learner>;
  roadmaps: Map<string, Roadmap>;
  milestones: Map<string, Milestone>;
  lessons: Map<string, Lesson>;
  lessonProgress: Map<string, LessonProgress>;
  quizzes: Map<string, Quiz>;
  quizQuestions: Map<string, QuizQuestion>;
  quizAttempts: Map<string, QuizAttempt>;
  quizResponses: Map<string, QuizResponse>;
  industrySources: Map<string, IndustrySource>;
  industryEvents: Map<string, IndustryEvent>;
  skills: Map<string, Skill>;
  industryEventSkills: Map<string, IndustryEventSkill>;
  lessonSkills: Map<string, LessonSkill>;
  roadmapVersions: Map<string, RoadmapVersion>;
  roadmapUpdates: Map<string, RoadmapUpdate>;
  notifications: Map<string, Notification>;
  resourceRecommendations: Map<string, ResourceRecommendation>;
}

export function createMockPrismaClient() {
  const store: MockPrismaStore = {
    learners: new Map<string, Learner>(),
    roadmaps: new Map<string, Roadmap>(),
    milestones: new Map<string, Milestone>(),
    lessons: new Map<string, Lesson>(),
    lessonProgress: new Map<string, LessonProgress>(),
    quizzes: new Map<string, Quiz>(),
    quizQuestions: new Map<string, QuizQuestion>(),
    quizAttempts: new Map<string, QuizAttempt>(),
    quizResponses: new Map<string, QuizResponse>(),
    industrySources: new Map<string, IndustrySource>(),
    industryEvents: new Map<string, IndustryEvent>(),
    skills: new Map<string, Skill>(),
    industryEventSkills: new Map<string, IndustryEventSkill>(),
    lessonSkills: new Map<string, LessonSkill>(),
    roadmapVersions: new Map<string, RoadmapVersion>(),
    roadmapUpdates: new Map<string, RoadmapUpdate>(),
    notifications: new Map<string, Notification>(),
    resourceRecommendations: new Map<string, ResourceRecommendation>(),
  };

  const client: any = {
    learner: {
      create: async ({ data }: { data: any }): Promise<Learner> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const learner: Learner = {
          id,
          displayName: data.displayName || null,
          preferredLanguage: data.preferredLanguage || 'English',
          currentLevel: data.currentLevel || 'BEGINNER',
          learningGoal: data.learningGoal || '',
          minutesPerDay: data.minutesPerDay || 30,
          createdAt: now,
          updatedAt: now,
        };
        store.learners.set(id, learner);
        return learner;
      },
      findUnique: async ({ where }: { where: { id: string } }): Promise<Learner | null> => {
        return store.learners.get(where.id) || null;
      },
      findMany: async (): Promise<Learner[]> => {
        return Array.from(store.learners.values());
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<Learner> => {
        const existing = store.learners.get(where.id);
        if (!existing) {
          throw new Error('Learner not found to update.');
        }
        const updated: Learner = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.learners.set(where.id, updated);
        return updated;
      },
    },
    roadmap: {
      create: async ({ data }: { data: any }): Promise<any> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const roadmap: Roadmap = {
          id,
          learnerId: data.learnerId,
          title: data.title,
          skill: data.skill,
          currentLevel: data.currentLevel,
          goal: data.goal,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          version: data.version || 1,
          createdAt: now,
          updatedAt: now,
        };
        store.roadmaps.set(id, roadmap);

        const createdMilestones: any[] = [];
        if (data.milestones?.create) {
          for (const mData of data.milestones.create) {
            const mId = randomUUID();
            const milestone: Milestone = {
              id: mId,
              roadmapId: id,
              title: mData.title,
              description: mData.description ?? null,
              order: mData.order,
              estimatedDurationMinutes: mData.estimatedDurationMinutes,
              createdAt: now,
              updatedAt: now,
            };
            store.milestones.set(mId, milestone);

            const createdLessons: any[] = [];
            if (mData.lessons?.create) {
              for (const lData of mData.lessons.create) {
                const lId = randomUUID();
                const lesson: Lesson = {
                  id: lId,
                  milestoneId: mId,
                  title: lData.title,
                  description: lData.description ?? null,
                  order: lData.order,
                  durationMinutes: lData.durationMinutes,
                  learningObjectives: lData.learningObjectives || [],
                  content: lData.content,
                  examples: lData.examples || [],
                  keyTakeaways: lData.keyTakeaways || [],
                  createdAt: now,
                  updatedAt: now,
                };
                store.lessons.set(lId, lesson);
                createdLessons.push(lesson);
              }
            }
            createdMilestones.push({
              ...milestone,
              lessons: createdLessons.sort((a, b) => a.order - b.order),
            });
          }
        }

        return {
          ...roadmap,
          milestones: createdMilestones.sort((a, b) => a.order - b.order),
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<Roadmap> => {
        const existing = store.roadmaps.get(where.id);
        if (!existing) {
          throw new Error('Roadmap not found to update.');
        }
        const updated: Roadmap = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.roadmaps.set(where.id, updated);
        return updated;
      },
      findUnique: async ({ where, include }: { where: { id: string }; include?: any }): Promise<any> => {
        const roadmap = store.roadmaps.get(where.id);
        if (!roadmap) return null;

        if (include?.milestones) {
          const roadmapMilestones = Array.from(store.milestones.values())
            .filter((m) => m.roadmapId === roadmap.id)
            .sort((a, b) => a.order - b.order)
            .map((m) => {
              const milestoneLessons = Array.from(store.lessons.values())
                .filter((l) => l.milestoneId === m.id)
                .sort((a, b) => a.order - b.order);
              return {
                ...m,
                lessons: milestoneLessons,
              };
            });

          return {
            ...roadmap,
            milestones: roadmapMilestones,
          };
        }

        return roadmap;
      },
      findMany: async (args?: any): Promise<any[]> => {
        let userRoadmaps = Array.from(store.roadmaps.values());

        if (args?.where?.learnerId) {
          userRoadmaps = userRoadmaps.filter((r) => r.learnerId === args.where.learnerId);
        }

        return userRoadmaps.map((roadmap) => {
          if (args?.include?.milestones) {
            const roadmapMilestones = Array.from(store.milestones.values())
              .filter((m) => m.roadmapId === roadmap.id)
              .sort((a, b) => a.order - b.order)
              .map((m) => {
                const milestoneLessons = Array.from(store.lessons.values())
                  .filter((l) => l.milestoneId === m.id)
                  .sort((a, b) => a.order - b.order);
                return {
                  ...m,
                  lessons: milestoneLessons,
                };
              });

            return {
              ...roadmap,
              milestones: roadmapMilestones,
            };
          }
          return roadmap;
        });
      },
    },
    milestone: {
      findMany: async (): Promise<Milestone[]> => {
        return Array.from(store.milestones.values());
      },
    },
    lesson: {
      create: async ({ data }: { data: any }): Promise<Lesson> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const lesson: Lesson = {
          id,
          milestoneId: data.milestoneId,
          title: data.title,
          description: data.description ?? null,
          order: data.order,
          durationMinutes: data.durationMinutes,
          learningObjectives: data.learningObjectives || [],
          content: data.content,
          examples: data.examples || [],
          keyTakeaways: data.keyTakeaways || [],
          createdAt: now,
          updatedAt: now,
        };
        store.lessons.set(id, lesson);
        return lesson;
      },
      findUnique: async ({ where, include }: { where: { id: string }; include?: any }): Promise<any> => {
        const lesson = store.lessons.get(where.id);
        if (!lesson) return null;

        if (include?.milestone) {
          const milestone = store.milestones.get(lesson.milestoneId);
          if (!milestone) return lesson;

          let roadmap = null;
          if (include.milestone.include?.roadmap) {
            const r = store.roadmaps.get(milestone.roadmapId);
            if (r) {
              roadmap = {
                id: r.id,
                title: r.title,
                skill: r.skill,
              };
            }
          }

          return {
            ...lesson,
            milestone: {
              id: milestone.id,
              roadmapId: milestone.roadmapId,
              title: milestone.title,
              order: milestone.order,
              estimatedDurationMinutes: milestone.estimatedDurationMinutes,
              roadmap,
            },
          };
        }

        return lesson;
      },
      findMany: async (): Promise<Lesson[]> => {
        return Array.from(store.lessons.values());
      },
    },
    lessonProgress: {
      findUnique: async ({
        where,
      }: {
        where: { id?: string; learnerId_lessonId?: { learnerId: string; lessonId: string } };
      }): Promise<LessonProgress | null> => {
        if (where.id) {
          return store.lessonProgress.get(where.id) || null;
        }
        if (where.learnerId_lessonId) {
          const { learnerId, lessonId } = where.learnerId_lessonId;
          for (const progress of store.lessonProgress.values()) {
            if (progress.learnerId === learnerId && progress.lessonId === lessonId) {
              return progress;
            }
          }
        }
        return null;
      },
      findMany: async ({ where }: { where?: any }): Promise<LessonProgress[]> => {
        let results = Array.from(store.lessonProgress.values());
        if (!where) return results;

        if (where.learnerId) {
          results = results.filter((p) => p.learnerId === where.learnerId);
        }
        if (where.completed !== undefined) {
          results = results.filter((p) => p.completed === where.completed);
        }
        return results;
      },
      create: async ({ data }: { data: any }): Promise<LessonProgress> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const progress: LessonProgress = {
          id,
          learnerId: data.learnerId,
          lessonId: data.lessonId,
          completed: data.completed ?? true,
          completedAt: data.completedAt ?? now,
          createdAt: now,
          updatedAt: now,
        };
        store.lessonProgress.set(id, progress);
        return progress;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<LessonProgress> => {
        const existing = store.lessonProgress.get(where.id);
        if (!existing) {
          throw new Error('LessonProgress not found to update.');
        }
        const updated: LessonProgress = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.lessonProgress.set(where.id, updated);
        return updated;
      },
    },
    quiz: {
      create: async ({ data, include }: { data: any; include?: any }): Promise<any> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const quiz: Quiz = {
          id,
          lessonId: data.lessonId,
          title: data.title,
          description: data.description ?? null,
          createdAt: now,
          updatedAt: now,
        };
        store.quizzes.set(id, quiz);

        const createdQuestions: QuizQuestion[] = [];
        if (data.questions?.create) {
          for (const qData of data.questions.create) {
            const qId = randomUUID();
            const question: QuizQuestion = {
              id: qId,
              quizId: id,
              question: qData.question,
              options: qData.options,
              correctAnswer: qData.correctAnswer,
              explanation: qData.explanation,
              order: qData.order,
              createdAt: now,
              updatedAt: now,
            };
            store.quizQuestions.set(qId, question);
            createdQuestions.push(question);
          }
        }

        createdQuestions.sort((a, b) => a.order - b.order);

        return {
          ...quiz,
          questions: createdQuestions,
        };
      },
      findUnique: async ({ where, include }: { where: { id: string }; include?: any }): Promise<any> => {
        const quiz = store.quizzes.get(where.id);
        if (!quiz) return null;

        if (include?.questions) {
          const questions = Array.from(store.quizQuestions.values())
            .filter((q) => q.quizId === quiz.id)
            .sort((a, b) => a.order - b.order);
          return {
            ...quiz,
            questions,
          };
        }

        return quiz;
      },
      findMany: async ({ where, include }: { where?: any; include?: any }): Promise<any[]> => {
        let results = Array.from(store.quizzes.values());
        if (where?.lessonId) {
          results = results.filter((q) => q.lessonId === where.lessonId);
        }

        return results.map((quiz) => {
          if (include?.questions) {
            const questions = Array.from(store.quizQuestions.values())
              .filter((q) => q.quizId === quiz.id)
              .sort((a, b) => a.order - b.order);
            return {
              ...quiz,
              questions,
            };
          }
          return quiz;
        });
      },
    },
    quizQuestion: {
      findUnique: async ({ where }: { where: { id: string } }): Promise<QuizQuestion | null> => {
        return store.quizQuestions.get(where.id) || null;
      },
      findMany: async ({ where }: { where?: { quizId?: string } }): Promise<QuizQuestion[]> => {
        let results = Array.from(store.quizQuestions.values());
        if (where?.quizId) {
          results = results.filter((q) => q.quizId === where.quizId);
        }
        return results.sort((a, b) => a.order - b.order);
      },
    },
    quizAttempt: {
      create: async ({ data }: { data: any }): Promise<QuizAttempt> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const attempt: QuizAttempt = {
          id,
          learnerId: data.learnerId,
          quizId: data.quizId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers,
          submittedAt: data.submittedAt || now,
          createdAt: now,
          updatedAt: now,
        };
        store.quizAttempts.set(id, attempt);

        if (data.responses?.create) {
          for (const rData of data.responses.create) {
            const rId = randomUUID();
            const response: QuizResponse = {
              id: rId,
              attemptId: id,
              questionId: rData.questionId,
              selectedAnswer: rData.selectedAnswer,
              isCorrect: rData.isCorrect,
              createdAt: now,
            };
            store.quizResponses.set(rId, response);
          }
        }

        return attempt;
      },
      findMany: async ({ where, include }: { where?: any; include?: any }): Promise<any[]> => {
        let results = Array.from(store.quizAttempts.values());
        if (where?.learnerId) {
          results = results.filter((a) => a.learnerId === where.learnerId);
        }
        if (where?.quizId) {
          results = results.filter((a) => a.quizId === where.quizId);
        }

        results.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

        return results.map((attempt) => {
          if (include?.quiz) {
            const quiz = store.quizzes.get(attempt.quizId);
            let quizWithLesson = quiz;
            if (quiz && include.quiz.include?.lesson) {
              const lesson = store.lessons.get(quiz.lessonId);
              quizWithLesson = {
                ...quiz,
                lesson: lesson
                  ? { id: lesson.id, title: lesson.title }
                  : { id: quiz.lessonId, title: 'Unknown Lesson' },
              } as any;
            }
            return {
              ...attempt,
              quiz: quizWithLesson,
            };
          }
          return attempt;
        });
      },
    },
    quizResponse: {
      findMany: async ({ where }: { where?: { attemptId?: string } }): Promise<QuizResponse[]> => {
        let results = Array.from(store.quizResponses.values());
        if (where?.attemptId) {
          results = results.filter((r) => r.attemptId === where.attemptId);
        }
        return results;
      },
    },
    // Part 5 Models
    industrySource: {
      create: async ({ data }: { data: any }): Promise<IndustrySource> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const source: IndustrySource = {
          id,
          name: data.name,
          type: data.type,
          url: data.url,
          technologies: data.technologies || [],
          isActive: data.isActive ?? true,
          pollingIntervalMinutes: data.pollingIntervalMinutes || 360,
          lastSuccessfulCheck: data.lastSuccessfulCheck || null,
          lastAttemptedCheck: data.lastAttemptedCheck || null,
          errorState: data.errorState || null,
          createdAt: now,
          updatedAt: now,
        };
        store.industrySources.set(id, source);
        return source;
      },
      findUnique: async ({ where }: { where: { id: string } }): Promise<IndustrySource | null> => {
        return store.industrySources.get(where.id) || null;
      },
      findMany: async (): Promise<IndustrySource[]> => {
        return Array.from(store.industrySources.values());
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<IndustrySource> => {
        const existing = store.industrySources.get(where.id);
        if (!existing) throw new Error('IndustrySource not found to update.');
        const updated: IndustrySource = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.industrySources.set(where.id, updated);
        return updated;
      },
    },
    skill: {
      create: async ({ data }: { data: any }): Promise<Skill> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const skill: Skill = {
          id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          description: data.description || null,
          aliases: data.aliases || [],
          createdAt: now,
          updatedAt: now,
        };
        store.skills.set(id, skill);
        return skill;
      },
      findUnique: async ({ where }: { where: { id?: string; slug?: string } }): Promise<Skill | null> => {
        if (where.id) return store.skills.get(where.id) || null;
        if (where.slug) {
          for (const s of store.skills.values()) {
            if (s.slug === where.slug) return s;
          }
        }
        return null;
      },
      findMany: async (): Promise<Skill[]> => {
        return Array.from(store.skills.values());
      },
    },
    industryEvent: {
      create: async ({ data }: { data: any }): Promise<IndustryEvent> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const event: IndustryEvent = {
          id,
          sourceId: data.sourceId,
          externalId: data.externalId || null,
          canonicalUrl: data.canonicalUrl,
          title: data.title,
          summary: data.summary || null,
          content: data.content || null,
          sourceName: data.sourceName,
          publishedAt: data.publishedAt || now,
          detectedAt: data.detectedAt || now,
          contentHash: data.contentHash,
          changeType: data.changeType || null,
          importance: data.importance || null,
          confidence: data.confidence || null,
          analysisStatus: data.analysisStatus || 'PENDING',
          analysisResult: data.analysisResult || null,
          createdAt: now,
          updatedAt: now,
        };
        store.industryEvents.set(id, event);
        return event;
      },
      findUnique: async ({ where, include }: { where: { id: string }; include?: any }): Promise<any> => {
        const event = store.industryEvents.get(where.id);
        if (!event) return null;

        let skills: any[] = [];
        if (include?.skills) {
          skills = Array.from(store.industryEventSkills.values())
            .filter((es) => es.eventId === event.id)
            .map((es) => ({
              ...es,
              skill: store.skills.get(es.skillId) || null,
            }));
        }

        let source = null;
        if (include?.source) {
          source = store.industrySources.get(event.sourceId) || null;
        }

        let roadmapUpdates: any[] = [];
        if (include?.roadmapUpdates) {
          roadmapUpdates = Array.from(store.roadmapUpdates.values()).filter(
            (u) => u.industryEventId === event.id
          );
        }

        return {
          ...event,
          skills,
          source,
          roadmapUpdates,
        };
      },
      findFirst: async ({ where }: { where: any }): Promise<IndustryEvent | null> => {
        const events = Array.from(store.industryEvents.values());
        if (where?.canonicalUrl) {
          const match = events.find((e) => e.canonicalUrl === where.canonicalUrl);
          if (match) return match;
        }
        if (where?.contentHash) {
          const match = events.find((e) => e.contentHash === where.contentHash);
          if (match) return match;
        }
        if (where?.OR) {
          for (const cond of where.OR) {
            if (cond.canonicalUrl) {
              const match = events.find((e) => e.canonicalUrl === cond.canonicalUrl);
              if (match) return match;
            }
            if (cond.contentHash) {
              const match = events.find((e) => e.contentHash === cond.contentHash);
              if (match) return match;
            }
            if (cond.sourceId && cond.externalId) {
              const match = events.find(
                (e) => e.sourceId === cond.sourceId && e.externalId === cond.externalId
              );
              if (match) return match;
            }
          }
        }
        return null;
      },
      findMany: async (args: any = {}): Promise<any[]> => {
        const { where, include } = args || {};
        let results = Array.from(store.industryEvents.values());
        if (where?.analysisStatus) {
          results = results.filter((e) => e.analysisStatus === where.analysisStatus);
        }

        return results.map((event) => {
          let skills: any[] = [];
          if (include?.skills) {
            skills = Array.from(store.industryEventSkills.values())
              .filter((es) => es.eventId === event.id)
              .map((es) => ({
                ...es,
                skill: store.skills.get(es.skillId) || null,
              }));
          }
          let source = null;
          if (include?.source) {
            source = store.industrySources.get(event.sourceId) || null;
          }
          return {
            ...event,
            skills,
            source,
          };
        });
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<IndustryEvent> => {
        const existing = store.industryEvents.get(where.id);
        if (!existing) throw new Error('IndustryEvent not found to update.');
        const updated: IndustryEvent = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        store.industryEvents.set(where.id, updated);
        return updated;
      },
    },
    industryEventSkill: {
      create: async ({ data }: { data: any }): Promise<IndustryEventSkill> => {
        const id = data.id || randomUUID();
        const record: IndustryEventSkill = {
          id,
          eventId: data.eventId,
          skillId: data.skillId,
        };
        store.industryEventSkills.set(id, record);
        return record;
      },
      findMany: async (): Promise<IndustryEventSkill[]> => {
        return Array.from(store.industryEventSkills.values());
      },
    },
    lessonSkill: {
      create: async ({ data }: { data: any }): Promise<LessonSkill> => {
        const id = data.id || randomUUID();
        const record: LessonSkill = {
          id,
          lessonId: data.lessonId,
          skillId: data.skillId,
        };
        store.lessonSkills.set(id, record);
        return record;
      },
      findMany: async (): Promise<LessonSkill[]> => {
        return Array.from(store.lessonSkills.values());
      },
    },
    roadmapVersion: {
      create: async ({ data }: { data: any }): Promise<RoadmapVersion> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const version: RoadmapVersion = {
          id,
          roadmapId: data.roadmapId,
          versionNumber: data.versionNumber,
          changeSummary: data.changeSummary,
          changeReason: data.changeReason,
          triggeringEventId: data.triggeringEventId || null,
          snapshot: data.snapshot,
          publishedAt: data.publishedAt || now,
          createdAt: now,
        };
        store.roadmapVersions.set(id, version);
        return version;
      },
      findMany: async (args: any = {}): Promise<any[]> => {
        const { where, include } = args || {};
        let results = Array.from(store.roadmapVersions.values());
        if (where?.roadmapId) {
          results = results.filter((v) => v.roadmapId === where.roadmapId);
        }
        results.sort((a, b) => b.versionNumber - a.versionNumber);
        return results.map((v) => {
          if (include?.triggeringEvent) {
            return {
              ...v,
              triggeringEvent: v.triggeringEventId ? store.industryEvents.get(v.triggeringEventId) || null : null,
            };
          }
          return v;
        });
      },
      findFirst: async ({ where, include }: { where: any; include?: any }): Promise<any> => {
        const results = Array.from(store.roadmapVersions.values());
        const match = results.find(
          (v) => v.id === where.id && (!where.roadmapId || v.roadmapId === where.roadmapId)
        );
        if (!match) return null;
        if (include?.triggeringEvent) {
          return {
            ...match,
            triggeringEvent: match.triggeringEventId
              ? store.industryEvents.get(match.triggeringEventId) || null
              : null,
          };
        }
        return match;
      },
    },
    roadmapUpdate: {
      create: async ({ data }: { data: any }): Promise<RoadmapUpdate> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const update: RoadmapUpdate = {
          id,
          roadmapId: data.roadmapId,
          industryEventId: data.industryEventId,
          proposedChanges: data.proposedChanges,
          rationale: data.rationale,
          evidenceReferences: data.evidenceReferences || [],
          impactScore: data.impactScore,
          riskLevel: data.riskLevel,
          approvalStatus: data.approvalStatus || 'PROPOSED',
          createdAt: now,
          reviewedAt: data.reviewedAt || null,
          appliedAt: data.appliedAt || null,
        };
        store.roadmapUpdates.set(id, update);
        return update;
      },
      findUnique: async ({ where, include }: { where: any; include?: any }): Promise<any> => {
        let match: RoadmapUpdate | undefined;
        if (where.id) {
          match = store.roadmapUpdates.get(where.id);
        } else if (where.roadmapId_industryEventId) {
          const { roadmapId, industryEventId } = where.roadmapId_industryEventId;
          match = Array.from(store.roadmapUpdates.values()).find(
            (u) => u.roadmapId === roadmapId && u.industryEventId === industryEventId
          );
        }
        if (!match) return null;

        let roadmap = null;
        if (include?.roadmap) {
          const r = store.roadmaps.get(match.roadmapId);
          if (r) {
            const milestones = Array.from(store.milestones.values())
              .filter((m) => m.roadmapId === r.id)
              .sort((a, b) => a.order - b.order)
              .map((m) => ({
                ...m,
                lessons: Array.from(store.lessons.values())
                  .filter((l) => l.milestoneId === m.id)
                  .sort((a, b) => a.order - b.order),
              }));
            roadmap = { ...r, milestones };
          }
        }

        let industryEvent = null;
        if (include?.industryEvent) {
          industryEvent = store.industryEvents.get(match.industryEventId) || null;
        }

        return {
          ...match,
          roadmap,
          industryEvent,
        };
      },
      findMany: async (args: any = {}): Promise<any[]> => {
        const { where, include } = args || {};
        let results = Array.from(store.roadmapUpdates.values());
        if (where?.roadmapId) {
          results = results.filter((u) => u.roadmapId === where.roadmapId);
        }
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return results.map((u) => {
          let industryEvent = null;
          if (include?.industryEvent) {
            industryEvent = store.industryEvents.get(u.industryEventId) || null;
          }
          return {
            ...u,
            industryEvent,
          };
        });
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<RoadmapUpdate> => {
        const existing = store.roadmapUpdates.get(where.id);
        if (!existing) throw new Error('RoadmapUpdate not found to update.');
        const updated: RoadmapUpdate = {
          ...existing,
          ...data,
        };
        store.roadmapUpdates.set(where.id, updated);
        return updated;
      },
    },
    notification: {
      create: async ({ data }: { data: any }): Promise<Notification> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const notification: Notification = {
          id,
          learnerId: data.learnerId,
          roadmapUpdateId: data.roadmapUpdateId || null,
          title: data.title,
          message: data.message,
          reason: data.reason,
          read: data.read || false,
          actionUrl: data.actionUrl || null,
          createdAt: now,
        };
        store.notifications.set(id, notification);
        return notification;
      },
      findUnique: async ({ where }: { where: { id: string } }): Promise<Notification | null> => {
        return store.notifications.get(where.id) || null;
      },
      findMany: async (args: any = {}): Promise<any[]> => {
        const { where } = args || {};
        let results = Array.from(store.notifications.values());
        if (where?.learnerId) {
          results = results.filter((n) => n.learnerId === where.learnerId);
        }
        if (where?.read !== undefined) {
          results = results.filter((n) => n.read === where.read);
        }
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return results;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<Notification> => {
        const existing = store.notifications.get(where.id);
        if (!existing) throw new Error('Notification not found to update.');
        const updated: Notification = {
          ...existing,
          ...data,
        };
        store.notifications.set(where.id, updated);
        return updated;
      },
    },
    resourceRecommendation: {
      create: async ({ data }: { data: any }): Promise<ResourceRecommendation> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const rec: ResourceRecommendation = {
          id,
          lessonId: data.lessonId,
          title: data.title,
          url: data.url,
          provider: data.provider || 'YOUTUBE',
          durationSeconds: data.durationSeconds ?? null,
          channelTitle: data.channelTitle ?? null,
          language: data.language || 'English',
          relevanceScore: data.relevanceScore ?? 1.0,
          createdAt: now,
        };
        store.resourceRecommendations.set(id, rec);
        return rec;
      },
      findMany: async (args: any = {}): Promise<ResourceRecommendation[]> => {
        const { where } = args || {};
        let results = Array.from(store.resourceRecommendations.values());
        if (where?.lessonId) {
          results = results.filter((r) => r.lessonId === where.lessonId);
        }
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        return results;
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>): Promise<any> => {
      return fn(client);
    },
    $disconnect: async (): Promise<void> => {},
    $queryRaw: async (): Promise<any[]> => [{ '?column?': 1 }],
    clear: (): void => {
      store.learners.clear();
      store.roadmaps.clear();
      store.milestones.clear();
      store.lessons.clear();
      store.lessonProgress.clear();
      store.quizzes.clear();
      store.quizQuestions.clear();
      store.quizAttempts.clear();
      store.quizResponses.clear();
      store.industrySources.clear();
      store.industryEvents.clear();
      store.skills.clear();
      store.industryEventSkills.clear();
      store.lessonSkills.clear();
      store.roadmapVersions.clear();
      store.roadmapUpdates.clear();
      store.notifications.clear();
      store.resourceRecommendations.clear();
    },
  };

  return client;
}
