'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  Calendar,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { DailyPlanResponse, DailyPlanTask } from '@/types';

// Default tasks if learner has not yet generated a roadmap
const FALLBACK_TASKS: DailyPlanTask[] = [
  {
    lessonId: 'lesson-1',
    title: 'Web Architecture & HTML5 Document Structure',
    durationMinutes: 15,
    order: 1,
    status: 'NOT_STARTED',
    milestoneId: 'm1',
    milestoneTitle: 'Milestone 1: Web Fundamentals',
    roadmapId: 'r1',
    roadmapTitle: 'Web Development',
  },
  {
    lessonId: 'lesson-2',
    title: 'Practice Check: HTML5 Document Semantics & Head Meta',
    durationMinutes: 10,
    order: 2,
    status: 'NOT_STARTED',
    milestoneId: 'm1',
    milestoneTitle: 'Milestone 1: Web Fundamentals',
    roadmapId: 'r1',
    roadmapTitle: 'Web Development',
  },
];

export default function PlanPage() {
  const { user } = useAuth();
  const [dailyPlan, setDailyPlan] = useState<DailyPlanResponse | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDailyPlan() {
      if (!user) return;
      setErrorNotice(null);

      try {
        const res = await api.getDailyPlan(user.id);
        if (isMounted) {
          if (res.success && res.data) {
            setDailyPlan(res.data);
          } else {
            // Offline or no roadmaps yet
            setDailyPlan(null);
          }
        }
      } catch {
        if (isMounted) {
          setErrorNotice('Unable to reach server. Displaying recommended study plan.');
        }
      }
    }

    loadDailyPlan();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const tasks = dailyPlan?.tasks && dailyPlan.tasks.length > 0 ? dailyPlan.tasks : FALLBACK_TASKS;
  const targetMinutes = dailyPlan?.availableMinutes || 30;
  const plannedMinutes = dailyPlan?.plannedMinutes || tasks.reduce((acc, t) => acc + t.durationMinutes, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242039] tracking-tight">
            Today&apos;s Learning Plan
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Deterministic daily study queue tailored to your {targetMinutes} mins/day commitment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="md" className="gap-1.5 py-1 px-3">
            <Clock className="w-3.5 h-3.5 text-[#087F8C]" />
            <span>Target: {targetMinutes} mins</span>
          </Badge>
          <Badge variant="neutral" size="md" className="gap-1.5 py-1 px-3">
            <Calendar className="w-3.5 h-3.5 text-[#667085]" />
            <span>Today</span>
          </Badge>
        </div>
      </div>

      {errorNotice && (
        <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E9E8] text-xs text-[#667085] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#087F8C] shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Plan Summary Banner */}
      <Card className="p-6 bg-gradient-to-br from-[#D6F0EF]/40 via-white to-[#FAF9F5] border-[#BCE4E2]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#087F8C] uppercase tracking-wider">
              Daily Mission
            </span>
            <h2 className="text-lg font-bold text-[#242039]">
              {dailyPlan?.status === 'COMPLETED'
                ? 'All Daily Tasks Completed! 🎉'
                : `${tasks.length} Scheduled Learning Tasks`}
            </h2>
            <p className="text-xs text-[#667085]">
              Total planned time: <strong className="text-[#242039]">{plannedMinutes} minutes</strong> • Steady pace builds lasting mastery
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link href="/roadmap">
              <Button variant="secondary" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
                View Full Roadmap
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task, idx) => {
          const isDone = task.status === 'COMPLETED';
          return (
            <Card
              key={task.lessonId || idx}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#c2eae8] ${
                isDone ? 'bg-[#E5F7EE]/30 border-[#22A06B]/30' : 'bg-white border-[#E6E9E8]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#D6F0EF] text-[#087F8C] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Badge variant={isDone ? 'success' : 'neutral'} size="sm">
                    {isDone ? 'Completed' : 'Core Lesson'}
                  </Badge>
                  <span className="text-xs text-[#667085] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {task.durationMinutes} mins
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#242039]">{task.title}</h3>
                <p className="text-xs text-[#667085]">{task.milestoneTitle}</p>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                <Link href={`/learn?id=${task.lessonId}`}>
                  <Button
                    variant={isDone ? 'secondary' : 'primary'}
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {isDone ? 'Review' : 'Start Task'}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
