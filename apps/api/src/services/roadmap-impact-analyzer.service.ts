import { IndustryEvent, PrismaClient, RoadmapUpdate } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { aiIndustryAnalysisService, AnalysisOutput } from './ai-industry-analysis.service';
import { env } from '../config/env';
import { roadmapVersioningService } from './roadmap-versioning.service';

export interface ProposedLessonChange {
  action: 'ADD_LESSON' | 'UPDATE_LESSON_CONTENT' | 'UPDATE_RESOURCE' | 'ADD_EXERCISE' | 'NO_CHANGE';
  lessonTitle: string;
  description: string;
  learningObjectives: string[];
  content: string;
  examples: string[];
  keyTakeaways: string[];
  durationMinutes: number;
  targetMilestoneOrder?: number;
  reason: string;
}

export class RoadmapImpactAnalyzerService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Analyzes an industry event and evaluates its impact across all relevant active roadmaps.
   */
  public async analyzeAndPropagateEvent(eventId: string): Promise<{
    event: IndustryEvent;
    analysis: AnalysisOutput;
    proposalsCreated: RoadmapUpdate[];
  }> {
    const event = await this.client.industryEvent.findUnique({
      where: { id: eventId },
      include: {
        skills: { include: { skill: true } },
        source: true,
      },
    });

    if (!event) {
      throw new Error(`Industry event with ID "${eventId}" not found.`);
    }

    // 1. Execute AI/Heuristic Analysis
    const analysis = await aiIndustryAnalysisService.analyzeEvent({
      title: event.title,
      summary: event.summary,
      content: event.content,
      canonicalUrl: event.canonicalUrl,
      sourceName: event.sourceName,
      publishedAt: event.publishedAt,
    });

    // 2. Persist analysis results on the event
    const updatedEvent = await this.client.industryEvent.update({
      where: { id: event.id },
      data: {
        changeType: analysis.changeType,
        importance: analysis.importance,
        confidence: analysis.confidence,
        analysisStatus: analysis.changeType === 'IRRELEVANT' ? 'NO_ACTION' : 'ANALYZED',
        analysisResult: analysis as any,
      },
    });

    if (analysis.changeType === 'IRRELEVANT' || analysis.suggestedAction === 'NO_CHANGE') {
      return { event: updatedEvent, analysis, proposalsCreated: [] };
    }

    // 3. Find candidate roadmaps matching the affected skills
    const roadmaps = await this.client.roadmap.findMany({
      include: {
        learner: true,
        milestones: {
          include: { lessons: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    const webSkills = new Set([
      'react',
      'javascript',
      'typescript',
      'html5',
      'css3',
      'nextjs',
      'nodejs',
      'state-management',
      'web-accessibility',
      'testing',
      'deployment',
    ]);

    const relevantRoadmaps = roadmaps.filter((roadmap) => {
      const roadmapText = `${roadmap.skill} ${roadmap.title} ${roadmap.goal}`.toLowerCase();
      const isWebRoadmap =
        roadmapText.includes('web') ||
        roadmapText.includes('frontend') ||
        roadmapText.includes('fullstack');

      const directMatch = analysis.affectedSkillSlugs.some((slug) => {
        return roadmapText.includes(slug) || roadmapText.includes(slug.replace('-', ' '));
      });

      const categoryMatch =
        isWebRoadmap && analysis.affectedSkillSlugs.some((slug) => webSkills.has(slug));

      return directMatch || categoryMatch;
    });

    const proposalsCreated: RoadmapUpdate[] = [];

    // 4. For each relevant roadmap, evaluate and create proposal
    for (const roadmap of relevantRoadmaps) {
      // Check deduplication: avoid duplicate proposals for same event and roadmap
      const existingUpdate = await this.client.roadmapUpdate.findUnique({
        where: {
          roadmapId_industryEventId: {
            roadmapId: roadmap.id,
            industryEventId: event.id,
          },
        },
      });

      if (existingUpdate) {
        continue;
      }

      // Calculate transparent impact score (0 to 100)
      const impactScore = this.calculateImpactScore(event, analysis, roadmap);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(analysis, impactScore);

      // Generate concrete lesson proposal
      const proposedChanges = this.generateProposedChanges(event, analysis, roadmap);

      // Save proposal in RoadmapUpdate table
      const update = await this.client.roadmapUpdate.create({
        data: {
          roadmapId: roadmap.id,
          industryEventId: event.id,
          proposedChanges: proposedChanges as any,
          rationale: analysis.explanation,
          evidenceReferences: analysis.evidenceReferences,
          impactScore,
          riskLevel,
          approvalStatus: 'PROPOSED',
        },
      });

      proposalsCreated.push(update);

      // 5. Check automated approval policy
      const shouldAutoApply =
        (riskLevel === 'LOW' && env.INDUSTRY_AUTO_APPLY_LOW_RISK) ||
        (riskLevel === 'MEDIUM' && env.INDUSTRY_AUTO_APPLY_MEDIUM_RISK);

      if (shouldAutoApply) {
        await roadmapVersioningService.applyUpdate(update.id);
      }
    }

    return {
      event: updatedEvent,
      analysis,
      proposalsCreated,
    };
  }

  /**
   * Transparent impact evaluation based on source credibility, recency, severity, and skill relevance.
   */
  public calculateImpactScore(
    event: IndustryEvent,
    analysis: AnalysisOutput,
    roadmap: any
  ): number {
    let score = 50; // base score

    // 1. Severity / change type weighting
    if (analysis.importance === 'CRITICAL' || analysis.changeType === 'SECURITY_ADVISORY') {
      score += 35;
    } else if (analysis.importance === 'HIGH' || analysis.changeType === 'BREAKING_CHANGE') {
      score += 25;
    } else if (analysis.importance === 'MEDIUM') {
      score += 15;
    } else {
      score += 5;
    }

    // 2. Confidence weighting
    score += Math.round(analysis.confidence * 10);

    // 3. Recency (events published within last 30 days get bonus)
    const ageInDays = (Date.now() - new Date(event.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays <= 7) {
      score += 10;
    } else if (ageInDays <= 30) {
      score += 5;
    }

    // 4. Target level match
    if (roadmap.currentLevel && analysis.targetLevels.includes(roadmap.currentLevel as any)) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determines risk level for policy automation.
   */
  public determineRiskLevel(analysis: AnalysisOutput, impactScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (analysis.changeType === 'BREAKING_CHANGE' || analysis.importance === 'CRITICAL') {
      return 'HIGH';
    }
    if (analysis.suggestedAction === 'ADD_LESSON' || impactScore >= 75) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Generates structured proposed changes with full lesson content to apply to the roadmap.
   */
  private generateProposedChanges(
    event: IndustryEvent,
    analysis: AnalysisOutput,
    roadmap: any
  ): ProposedLessonChange[] {
    const isBreakingOrRelease =
      analysis.changeType === 'BREAKING_CHANGE' ||
      analysis.changeType === 'NEW_FEATURE' ||
      analysis.changeType === 'SECURITY_ADVISORY';

    if (isBreakingOrRelease) {
      const milestoneCount = roadmap.milestones?.length || 1;
      const targetMilestoneOrder = Math.min(milestoneCount, 2); // target practical or advanced milestone

      return [
        {
          action: 'ADD_LESSON',
          lessonTitle: `Modern Industry Update: ${event.title}`,
          description: `Industry update based on official announcement: "${event.title}". Covers modern patterns, breaking changes, and migration strategies.`,
          learningObjectives: [
            `Understand recent developments and architectural changes in ${event.title}`,
            `Identify best practices and avoid deprecated patterns in production code`,
            `Apply migration techniques safely with automated tests`,
          ],
          content: `### Industry Overview\n\n${event.summary || event.title}\n\n### Why This Matters\n${analysis.explanation}\n\n### Actionable Guidance\nAdopt modern patterns and verify backward compatibility before deploying to production.`,
          examples: [
            `// Modern implementation pattern:\nimport { modernFeature } from 'react';\n// Verified against: ${event.canonicalUrl}`,
          ],
          keyTakeaways: [
            `Review breaking changes and official migration guides before updating dependencies.`,
            `Foundational skills remain essential; new features enhance developer ergonomics.`,
          ],
          durationMinutes: 30,
          targetMilestoneOrder,
          reason: `Industry advancement detected from ${event.sourceName}: ${event.title}`,
        },
      ];
    }

    return [
      {
        action: 'UPDATE_LESSON_CONTENT',
        lessonTitle: `Updated Reference: ${event.title}`,
        description: `Supplementary resource update reflecting modern practices.`,
        learningObjectives: [`Stay current with updated industry guidelines for ${event.title}`],
        content: `### Reference Update\n${event.summary || ''}\n\nSource: ${event.canonicalUrl}`,
        examples: [],
        keyTakeaways: [`Keep learning materials synchronized with official documentation.`],
        durationMinutes: 15,
        targetMilestoneOrder: 1,
        reason: analysis.explanation,
      },
    ];
  }
}

export const roadmapImpactAnalyzerService = new RoadmapImpactAnalyzerService();
