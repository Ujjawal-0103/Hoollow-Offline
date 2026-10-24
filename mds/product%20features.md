# Hoollow — Product Features & MVP Specification

## 1. Product Overview

**Product name:** Hoollow  
**Product concept:** An AI-powered learning platform that helps people learn new skills without feeling overwhelmed.

**Core promise:** Help learners decide what to learn, find the right resources, understand difficult concepts, practice, and see their progress.

**Product flow:** Plan → Learn → Practice → Track progress → Revise → Level up.

## 2. Product Principles

- Keep the experience simple, calm, and easy to understand.
- Use a light theme with a clean, modern interface.
- Make the next action obvious on every screen.
- Break large learning goals into small, manageable steps.
- Keep all learning tools connected to the learner's selected skill and roadmap.
- Show meaningful progress and reward consistent learning.
- Prioritize a complete, working end-to-end experience over many incomplete features.

## 3. Core Features

### 3.1 AI-Powered Learning Roadmap

Allow users to create a personalized roadmap for a skill they want to learn.

**User inputs:**
- Skill or topic they want to learn.
- Current skill level: Beginner, Intermediate, or Advanced.
- Learning goal or desired outcome.
- Available study time per day.
- Preferred learning language, where relevant.

**Expected output:**
- A structured roadmap divided into milestones or stages.
- Ordered topics and lessons.
- Estimated time for each lesson or milestone.
- Clear objectives and suggested next actions.
- Completion status for each step.

The roadmap should make it immediately clear what the learner should learn next.

### 3.2 Personalized Daily Plan and Milestones

- Show a clear “Today's Learning Plan” or “Today's Mission” on the dashboard.
- Recommend manageable tasks based on the learner's goal and available time.
- Display milestones and upcoming topics.
- Allow users to mark lessons or tasks as complete.
- Keep the plan connected to the overall roadmap.

### 3.3 In-App Learning

Users should be able to study a roadmap topic without leaving Hoollow to search for basic learning material.

A lesson can contain:
- A concise explanation in beginner-friendly language.
- Examples and key takeaways.
- A recommended video or related learning resource.
- A short quiz or practice activity.
- Actions such as “Explain more simply,” “Give another example,” and “Quiz me.”

Keep lessons short and focused. The MVP may use prepared sample lessons for a supported skill if dynamic content generation is unavailable.

### 3.4 Progress Tracking

- Display overall roadmap completion.
- Show completed lessons and milestones.
- Show the current topic and next recommended action.
- Update progress immediately after a lesson or task is completed.
- Provide clear visual progress indicators, such as a progress bar or ring.

### 3.5 Practice Arena

- Provide short multiple-choice quizzes or skill-specific exercises.
- Show immediate feedback after an answer.
- Explain why an answer is correct or incorrect.
- Track quiz scores and incorrect answers.
- Award XP for meaningful practice and lesson completion.

For the MVP, a small number of well-tested questions is sufficient.

## 4. Gamification

### 4.1 XP Points
- Award XP for completing lessons, quizzes, and milestones.
- Show the learner's total XP.
- Avoid awarding repeated XP for repeatedly clicking the same completion action.

### 4.2 Badges
Examples:
- First Step — complete the first lesson.
- Consistent Learner — maintain a learning streak.
- Practice Pro — complete a set number of practice questions.
- Milestone Master — finish a roadmap milestone.

### 4.3 Daily Streaks
- Track consecutive days with meaningful learning activity.
- Display the current streak.
- Update streaks based on the user's local date.

### 4.4 Levels
- Let learners advance through levels as they earn XP or complete milestones.
- Make level requirements understandable.

### 4.5 Leaderboard and Friendly Competition
- Allow users to compare XP or learning progress with friends or other learners.
- Treat this as a later-stage feature if authentication, shared data, and backend support are not ready.
- Do not fabricate other users or present demo data as real competition.

## 5. Smart Revision System

- Record incorrect quiz answers and topics the learner struggles with.
- Create a “Revise Weak Topics” section.
- Recommend revision activities based on mistakes.
- Reintroduce previously learned concepts for practice.
- Update recommendations as the learner improves.

For the MVP, use quiz mistakes to identify weak topics; a sophisticated spaced-repetition algorithm is not required.

## 6. YouTube Video Recommendations

Recommend relevant YouTube videos for the learner's current roadmap topic.

### Filters
- Topic or search query.
- Duration: Under 5 minutes, 5–15 minutes, 15–30 minutes, or 30+ minutes.
- Preferred language, such as English, Hindi, or Hinglish.
- Difficulty level: Beginner, Intermediate, or Advanced.
- Content type, where it can be reasonably inferred: Quick explanation, full tutorial, or project-based learning.

### Video cards
Show available metadata such as:
- Thumbnail.
- Video title.
- Channel name.
- Duration.
- View count or other popularity signals when available.
- Link to watch the video or open it on YouTube.
- A brief reason it matches the user's topic and preferences.

### Recommendation behaviour
- Prioritize relevance to the current roadmap topic.
- Consider language, duration, difficulty, and popularity.
- Do not rank solely by view count; popularity does not guarantee quality.
- Do not claim that spoken language has been verified when only search-language relevance is known.
- Use real YouTube results when API access is configured.
- If API access is unavailable, use clearly identified sample/demo results or a working YouTube search link rather than fabricated video metadata.

### Implementation note
Use the official YouTube Data API if available. Keep API keys on the server and never expose secret keys in frontend code. For duration filters beyond the API's built-in categories, retrieve video durations and filter them in the application.

## 7. Integrated AI Learning Chatbot

Provide an in-app AI tutor for learning-related questions.

### Capabilities
- Explain concepts in simple language.
- Answer questions about the current topic.
- Give examples and analogies.
- Re-explain content at a different difficulty level.
- Summarize supplied lesson content.
- Generate practice questions and quizzes.
- Give hints before revealing solutions.
- Help learners understand relevant video content when a transcript or notes are available.

### Context
Where possible, give the assistant context about:
- The learner's selected skill.
- Current roadmap milestone and lesson.
- Skill level and learning goal.
- Relevant lesson text or notes.
- Quiz mistakes, when appropriate.

### UI
- Provide a clean chat interface.
- Include suggested prompts such as “Explain more simply,” “Give me an example,” “Quiz me,” and “Give me a hint.”
- Make it clear when a response is being generated.
- Handle errors and missing API configuration gracefully.

### Implementation note
Use one configured AI provider for the MVP. Do not claim the chatbot has watched or understood an entire video unless its transcript or other relevant content has actually been supplied to the model. Keep API keys on the server.

## 8. Suggested App Structure

Use a simple, understandable navigation structure. Adapt it to the chosen framework, but consider:

1. **Dashboard**
   - Welcome message.
   - Current roadmap.
   - Today's mission.
   - Progress and streak.
   - Continue-learning action.

2. **Roadmap**
   - Milestones and ordered lessons.
   - Completion states.
   - Clear next step.

3. **Learn**
   - Lesson content.
   - Recommended videos.
   - Practice quiz.
   - Ask AI action.

4. **AI Tutor**
   - Contextual learning chat.
   - Suggested prompts.

5. **Progress**
   - Completed lessons.
   - XP, badges, streaks, and levels.
   - Weak topics for revision.

If time is limited, combine these into fewer pages or tabs rather than building unnecessary navigation.

## 9. Visual Design Direction

- Use a light theme.
- Prefer a clean, modern, friendly, premium feel.
- Suggested palette:
  - Background: `#FAFAFC`
  - Primary purple: `#6D4AFF`
  - Soft lavender: `#F1EDFF`
  - Success green: `#22A06B`
  - Main text: `#242039`
  - Cards: white with subtle borders.
- Use consistent spacing, rounded cards, clear typography, and restrained shadows.
- Keep screens uncluttered and make the next action visually obvious.
- Design responsive layouts for mobile and desktop.
- Ensure text contrast and keyboard-accessible controls.

## 10. Four-Hour Hackathon MVP Scope

Build a reliable end-to-end flow before implementing every feature.

### Must-have
1. Skill selection and a few learner preferences.
2. Generate or load a structured learning roadmap.
3. Show milestones and today's recommended lesson.
4. Open a lesson with explanation and an example.
5. Complete a short quiz or practice activity.
6. Update roadmap progress.
7. Show relevant YouTube recommendations with basic duration/language filtering.
8. Provide an AI tutor if API setup is available.

### Add if time permits
- XP and one or two badges.
- Daily streak.
- Smart revision based on incorrect answers.
- Levels.
- More advanced video filters.
- Video-aware tutoring based on available transcripts.

### Defer until after the MVP
- Full social leaderboard and friend competition.
- Complex analytics.
- Sophisticated spaced repetition.
- Multi-provider AI selection.
- Large-scale user management or complex backend systems.

## 11. Technical and Product Requirements

- Use the existing project stack if one has already been selected.
- Prefer reusable components and simple data structures.
- Persist progress using the existing backend or, for a small demo, browser storage.
- Keep API secrets on the server.
- Add loading, empty, error, and success states.
- Do not present mock data as real API results.
- Make all visible buttons and controls functional.
- Include a fallback for unavailable AI or YouTube API access.
- Test the full journey from selecting a skill through completing a lesson.
- Keep the implementation focused on a polished demo rather than unnecessary infrastructure.

## 12. Definition of Done

The MVP is ready to demonstrate when a user can:

1. Select a skill, level, and learning goal.
2. View a roadmap with ordered milestones.
3. Identify the next recommended learning action.
4. Open a lesson and learn a concept.
5. Find relevant video recommendations and apply basic filters.
6. Ask the AI tutor a learning question, if AI configuration is available.
7. Complete a practice question or quiz.
8. See progress update and receive a reward where gamification is implemented.
9. Revisit a weak topic for revision, if smart revision is implemented.

## 13. Product Summary

Hoollow is an AI-powered learning companion that turns an overwhelming skill goal into a clear, personalized journey. It combines roadmaps, daily learning plans, in-app lessons, YouTube recommendations, an integrated AI tutor, practice, progress tracking, revision, and gamification.

**Core experience:** Plan → Learn → Practice → Track progress → Revise → Level up.

The guiding principle is simple: at every point, the learner should know what to do next and feel confident taking that step.
