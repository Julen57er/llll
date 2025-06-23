// challengeWorker.js
// Geplanter Job (.js) für Wix Studio / Velo: Bewertungs- und Abschluss-Logik für Challenges

import wixData from 'wix-data';
import { addXp as addUserXp } from 'backend/services/xpServiceUsers.web.js';
import { addXp as addGroupXp } from 'backend/services/xpServiceGroups.web.js';

/**
 * scheduledChallengesJob
 * ----------------------
 * Läuft stündlich via Wix Scheduled Jobs und prüft eingereichte Challenges:
 * 1. Findet alle Nutzer- und Gruppen-Submissions, deren timeLimitHours überschritten ist.
 * 2. Setzt Status auf 'Review' und markiert 'Done' oder 'Failed' je nach Score.
 * 3. Vergibt XP an Nutzer und Gruppen entsprechend der ChallengeDef.
 *
 * @returns {Promise<void>}
 */
export async function scheduledChallengesJob() {
  const now = new Date();

  // 1. Alle Challenge-Definitionen abfragen
  const defsRes = await wixData.query('ChallengeDef').find();
  const challengeDefs = defsRes.items;

  for (const def of challengeDefs) {
    // Berechne Deadline-Schwelle
    const threshold = new Date(now.getTime() - def.timeLimitHours * 60 * 60 * 1000);

    // 2a. Nutzer-Submissions, die zur Review anstehen
    const userStatsRes = await wixData.query('ChallengeStatsUsers')
      .eq('challengeId', def._id)
      .eq('state', 'Submission')
      .lt('submittedAt', threshold)
      .find();

    for (const stats of userStatsRes.items) {
      // Beispiel: Bewertung basierend auf contributionScore
      const passed = stats.contributionScore >= 50; // Schwellenwert 50
      stats.state = passed ? 'Done' : 'Failed';
      await wixData.update('ChallengeStatsUsers', stats);

      if (passed) {
        // 3a. XP an Nutzer
        await addUserXp(stats.userId, def.xpRewardUser, `Challenge Completed: ${def.title}`, { challengeId: def._id });
      }
    }

    // 2b. Gruppen-Submissions
    const groupStatsRes = await wixData.query('ChallengeStatsGroups')
      .eq('challengeId', def._id)
      .eq('state', 'Submission')
      .lt('submittedAt', threshold)
      .find();

    for (const stats of groupStatsRes.items) {
      const passed = stats.contributionScore >= 50;
      stats.state = passed ? 'Done' : 'Failed';
      await wixData.update('ChallengeStatsGroups', stats);

      if (passed) {
        // 3b. XP an Gruppe
        await addGroupXp(stats.groupId, def.xpRewardGroup, `Challenge Completed: ${def.title}`, { challengeId: def._id });
      }
    }
  }
}

/**
 * Hinweis:
 * - Dieses Skript sollte stündlich ausgeführt werden, um Deadlines zeitnah zu verarbeiten.
 * - Passe den Schwellenwert für "passed" ggf. dynamisch an oder nutze weitere Kri