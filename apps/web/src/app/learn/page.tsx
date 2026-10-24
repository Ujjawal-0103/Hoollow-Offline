'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { Lesson } from '@/types';

// Fallback lesson for offline development
const FALLBACK_LESSON: Lesson = {
  id: 'lesson-es6-async',
  milestoneId: 'milestone-js',
  title: 'Modern JavaScript: Async, Await & Promises',
  description: 'Understand asynchronous non-blocking event loops, Promises, and error handling in modern JS.',
  order: 3,
  durationMinutes: 20,
  learningObjectives: [
    'Explain how JavaScript executes non-blocking operations via the Event Loop',
    'Understand Promise states (pending, fulfilled, rejected)',
    'Write clean asynchronous functions using async/await syntax',
    'Catch network and runtime exceptions using try/catch blocks',
  ],
  content: `In JavaScript, operations like fetching remote data, querying databases, or reading files take time. Rather than freezing your user interface while waiting for the response, JavaScript uses an asynchronous event-driven architecture.

A Promise is an object representing the eventual completion or failure of an asynchronous operation. A promise starts in a **pending** state, and transitions either to **fulfilled** (with a result value) or **rejected** (with an error).

The \`async\` and \`await\` keywords provide syntactic sugar over native Promises, making asynchronous code read like clean synchronous instructions while preserving non-blocking performance.`,
  examples: [
`// Modern Async/Await Fetch Pattern
async function fetchLearnerRoadmap(learnerId) {
  try {
    const response = await fetch(\`/api/learners/\${learnerId}/roadmaps\`);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to retrieve learner roadmap:', error);
    throw error;
  }
}`,
  ],
  keyTakeaways: [
    'async functions always return a Promise automatically.',
    'await pauses function execution until the Promise resolves without freezing the main thread.',
    'Always enclose await statements inside try...catch blocks to handle network failure gracefully.',
    'Use Promise.all() to run independent asynchronous operations concurrently.',
  ],
};

function LessonViewer() {
  const { user, updateUserStats } = useAuth();
  const searchParams = useSearchParams();
  const lessonIdFromUrl = searchParams.get('id');

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLesson() {
      setIsLoading(true);
      setErrorNotice(null);

      try {
        let targetId = lessonIdFromUrl;

        // If no ID specified, try to find the next lesson from daily plan or roadmaps
        if (!targetId && user) {
          const planRes = await api.getDailyPlan(user.id);
          if (planRes.success && planRes.data?.nextLessonId) {
            targetId = planRes.data.nextLessonId;
          } else {
            const roadmapsRes = await api.getLearnerRoadmaps(user.id);
            if (roadmapsRes.success && roadmapsRes.data?.[0]?.milestones?.[0]?.lessons?.[0]) {
              targetId = roadmapsRes.data[0].milestones[0].lessons[0].id;
            }
          }
        }

        if (targetId) {
          const res = await api.getLesson(targetId);
          if (isMounted) {
            if (res.success && res.data) {
              setLesson(res.data);
            } else {
              setLesson(FALLBACK_LESSON);
              setErrorNotice('Viewing offline curriculum lesson.');
            }
          }
        } else {
          if (isMounted) {
            setLesson(FALLBACK_LESSON);
          }
        }
      } catch {
        if (isMounted) {
          setLesson(FALLBACK_LESSON);
          setErrorNotice('Backend unreachable. Running with cached lesson content.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLesson();

    return () => {
      isMounted = false;
    };
  }, [lessonIdFromUrl, user]);

  const handleCopyCode = (code: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCompleteLesson = async () => {
    if (!lesson || !user || isCompleted) return;
    setIsCompleting(true);

    try {
      const res = await api.completeLesson(lesson.id, user.id);
      if (res.success) {
        setIsCompleted(true);
        updateUserStats(50, true);
      } else {
        // Optimistic offline completion
        setIsCompleted(true);
        updateUserStats(50, true);
      }
    } catch {
      setIsCompleted(true);
      updateUserStats(50, true);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <Card className="p-8 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-32 bg-gray-200 rounded-[12px]"></div>
        </Card>
      </div>
    );
  }

  const activeLesson = lesson || FALLBACK_LESSON;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/roadmap"
          className="text-xs font-semibold text-[#087F8C] flex items-center gap-1.5 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roadmap</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="sm" className="gap-1 font-mono">
            <Clock className="w-3 h-3" />
            <span>{activeLesson.durationMinutes} mins</span>
          </Badge>
          {isCompleted && (
            <Badge variant="success" size="sm" className="gap-1">
              <Check className="w-3 h-3" />
              <span>Completed</span>
            </Badge>
          )}
        </div>
      </div>

      {errorNotice && (
        <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E9E8] text-xs text-[#667085] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#087F8C] shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Lesson Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#087F8C] uppercase tracking-wider">
            Lesson {activeLesson.order || 1}
          </span>
          <span className="text-xs text-[#667085]">•</span>
          <span className="text-xs text-[#667085]">Core Concept</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
          {activeLesson.title}
        </h1>
        <p className="text-sm text-[#667085] leading-relaxed">
          {activeLesson.description}
        </p>
      </div>

      {/* Main Content Card */}
      <Card className="p-6 sm:p-8 space-y-7 bg-white border-[#E6E9E8]">
        {/* Learning Objectives */}
        {activeLesson.learningObjectives && activeLesson.learningObjectives.length > 0 && (
          <div className="p-4 rounded-[14px] bg-[#D6F0EF]/30 border border-[#BCE4E2]/60 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F8C] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learning Objectives</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-[#242039]">
              {activeLesson.learningObjectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087F8C] shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Body */}
        <div className="space-y-4 text-sm leading-relaxed text-[#242039]/90">
          <h2 className="text-base font-bold text-[#242039]">Core Theory &amp; Fundamentals</h2>
          <div className="space-y-3 whitespace-pre-line text-sm">
            {activeLesson.content}
          </div>
        </div>

        {/* Code Examples */}
        {activeLesson.examples && activeLesson.examples.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#242039] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#087F8C]" />
                <span>Code Example</span>
              </h3>
            </div>
            {activeLesson.examples.map((example, idx) => (
              <div
                key={idx}
                className="relative rounded-[12px] bg-[#1E1E24] text-[#E6E9E8] p-4 font-mono text-xs overflow-x-auto shadow-inner"
              >
                <button
                  onClick={() => handleCopyCode(example, idx)}
                  className="absolute top-3 right-3 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white flex items-center gap-1 transition-colors"
                  aria-label="Copy code"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-[#22A06B]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <pre className="pr-16">{example}</pre>
              </div>
            ))}
          </div>
        )}

        {/* Key Takeaways */}
        {activeLesson.keyTakeaways && activeLesson.keyTakeaways.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-[#242039]">Key Takeaways</h3>
            <ul className="text-xs sm:text-sm space-y-2 list-none p-0">
              {activeLesson.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22A06B] shrink-0 mt-0.5" />
                  <span className="text-[#242039]">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-6 border-t border-[#E6E9E8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant={isCompleted ? 'soft' : 'primary'}
            size="md"
            onClick={handleCompleteLesson}
            disabled={isCompleting || isCompleted}
            leftIcon={
              isCompleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )
            }
          >
            {isCompleted ? 'Completed (+50 XP)' : isCompleting ? 'Saving...' : 'Mark as Completed (+50 XP)'}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href={`/practice?lessonId=${activeLesson.id}`} className="flex-1 sm:flex-initial">
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Practice Quiz (+30 XP)
              </Button>
            </Link>
            <Link href={`/videos?topic=${encodeURIComponent(activeLesson.title)}`}>
              <Button variant="secondary" size="md" title="Watch topic video">
                <Play className="w-4 h-4 text-[#087F8C]" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto p-12 text-center text-sm text-[#667085]">
          Loading lesson...
        </div>
      }
    >
      <LessonViewer />
    </Suspense>
  );
}
