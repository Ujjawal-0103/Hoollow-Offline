'use client';

import React, { useEffect, useState } from 'react';
import {
  api,
  Roadmap,
  Lesson,
  RoadmapUpdate,
  RoadmapVersion,
  NotificationItem,
  ResourceRecommendation,
  MonitoringStatus,
  IndustryEvent,
} from '../lib/api';

export default function Dashboard() {
  const [learnerId, setLearnerId] = useState<string>('');
  const [learnerName, setLearnerName] = useState<string>('Alex Rivera');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [updates, setUpdates] = useState<RoadmapUpdate[]>([]);
  const [versions, setVersions] = useState<RoadmapVersion[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [events, setEvents] = useState<IndustryEvent[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);

  // Modals & Drawers
  const [selectedUpdate, setSelectedUpdate] = useState<RoadmapUpdate | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<RoadmapVersion | null>(null);
  const [recommendationLesson, setRecommendationLesson] = useState<Lesson | null>(null);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initialize or fetch default demo learner & roadmap
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Create or get learner
        const learner = await api.createLearner({
          displayName: 'Alex Rivera',
          preferredLanguage: 'English',
          currentLevel: 'BEGINNER',
          learningGoal: 'Master Modern Web Development',
          minutesPerDay: 45,
        });
        setLearnerId(learner.id);
        setLearnerName(learner.displayName);

        // Create roadmap for learner
        const rm = await api.createRoadmap(learner.id, 'Web Development');
        setRoadmap(rm);

        // Fetch lessons
        const ls = await api.getRoadmapLessons(rm.id, learner.id);
        setLessons(ls);

        // Fetch updates & versions
        const [up, vs, ev, st, notifs] = await Promise.all([
          api.getRoadmapUpdates(rm.id).catch(() => []),
          api.getRoadmapVersions(rm.id).catch(() => []),
          api.getIndustryEvents().catch(() => []),
          api.getIndustryStatus().catch(() => null),
          api.getNotifications(learner.id).catch(() => []),
        ]);

        setUpdates(up);
        setVersions(vs);
        setEvents(ev);
        setMonitoringStatus(st);
        setNotifications(notifs);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setStatusMessage(`Could not connect to Hoollow API: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const pendingUpdates = updates.filter((u) => u.approvalStatus === 'PROPOSED');
  const unreadNotifications = notifications.filter((n) => !n.read);

  // Handlers
  async function handleCheckUpdates() {
    if (!roadmap) return;
    setActionLoading(true);
    setStatusMessage('Evaluating latest industry developments against your roadmap...');
    try {
      const res = await api.adaptRoadmap(roadmap.id);
      setUpdates(res.updates);
      if (res.newProposalsCount > 0) {
        setStatusMessage(`Discovered ${res.newProposalsCount} new industry-driven roadmap updates!`);
      } else {
        setStatusMessage('Your learning path is completely up to date with the latest industry releases.');
      }
    } catch (err: any) {
      setStatusMessage(`Scan failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveUpdate(updateId: string) {
    if (!roadmap) return;
    setActionLoading(true);
    try {
      await api.approveUpdate(roadmap.id, updateId);
      // Refresh lessons, versions, updates, notifications
      const [up, vs, ls, rm, notifs] = await Promise.all([
        api.getRoadmapUpdates(roadmap.id),
        api.getRoadmapVersions(roadmap.id),
        api.getRoadmapLessons(roadmap.id, learnerId),
        api.getRoadmap(roadmap.id),
        api.getNotifications(learnerId),
      ]);
      setUpdates(up);
      setVersions(vs);
      setLessons(ls);
      setRoadmap(rm);
      setNotifications(notifs);
      setSelectedUpdate(null);
      setStatusMessage('Update approved! Your roadmap has been updated with a new version.');
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectUpdate(updateId: string) {
    if (!roadmap) return;
    setActionLoading(true);
    try {
      await api.rejectUpdate(roadmap.id, updateId, 'Skipped by learner for current beginner objectives');
      const up = await api.getRoadmapUpdates(roadmap.id);
      setUpdates(up);
      setSelectedUpdate(null);
      setStatusMessage('Proposal rejected. Your roadmap was not modified.');
    } catch (err: any) {
      alert(`Reject error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleLesson(lesson: Lesson) {
    if (!learnerId) return;
    try {
      await api.completeLesson(lesson.id, learnerId);
      if (roadmap) {
        const ls = await api.getRoadmapLessons(roadmap.id, learnerId);
        setLessons(ls);
      }
    } catch (err: any) {
      console.error('Completion error:', err);
    }
  }

  async function handleOpenRecommendations(lesson: Lesson) {
    setRecommendationLesson(lesson);
    try {
      const recs = await api.getLessonRecommendations(lesson.id);
      setRecommendations(recs);
    } catch (err) {
      setRecommendations([]);
    }
  }

  async function handleTriggerManualScan() {
    setActionLoading(true);
    try {
      const res = await api.triggerScan();
      const [st, ev] = await Promise.all([api.getIndustryStatus(), api.getIndustryEvents()]);
      setMonitoringStatus(st);
      setEvents(ev);
      setStatusMessage(`Industry scan finished: ${res.totalNewEvents} new events detected.`);
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkNotificationRead(notificationId: string) {
    try {
      await api.markNotificationRead(learnerId, notificationId);
      const notifs = await api.getNotifications(learnerId);
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-zinc-600">Initializing Hoollow Intelligence System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white shadow-sm">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-zinc-900">Hoollow</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  Dynamic Roadmaps
                </span>
              </div>
              <p className="text-xs text-zinc-500">Autonomous Industry Intelligence & Curriculum Adaptation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMonitoringModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-sm transition"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Industry Sources
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                className="relative rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 transition"
                title="Notifications"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDrawer && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="text-xs font-semibold text-zinc-800">In-App Notifications</span>
                    <span className="text-[10px] text-zinc-400">{notifications.length} total</span>
                  </div>
                  <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-zinc-400">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className={`cursor-pointer rounded-lg p-2.5 text-xs transition ${
                            n.read ? 'bg-zinc-50 text-zinc-500' : 'bg-indigo-50/60 text-zinc-900 border-l-2 border-indigo-600'
                          }`}
                        >
                          <div className="font-semibold text-zinc-800">{n.title}</div>
                          <p className="mt-0.5 text-zinc-600 text-[11px] leading-relaxed">{n.message}</p>
                          <span className="mt-1 block text-[10px] text-zinc-400">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Learner Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
              {learnerName} (Level: Beginner)
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Status Toast / Alert */}
        {statusMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="font-bold hover:text-indigo-950">
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Update Alert Banner */}
        {pendingUpdates.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-950">
                      {pendingUpdates.length} Dynamic Industry Update{pendingUpdates.length > 1 ? 's' : ''} Available
                    </span>
                    <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800">
                      REVIEW REQUIRED
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                    Hoollow detected changes in official industry sources that impact your active roadmap.
                    Inspect the proposed lessons and decide whether to update your learning path.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setSelectedUpdate(pendingUpdates[0])}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
                >
                  Review & Compare Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Meta Header */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {roadmap?.title || 'Personalized Web Development Roadmap'}
              </h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                v{roadmap?.version || 1}.0
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Primary Skill: <strong className="text-zinc-700">{roadmap?.skill}</strong> • Target: {roadmap?.goal} • {lessons.length} Curated Lessons
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCheckUpdates}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-sm"
            >
              🔄 Check for Updates
            </button>

            <button
              onClick={() => setShowVersionHistory(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              📜 Version History ({versions.length})
            </button>
          </div>
        </div>

        {/* Grid Layout: Roadmap Lessons + Industry Intelligence Sidebar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Lessons Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-bold text-zinc-900">Sequential Learning Curriculum</h2>
              <span className="text-xs text-zinc-500">
                {lessons.filter((l) => l.completed).length} of {lessons.length} Completed
              </span>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
                No lessons available. Generate a roadmap to get started.
              </div>
            ) : (
              lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className={`group relative rounded-2xl border p-5 transition ${
                    lesson.completed
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleLesson(lesson)}
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
                          lesson.completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-zinc-300 hover:border-zinc-400 bg-white'
                        }`}
                        title={lesson.completed ? 'Completed' : 'Mark as complete'}
                      >
                        {lesson.completed ? '✓' : ''}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400">#{idx + 1}</span>
                          <h3
                            className={`text-sm font-semibold ${
                              lesson.completed ? 'text-zinc-500 line-through' : 'text-zinc-900'
                            }`}
                          >
                            {lesson.title}
                          </h3>
                        </div>

                        {lesson.description && (
                          <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{lesson.description}</p>
                        )}

                        {lesson.learningObjectives?.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {lesson.learningObjectives.slice(0, 2).map((obj, i) => (
                              <span
                                key={i}
                                className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                              >
                                • {obj}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        {lesson.durationMinutes}m
                      </span>

                      <button
                        onClick={() => handleOpenRecommendations(lesson)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 transition"
                      >
                        📺 Videos
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Industry Intelligence Live Feed Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <h2 className="text-base font-bold text-zinc-900">Industry Radar</h2>
              </div>
              <button
                onClick={handleTriggerManualScan}
                disabled={actionLoading}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Scan Now
              </button>
            </div>

            <div className="space-y-3.5">
              {events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400">
                  No monitored events detected yet. Click &quot;Scan Now&quot; to fetch feeds.
                </div>
              ) : (
                events.slice(0, 6).map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300 transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="font-semibold text-indigo-600">{ev.sourceName}</span>
                      <span>{new Date(ev.publishedAt).toLocaleDateString()}</span>
                    </div>

                    <h4 className="mt-1.5 text-xs font-bold text-zinc-800 line-clamp-2">{ev.title}</h4>

                    {ev.summary && (
                      <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{ev.summary}</p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-zinc-100">
                      <div className="flex flex-wrap gap-1">
                        {ev.skills?.map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-wider"
                          >
                            {s.skill.name}
                          </span>
                        ))}
                      </div>

                      <a
                        href={ev.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-medium text-zinc-400 hover:text-indigo-600"
                      >
                        Source ↗
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Review & Compare Proposal Modal */}
      {selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                  Roadmap Change Proposal
                </span>
                <h3 className="mt-1 text-lg font-bold text-zinc-900">
                  {selectedUpdate.industryEvent?.title || 'Proposed Industry Update'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUpdate(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs font-semibold text-zinc-700">Rationale for Roadmap Adaptation</h4>
                <p className="mt-1 text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  {selectedUpdate.rationale}
                </p>
              </div>

              {/* Proposed Lesson Details */}
              {selectedUpdate.proposedChanges?.map((change: any, i: number) => (
                <div key={i} className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                      Action: {change.action}
                    </span>
                    <span className="text-xs text-indigo-900 font-semibold">{change.durationMinutes}m</span>
                  </div>
                  <h5 className="mt-1 text-sm font-bold text-zinc-900">{change.lessonTitle}</h5>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{change.description}</p>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-zinc-200 p-3 bg-zinc-50">
                  <span className="text-[10px] font-semibold text-zinc-400">Impact Score</span>
                  <p className="text-base font-bold text-indigo-600">{selectedUpdate.impactScore}/100</p>
                </div>
                <div className="rounded-xl border border-zinc-200 p-3 bg-zinc-50">
                  <span className="text-[10px] font-semibold text-zinc-400">Risk Assessment</span>
                  <p className="text-base font-bold text-zinc-800">{selectedUpdate.riskLevel}</p>
                </div>
              </div>

              {selectedUpdate.evidenceReferences?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-700">Verified Evidence & Sources</h4>
                  <ul className="mt-1 space-y-1 text-[11px] text-zinc-500">
                    {selectedUpdate.evidenceReferences.map((ref, idx) => (
                      <li key={idx} className="truncate">• {ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                onClick={() => handleRejectUpdate(selectedUpdate.id)}
                disabled={actionLoading}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition"
              >
                Reject Proposal
              </button>
              <button
                onClick={() => handleApproveUpdate(selectedUpdate.id)}
                disabled={actionLoading}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                Approve & Apply to Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer/Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Roadmap Version History</h3>
                <p className="text-xs text-zinc-500">Historical snapshots preserved without data loss</p>
              </div>
              <button onClick={() => setShowVersionHistory(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {versions.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-400">
                  Current roadmap is at initial version v1.0. Applied updates will appear here.
                </p>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 hover:bg-zinc-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                        v{ver.versionNumber}.0
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(ver.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="mt-2 text-xs font-semibold text-zinc-800">{ver.changeSummary}</h4>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">{ver.changeReason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Recommendations Modal */}
      {recommendationLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Learning Resources</span>
                <h3 className="text-sm font-bold text-zinc-900">{recommendationLesson.title}</h3>
              </div>
              <button
                onClick={() => setRecommendationLesson(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recommendations.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-400">Finding educational video recommendations...</p>
              ) : (
                recommendations.map((rec, i) => (
                  <a
                    key={i}
                    href={rec.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-zinc-200 p-3.5 hover:border-indigo-300 hover:bg-indigo-50/20 transition group"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-800 group-hover:text-indigo-600">{rec.title}</h4>
                      <p className="mt-0.5 text-[10px] text-zinc-400">{rec.channelTitle || 'Official Resource'}</p>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-indigo-600">▶ Watch</span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Status Modal */}
      {showMonitoringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Industry Sources & Observation</h3>
                <p className="text-xs text-zinc-500">Autonomous polling status of registered feeds</p>
              </div>
              <button
                onClick={() => setShowMonitoringModal(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {monitoringStatus?.sources.map((src) => (
                <div key={src.id} className="rounded-xl border border-zinc-200 p-3.5 bg-zinc-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800">{src.name}</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ACTIVE ({src.type})
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Last check: {src.lastSuccessfulCheck ? new Date(src.lastSuccessfulCheck).toLocaleTimeString() : 'Pending'}</span>
                    <span>Status: {src.errorState ? `Error: ${src.errorState}` : 'Healthy'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleTriggerManualScan}
                disabled={actionLoading}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                Trigger Immediate Feed Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
