import { env } from './config/env';
import { industryMonitorService } from './services/industry-monitor.service';
import { roadmapImpactAnalyzerService } from './services/roadmap-impact-analyzer.service';
import { getPrismaClient } from './lib/prisma';

let isRunning = false;
let isScanning = false;
let timeoutId: NodeJS.Timeout | null = null;

/**
 * Executes a single complete monitoring and event propagation cycle.
 */
export async function executeMonitoringCycle(): Promise<{
  scannedSources: number;
  newEvents: number;
  processedEvents: number;
}> {
  if (isScanning) {
    console.log('[Worker] Previous scan cycle still in progress, skipping overlap.');
    return { scannedSources: 0, newEvents: 0, processedEvents: 0 };
  }

  isScanning = true;
  const prisma = getPrismaClient();

  try {
    console.log('[Worker] Starting industry monitoring scan cycle...');

    // 1. Scan all active industry sources
    const scanResults = await industryMonitorService.scanAllSources();
    const newEventsCount = scanResults.reduce((acc, curr) => acc + curr.newEventsCount, 0);
    console.log(
      `[Worker] Scanned ${scanResults.length} sources. Discovered ${newEventsCount} new events.`
    );

    // 2. Query any pending events for AI/heuristic analysis and roadmap propagation
    const pendingEvents = await prisma.industryEvent.findMany({
      where: { analysisStatus: 'PENDING' },
      take: 20,
    });

    console.log(`[Worker] Found ${pendingEvents.length} pending events to analyze.`);
    let processedCount = 0;

    for (const event of pendingEvents) {
      try {
        console.log(`[Worker] Analyzing event: "${event.title}" (${event.id})...`);
        const result = await roadmapImpactAnalyzerService.analyzeAndPropagateEvent(event.id);
        console.log(
          `[Worker] Analyzed "${event.title}": ${result.analysis.changeType} - created ${result.proposalsCreated.length} roadmap update proposals.`
        );
        processedCount++;
      } catch (err: any) {
        console.error(`[Worker] Failed processing event "${event.id}":`, err.message);
        await prisma.industryEvent.update({
          where: { id: event.id },
          data: { analysisStatus: 'FAILED' },
        });
      }
    }

    console.log('[Worker] Monitoring scan cycle completed successfully.');
    return {
      scannedSources: scanResults.length,
      newEvents: newEventsCount,
      processedEvents: processedCount,
    };
  } finally {
    isScanning = false;
  }
}

/**
 * Worker main loop with configured polling interval and graceful shutdown.
 */
export async function startWorker(): Promise<void> {
  console.log('=====================================================');
  console.log('  Hoollow Industry Intelligence Background Worker    ');
  console.log('=====================================================');
  console.log(`Status: Initializing (Polling interval: ${env.INDUSTRY_SCAN_INTERVAL_MINUTES}m)`);
  console.log(`Monitoring Enabled: ${env.INDUSTRY_MONITOR_ENABLED}`);

  if (!env.INDUSTRY_MONITOR_ENABLED) {
    console.log('[Worker] Industry monitor disabled via configuration. Exiting.');
    return;
  }

  isRunning = true;

  // Graceful shutdown signals
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Initiating graceful shutdown...`);
    isRunning = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const prisma = getPrismaClient();
    await prisma.$disconnect();
    console.log('[Worker] Disconnected from database. Worker terminated gracefully.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Run initial cycle
  await executeMonitoringCycle();

  // Schedule recurring loop
  const intervalMs = env.INDUSTRY_SCAN_INTERVAL_MINUTES * 60 * 1000;
  const scheduleNext = () => {
    if (!isRunning) return;
    timeoutId = setTimeout(async () => {
      try {
        await executeMonitoringCycle();
      } catch (err) {
        console.error('[Worker] Unexpected error during monitoring cycle:', err);
      } finally {
        scheduleNext();
      }
    }, intervalMs);
  };

  scheduleNext();
}

// Start worker if invoked directly as CLI entrypoint
if (require.main === module) {
  startWorker().catch((err) => {
    console.error('[Worker] Fatal startup error:', err);
    process.exit(1);
  });
}
