'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface RevisionConcept {
  id: string;
  title: string;
  lessonId?: string;
  mistakesCount: number;
  reason: string;
  recommendedAction: string;
}

const DEFAULT_REVISION_TOPICS: RevisionConcept[] = [
  {
    id: 'rev-1',
    title: 'Promise Error Handling with try...catch',
    lessonId: 'lesson-es6-async',
    mistakesCount: 1,
    reason: 'Missed in recent practice: unhandled promise rejections occur when await is not guarded by try/catch.',
    recommendedAction: 'Review asynchronous error catching patterns and rejected state handling.',
  },
  {
    id: 'rev-2',
    title: 'HTML5 Semantic Sectioning vs Generic Divs',
    lessonId: 'lesson-html-semantics',
    mistakesCount: 2,
    reason: 'Missed in web fundamentals check: using <section> and <article> with proper heading hierarchy.',
    recommendedAction: 'Review accessible DOM outlining and screen reader landmark tags.',
  },
];

export default function RevisionPage() {
  const { user } = useAuth();
  const [revisionList, setRevisionList] = useState<RevisionConcept[]>(DEFAULT_REVISION_TOPICS);

  useEffect(() => {
    let isMounted = true;

    async function loadAttempts() {
      if (!user) return;

      try {
        const res = await api.getLearnerQuizAttempts(user.id);
        if (isMounted && res.success && res.data) {
          // Filter attempts with mistakes (< 100%)
          const imperfect = res.data.filter((a) => a.score < 100);
          if (imperfect.length > 0) {
            const derived: RevisionConcept[] = imperfect.map((a) => ({
              id: a.id,
              title: `${a.quizTitle} (${a.lessonTitle})`,
              lessonId: a.lessonId,
              mistakesCount: a.totalQuestions - a.correctAnswers,
              reason: `Scored ${a.score}% on recent practice quiz. Review key takeaways to achieve 100% mastery.`,
              recommendedAction: 'Revisit core lesson theory and retest in the practice arena.',
            }));
            setRevisionList(derived);
          }
        }
      } catch {
        // Fallback
      }
    }

    loadAttempts();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
            Smart Revision System
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Targeted concept reinforcement based on practice arena attempts and recorded mistakes
          </p>
        </div>
        <Badge variant="warm" size="md" className="gap-1.5 py-1 px-3">
          <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />
          <span>{revisionList.length} Topics for Targeted Review</span>
        </Badge>
      </div>

      {/* Revision Strategy Card */}
      <Card className="p-6 bg-gradient-to-br from-[#FAF9F5] via-white to-[#D6F0EF]/30 border-[#E6E9E8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#087F8C] uppercase tracking-wider">
              Spaced Repetition &amp; Memory Retention
            </span>
            <h2 className="text-lg font-bold text-[#242039]">
              Turn Missed Questions Into Permanent Insights
            </h2>
            <p className="text-xs text-[#667085] leading-relaxed max-w-xl">
              Upwise tracks incorrect quiz answers and queues them here for quick review. Revisiting a concept within 48 hours boosts long-term recall by over 80%.
            </p>
          </div>
          <div className="shrink-0">
            <Link href="/practice">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Practice Arena
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Revision Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {revisionList.map((item) => (
          <Card
            key={item.id}
            className="p-5 space-y-3.5 bg-white border-[#E6E9E8] hover:border-[#c2eae8] transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge variant="warm" size="sm" className="gap-1">
                  <span>{item.mistakesCount} Mistake{item.mistakesCount > 1 ? 's' : ''} Recorded</span>
                </Badge>
                <RotateCcw className="w-4 h-4 text-[#D97706]" />
              </div>

              <h3 className="text-base font-bold text-[#242039] leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-[#667085] leading-relaxed">
                {item.reason}
              </p>

              <div className="p-2.5 rounded-[8px] bg-[#FAF9F5] border border-[#E6E9E8] text-[11px] text-[#242039]/80">
                <strong>Next Step:</strong> {item.recommendedAction}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 border-t border-[#E6E9E8]">
              <Link href={item.lessonId ? `/learn?id=${item.lessonId}` : '/learn'} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
                  Revise Lesson
                </Button>
              </Link>
              <Link href={item.lessonId ? `/practice?lessonId=${item.lessonId}` : '/practice'} className="flex-1">
                <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Retest Quiz
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
