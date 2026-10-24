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
  };

  const client: any = {
    learner: {
      create: async ({ data }: { data: any }): Promise<Learner> => {
        const id = data.id || randomUUID();
        const now = new Date();
        const learner: Learner = {
          id,
          displayName: data.displayName ?? null,
          preferredLanguage: data.preferredLanguage || 'English',
          currentLevel: data.currentLevel,
          learningGoal: data.learningGoal,
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
      update: async ({ where, data }: { where: { id: string }; data: any }): Promise<Learner> => {
        const existing = store.learners.get(where.id);
        if (!existing) {
          throw new Error('Record to update not found.');
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
      findUnique: async ({ where }: { where: { id: string } }): Promise<any> => {
        const roadmap = store.roadmaps.get(where.id);
        if (!roadmap) return null;

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
      },
      findMany: async ({ where }: { where: { learnerId: string } }): Promise<any[]> => {
        const userRoadmaps = Array.from(store.roadmaps.values())
          .filter((r) => r.learnerId === where.learnerId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((roadmap) => {
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
          });

        return userRoadmaps;
      },
    },
    lesson: {
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
        if (where.lesson?.milestone?.roadmapId) {
          const targetRoadmapId = where.lesson.milestone.roadmapId;
          results = results.filter((p) => {
            const lesson = store.lessons.get(p.lessonId);
            if (!lesson) return false;
            const milestone = store.milestones.get(lesson.milestoneId);
            if (!milestone) return false;
            return milestone.roadmapId === targetRoadmapId;
          });
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
      create: async ({ data }: { data: any; include?: any }): Promise<any> => {
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
      findMany: async ({ where, include }: { where?: any; include?: any; orderBy?: any }): Promise<any[]> => {
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
      findMany: async ({ where, include }: { where?: any; include?: any; orderBy?: any }): Promise<any[]> => {
        let results = Array.from(store.quizAttempts.values());
        if (where?.learnerId) {
          results = results.filter((a) => a.learnerId === where.learnerId);
        }
        if (where?.quizId) {
          results = results.filter((a) => a.quizId === where.quizId);
        }

        // Sort newest first
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
    },
  };

  return client;
}
