// ---------------------------------------------------
// Wix Velo – Community Startseite (community.js)
// Luxuriöses zweistufiges Gamification-Framework
// ---------------------------------------------------

import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// Backend-Services bündeln Logik (Funktionsweise mit leichten Details)
import {
  getUserProfile,
  getNotifications,
  getUserXPData,
  getGroupXPData,
  logUserAction,
  getQuests,
  getActiveChallenges,
  getNextBadges,
  getTopRanking,
  getTopPosts,
  getTopGroups,
  getSeasonLeaderboard
} from 'backend/xpService.jsw';

$w.onReady(async () => {
  const user = wixUsers.currentUser;
  if (!user.loggedIn) {
    // Optional: Zeige Login-Prompt oder weiterleiten
    $w('#loginPrompt').show();
    return;
  }
  const userId = user.id;

  // 1️⃣ Greeting
  try {
    const profile = await getUserProfile(userId);
    $w('#welcomeTxt').text = `Willkommen zurück, ${profile.nickname}!`;
  } catch (e) {
    console.error('[Greeting] Failed', e);
    $w('#welcomeTxt').text = 'Willkommen in der Community!';
  }

  // 2️⃣ Notifications
  try {
    const notif = await getNotifications(userId);
    $w('#notifTxt').text = notif?.message || 'Keine ungelesenen Nachrichten';
  } catch (e) {
    console.error('[Notifications] Failed', e);
    $w('#notifTxt').text = 'Keine ungelesenen Nachrichten';
  }

  // 3️⃣ User XP & Prestige
  try {
    const xp = await getUserXPData(userId);
    renderProgressRing('#userXpRing', xp.totalXP, xp.nextLevelXP);
    $w('#userLevelText').text = `Level ${xp.level} ${xp.title}`;
    if (xp.prestige > 0) {
      $w('#userPrestigeIcon').show();
      $w('#userPrestigeIcon').tooltip = `Prestige ${xp.prestige}`;
    }
  } catch (e) {
    console.error('[UserXP] Failed', e);
  }

  // 4️⃣ Group XP & Prestige
  try {
    const gxp = await getGroupXPData(userId);
    renderProgressRing('#groupXpRing', gxp.totalXP, gxp.nextLevelXP);
    $w('#groupLevelText').text = `Level ${gxp.level} ${gxp.title}`;
    if (gxp.prestige > 0) {
      $w('#groupPrestigeIcon').show();
      $w('#groupPrestigeIcon').tooltip = `Prestige ${gxp.prestige}`;
    }
  } catch (e) {
    console.error('[GroupXP] Failed', e);
  }

  // 5️⃣ Quests (Daily / Weekly / Monthly)
  try {
    const quests = await getQuests(userId);
    $w('#questRepeater').data = quests;
    $w('#questRepeater').onItemReady(($item, q) => {
      $item('#questName').text = q.name;
      renderMiniRing($item('#questRing'), q.current, q.target);
      $item('#questProgressText').text = `${q.current}/${q.target}`;
    });
  } catch (e) {
    console.error('[Quests] Failed', e);
  }

  // 6️⃣ Active Challenges
  try {
    const challenges = await getActiveChallenges(userId);
    $w('#challengeRepeater').data = challenges;
    $w('#challengeRepeater').onItemReady(($item, c) => {
      $item('#challengeTitle').text = c.title;
      $item('#challengeDue').text = new Date(c.dueDate).toLocaleDateString('de-DE');
    });
  } catch (e) {
    console.error('[Challenges] Failed', e);
  }

  // 7️⃣ Next Badges
  try {
    const nextBadges = await getNextBadges(userId);
    $w('#nextBadgeRepeater').data = nextBadges;
    $w('#nextBadgeRepeater').onItemReady(($item, b) => {
      $item('#badgeImage').src = b.icon;
      $item('#badgeName').text = b.name;
      $item('#badgeTier').text = `Tier ${b.tier}`;
      $item('#badgeItem').onClick(() => wixWindow.openLightbox('badgeDetails', b));
    });
  } catch (e) {
    console.error('[NextBadges] Failed', e);
  }

  // 8️⃣ Season Leaderboard & Top 3 Ranking
  try {
    const [season, top3] = await Promise.all([
      getSeasonLeaderboard(),
      getTopRanking(3)
    ]);
    // Season Leaderboard
    $w('#leaderboardRepeater').data = season;
    $w('#leaderboardRepeater').onItemReady(($item, entry) => {
      $item('#lbPosition').text = `${entry.position}.`;
      $item('#lbName').text = entry.name;
      $item('#lbXP').text = `${entry.xp} XP`;
    });
    // Top3 Highlight
    top3.forEach((u, i) => {
      const slot = $w(`#rank${i+1}`);
      slot.expand();
      $w(`#username${i+1}`).text = `@${u.nickname}`;
      $w(`#pointsTotal${i+1}`).text = `${u.xp} XP`;
      slot.onClick(() => wixLocation.to(`/profil/${u.nickname}`));
    });
  } catch (e) {
    console.error('[Ranking] Failed', e);
  }

  // 9️⃣ Top Posts
  try {
    const posts = await getTopPosts(2);
    $w('#postRptr').data = posts;
    $w('#postRptr').onItemReady(($item, p) => {
      $item('#postTitle').text = p.title;
      let txt = p.content.substring(0, 150) + (p.content.length>150?'...':'');
      $item('#postContent').text = txt;
      $item('#usernamePost').text = `@${p.author}`;
      $item('#userPicPost').src = p.authorPic;
      $item('#usernamePost').onClick(() => wixLocation.to(`/profil/${p.author}`));
    });
  } catch (e) {
    console.error('[TopPosts] Failed', e);
  }

  // 🔟 Top Groups
  try {
    const groups = await getTopGroups(4);
    $w('#groupsRepeater').data = groups;
    $w('#groupsRepeater').onItemReady(($item, g) => {
      $item('#groupImg').src = g.image;
      $item('#groupName').text = g.name;
      $item('#groupDes').text = g.description;
      $item('#groupMembCount').text = g.memberCountText;
      $item('#groupItemBox').onClick(() => wixLocation.to(`/group/${g.slug}/home`));
    });
  } catch (e) {
    console.error('[TopGroups] Failed', e);
  }

  // 🔄 Logout & Profile Navigation
  $w('#profileContainer').onClick(() => wixLocation.to(`/profil/${$w('#welcomeTxt').text.split(', ')[1]}`));
  $w('#logout').onClick(async () => {
    await wixUsers.logout();
    wixLocation.to('/');
  });
});

// ➡️ Hilfsfunktionen
function renderProgressRing(selector, value, max) {
  const comp = $w(selector);
  comp.postMessage({ value, max });
}

function renderMiniRing(htmlComp, value, max) {
  htmlComp.postMessage({ value, max });
}
