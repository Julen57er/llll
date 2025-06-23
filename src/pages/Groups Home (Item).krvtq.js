// ================================================================================================
// VOLLSTÄNDIGER CODE FÜR DIE GRUPPENDETAILSEITE (ITEM PAGE)
// Finale, korrigierte und vollständig kommentierte Version
// ================================================================================================

// Importiert notwendige Wix-Module
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { local as wixLocal } from 'wix-storage';

// Globale Variable für die _id des Nutzers aus der 'Import414'-Kollektion
let currentUserImport414Id = null;

// ================================================================================================
// START: KONSTANTEN
// ================================================================================================

// Badge-ID für den allerersten Gruppenbeitritt eines NUTZERS
const FIRST_GROUP_JOIN_BADGE_ID_FOR_USER = "1d4c2a51-c3e5-44b4-ae81-2c21297c9985"; 

// Konstanten für GRUPPEN-Meilensteine bei Mitgliederzahlen
const FIRST_MEMBER_BADGE_ID_FOR_GROUP = "0e5a69d7-abff-4fb6-a977-c77f9263991e"; 
const XP_FOR_FIRST_MEMBER_MILESTONE = 10; 
const XP_FOR_2_MEMBERS_MILESTONE = 10; 
const BADGE_ID_FIRST_TRIBE = "1e4352d7-97d6-40d3-add3-350a68b7ee6a"; 
const XP_FOR_5_MEMBERS_MILESTONE = 20; 
const BADGE_ID_DOUBLE_DIGITS = "0a5c3737-d931-4fb9-8592-f1df4d01a13d";
const XP_FOR_10_MEMBERS_MILESTONE = 30; 
const BADGE_ID_GROWING_TOGETHER = "9900c948-76f3-4b68-81ef-1e19879d227e";
const XP_FOR_25_MEMBERS_MILESTONE = 50; 
const BADGE_ID_SOCIAL_CIRCLE = "e73321d4-17bd-45cc-8506-ee7ee3c0ae3c";
const XP_FOR_50_MEMBERS_MILESTONE = 100; 
const BADGE_ID_100_MEMBERS = "1d15abf8-b0ce-4427-a5dc-dc9ba85339bf"; 
const XP_FOR_100_MEMBERS_MILESTONE = 150; 

// Konfigurationsobjekt für die iterativ geprüften Mitglieder-Meilensteine
const MEMBER_MILESTONES_CONFIG = [
    { count: 2, xp: XP_FOR_2_MEMBERS_MILESTONE, badgeId: null, reason: "Milestone: 2 members reached", badgeReason: null },
    { count: 5, xp: XP_FOR_5_MEMBERS_MILESTONE, badgeId: BADGE_ID_FIRST_TRIBE, reason: "Milestone: 5 members ('First Tribe')", badgeReason: "Milestone: Group formed its First Tribe (5 members)" },
    { count: 10, xp: XP_FOR_10_MEMBERS_MILESTONE, badgeId: BADGE_ID_DOUBLE_DIGITS, reason: "Milestone: 10 members ('Double Digits')", badgeReason: "Milestone: Group hit Double Digits (10 members)" },
    { count: 25, xp: XP_FOR_25_MEMBERS_MILESTONE, badgeId: BADGE_ID_GROWING_TOGETHER, reason: "Milestone: 25 members ('Growing Together')", badgeReason: "Milestone: Group is Growing Together (25 members)" },
    { count: 50, xp: XP_FOR_50_MEMBERS_MILESTONE, badgeId: BADGE_ID_SOCIAL_CIRCLE, reason: "Milestone: 50 members ('Social Circle')", badgeReason: "Milestone: Group formed a Social Circle (50 members)" },
    { count: 100, xp: XP_FOR_100_MEMBERS_MILESTONE, badgeId: BADGE_ID_100_MEMBERS, reason: "Milestone: 100 members ('One Hundred Club')", badgeReason: "Milestone: Group joined the One Hundred Club (100 members)" }
];

// XP-Schwellenwerte für Levelaufstiege
const LEVEL_THRESHOLDS = [ 
    0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 13000,
    16000, 20000, 24000, 29000, 34000, 40000, 46000, 53000, 60000,
    68000, 76000, 85000, 94000, 103000, 113000, 124000, 136000,
    149000, 163000, 178000, 194000, 211000, 229000, 248000, 268000,
    289000, 311000, 334000, 358000, 383000, 409000, 436000, 464000,
    493000, 523000, 554000, 586000, 619000, 653000
];

// Konstanten für die Kriterientypen der Badges
const CRITERIA_MEMBER_COUNT = "MEMBER_COUNT";
const CRITERIA_POST_COUNT = "POST_COUNT";
const CRITERIA_COMMENT_COUNT = "COMMENT_COUNT";
const CRITERIA_GROUP_LEVEL_REACHED = "GROUP_LEVEL_REACHED";
const CRITERIA_CONSECUTIVE_POSTING_DAYS_STREAK = "CONSECUTIVE_POSTING_DAYS_STREAK";
const CRITERIA_CONSECUTIVE_ACTIVITY_DAYS_STREAK = "CONSECUTIVE_ACTIVITY_DAYS_STREAK";
const CRITERIA_CHALLENGES_COMPLETED = "GROUP_CHALLENGES_COMPLETED_COUNT";
const CRITERIA_MEMBER_PROJECTS = "MEMBER_PROJECTS_LAUNCHED_COUNT";
const CRITERIA_GROUP_FOUNDED = "GROUP_FOUNDED";
const CRITERIA_DAYS_SINCE_CREATION = "DAYS_SINCE_CREATION";
// ================================================================================================
// ENDE: KONSTANTEN
// ================================================================================================


// ================================================================================================
// START: GLOBALE FUNKTIONEN
// Alle Funktionen sind jetzt global (außerhalb von $w.onReady), um Scope-Fehler zu vermeiden.
// ================================================================================================

// --- HILFSFUNKTIONEN FÜR UI UND DATEN-HANDHABUNG ---
function getMemberCount(membersString) { 
    if (!membersString || typeof membersString !== 'string' || membersString.trim() === "") return 0;
    const memberIds = membersString.split(',').map(id => id.trim()).filter(id => id !== "");
    return memberIds.length;
}
function privacyLabel(privacyValue) { 
    if (typeof privacyValue === "string") {
        if (privacyValue.toLowerCase() === "private") return "Private Group";
        if (privacyValue.toLowerCase() === "public") return "Public Group";
    }
    return "Group"; 
}
function populateHeader(groupData) { 
    if (!groupData || !groupData._id) { console.warn("[PopulateHeader WARN] Ungültige groupData erhalten."); return; }
    const groupImageElement = $w("#groupImage");
    if (groupImageElement.type) { groupImageElement.src = groupData.image; groupImageElement.alt = groupData.title || "Group Image"; }
    const groupTitleElement = $w("#groupTitle");
    if (groupTitleElement.type) { groupTitleElement.text = groupData.title || "Untitled Group"; }
    const privacyMembersElement = $w("#privacyMembers");
    if (privacyMembersElement.type) {
        let privacyString = privacyLabel(groupData.privacy);
        const memberCount = getMemberCount(groupData.members); 
        let memberCountString = memberCount === 1 ? "1 Member" : `${memberCount} Members`;
        privacyMembersElement.text = `${privacyString} • ${memberCountString}`;
    } else { console.warn("#privacyMembers Element nicht auf der Seite gefunden."); }
}
function populatePrivateContainer(groupData) { 
    if (!groupData || !groupData._id) return; 
    const groupPrivateContainer = $w("#groupPrivate");
    if (!groupPrivateContainer.type) { console.warn("#groupPrivate Container nicht gefunden."); return; }
    const imgPriv = $w("#groupImgPriv");
    if (imgPriv.type && groupData.image) { imgPriv.src = groupData.image; imgPriv.alt = groupData.title || "Group Image"; }
    const namePriv = $w("#groupNamePriv");
    if (namePriv.type) { namePriv.text = groupData.title || "Untitled Group"; }
    const privMembers = $w("#groupPrivacyMembersPriv");
    if (privMembers.type) {
        let privacyString = privacyLabel(groupData.privacy);
        const memberCount = getMemberCount(groupData.members); 
        let memberCountString = memberCount === 1 ? "1 Member" : `${memberCount} Members`;
        privMembers.text = `${privacyString} • ${memberCountString}`;
    }
    const reqBtn = $w("#reqBtnPriv");
    if (reqBtn.type) { 
        reqBtn.label = "Request Membership"; reqBtn.enable();
        reqBtn.onClick(async () => { reqBtn.label = "Requested"; reqBtn.disable(); });
    }
}
function updatePrivateContainer(groupData) { 
    if (!groupData || !groupData._id) return;
    const groupPrivateContainer = $w("#groupPrivate");
    if (!groupPrivateContainer.type) { console.warn("#groupPrivate Container nicht gefunden."); return; }
    const isPrivate = (typeof groupData.privacy === "string" && groupData.privacy.toLowerCase() === "private");
    const membersString = groupData.members || "";
    const memberIds = membersString.split(',').map(id => id.trim()).filter(id => id !== "");
    const isMember = currentUserImport414Id && memberIds.includes(currentUserImport414Id);
    if (isPrivate && !isMember) { groupPrivateContainer.expand(); populatePrivateContainer(groupData); } 
    else { groupPrivateContainer.collapse(); }
}

// --- FUNKTIONEN ZUR FORTSCHRITTSERMITTLUNG FÜR "NÄCHSTE BADGES" ---
async function getGroupPostCount(groupId) {
    if (!groupId) { console.warn("[NextBadges] getGroupPostCount: groupId fehlt."); return 0; }
    try {
        const result = await wixData.query("GroupPosts").eq("groupId", groupId).count();
        console.log(`[NextBadges DEBUG] getGroupPostCount für ${groupId}: ${result}`);
        return result;
    } catch (e) { console.error(`[NextBadges ERROR] Fehler beim Zählen der Gruppenposts für Gruppe ${groupId}:`, e); return 0; }
}
async function getGroupCommentCount(groupId) {
    if (!groupId) { console.warn("[NextBadges] getGroupCommentCount: groupId fehlt."); return 0; }
    try {
        const result = await wixData.query("comments").eq("groupId", groupId).count();
        console.log(`[NextBadges DEBUG] getGroupCommentCount für ${groupId}: ${result}`);
        return result;
    } catch (e) { console.error(`[NextBadges ERROR] Fehler beim Zählen der Gruppenkommentare für Gruppe ${groupId}:`, e); return 0; }
}
async function getGroupLevelFromXP(groupId) {
    if (!groupId) { console.warn("[NextBadges] getGroupLevelFromXP: groupId fehlt."); return 1; }
    try {
        const groupXpRes = await wixData.query("groupXP").eq("groupRef", groupId).limit(1).find();
        if (groupXpRes.items.length > 0) {
            const level = groupXpRes.items[0].level || 1;
            console.log(`[NextBadges DEBUG] getGroupLevelFromXP für ${groupId}: ${level}`);
            return level;
        }
        console.log(`[NextBadges DEBUG] getGroupLevelFromXP: Kein groupXP Eintrag für ${groupId}, Level ist 1.`);
        return 1; 
    } catch (e) { console.error(`[NextBadges ERROR] Fehler beim Abrufen des Gruppenlevels für ${groupId}:`, e); return 1; }
}
async function getConsecutivePostingDaysStreakForGroup(groupId) {
    if (!groupId) { console.warn("[NextBadges] getConsecutivePostingDaysStreakForGroup: groupId fehlt."); return 0; }
    try {
        const postsResult = await wixData.query("GroupPosts").eq("groupId", groupId).descending("_createdDate").limit(1000).find();
        if (!postsResult.items || postsResult.items.length === 0) return 0;
        const uniquePostDaysTimestamps = [...new Set(postsResult.items.map(post => new Date(new Date(post._createdDate).getFullYear(), new Date(post._createdDate).getMonth(), new Date(post._createdDate).getDate()).getTime()))].sort((a, b) => a - b);
        if (uniquePostDaysTimestamps.length === 0) return 0;
        let currentStreak = 0; let today = new Date(); today.setHours(0,0,0,0);
        let yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let lastDayInStreak = 0;
        const mostRecentPostDayTimestamp = uniquePostDaysTimestamps[uniquePostDaysTimestamps.length - 1];
        if (mostRecentPostDayTimestamp === today.getTime() || mostRecentPostDayTimestamp === yesterday.getTime()) {
            currentStreak = 1; lastDayInStreak = mostRecentPostDayTimestamp;
            for (let i = uniquePostDaysTimestamps.length - 2; i >= 0; i--) {
                const currentPostDayTimestamp = uniquePostDaysTimestamps[i];
                const expectedPreviousDay = new Date(lastDayInStreak); expectedPreviousDay.setDate(expectedPreviousDay.getDate() - 1);
                if (currentPostDayTimestamp === expectedPreviousDay.getTime()) { currentStreak++; lastDayInStreak = currentPostDayTimestamp; } 
                else { break; }
            }
        }
        console.log(`[NextBadges DEBUG] getConsecutivePostingDaysStreakForGroup für ${groupId}: ${currentStreak}`);
        return currentStreak;
    } catch (e) { console.error(`[NextBadges ERROR] Fehler bei getConsecutivePostingDaysStreakForGroup für ${groupId}:`, e); return 0; }
}
async function getGroupChallengesCompletedCount(groupId) {
    if (!groupId) { console.warn("[NextBadges] getGroupChallengesCompletedCount: groupId fehlt."); return 0; }
    try {
        const result = await wixData.query("GroupProjects").eq("groupId", groupId).eq("status", "completed").count();
        console.log(`[NextBadges DEBUG] getGroupChallengesCompletedCount für ${groupId}: ${result}`);
        return result;
    } catch (e) { console.error(`[NextBadges ERROR] Fehler beim Zählen abgeschlossener Challenges für ${groupId}:`, e); return 0; }
}
async function getMemberProjectsLaunchedCount(groupId, currentGroupData) {
    if (!groupId || !currentGroupData || !currentGroupData.members) { console.warn("[NextBadges] getMemberProjectsLaunchedCount: groupId oder currentGroupData.members fehlt."); return 0; }
    const memberIds = getMemberCount(currentGroupData.members) > 0 ? (currentGroupData.members || "").split(',').map(id => id.trim()).filter(id => id !== "") : [];
    if (memberIds.length === 0) { console.log(`[NextBadges DEBUG] getMemberProjectsLaunchedCount: Gruppe ${groupId} hat keine Mitglieder.`); return 0; }
    try {
        const result = await wixData.query("GroupProjects").hasSome("creator", memberIds).count();
        console.log(`[NextBadges DEBUG] getMemberProjectsLaunchedCount für Gruppe ${groupId}: ${result}`);
        return result;
    } catch (e) { console.error(`[NextBadges ERROR] Fehler bei getMemberProjectsLaunchedCount für Gruppe ${groupId}:`, e); return 0; }
}
function getDaysSinceCreation(groupCreatedDateString) {
    if (!groupCreatedDateString) return 0;
    try {
        const creationDate = new Date(groupCreatedDateString);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - creationDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (e) { console.error("[NextBadges ERROR] Fehler bei getDaysSinceCreation:", e); return 0; }
}
// ================================================================================================
// START: NEUE FUNKTIONEN FÜR "TOP MITGLIEDER DER WOCHE"
// ================================================================================================

/**
 * Befüllt die UI für die Top-3-Mitglieder.
 * @param {Array<object>} topUsers Ein Array mit den Top-3-Nutzerobjekten.
 * Jedes Objekt sollte { userId, nickname, totalXp } enthalten.
 */
// ERSETZE die bestehende displayTopMembersUI Funktion mit dieser Version

/**
 * Befüllt die UI für die Top-3-Mitglieder und macht die Rang-Container klickbar,
 * sodass sie zum jeweiligen Nutzerprofil weiterleiten.
 * @param {Array<object>} topUsers Ein Array mit den Top-3-Nutzerobjekten.
 */
function displayTopMembersUI(topUsers) {
    // Definiert die UI-Elemente für jeden Rangplatz.
    const rankSlots = [
        { container: $w("#rank1"), userEl: $w("#username1"), pointsEl: $w("#pointsTotal1") },
        { container: $w("#rank2"), userEl: $w("#username2"), pointsEl: $w("#pointsTotal2") },
        { container: $w("#rank3"), userEl: $w("#username3"), pointsEl: $w("#pointsTotal3") }
    ];
    
    // Verberge zuerst alle Rang-Container, um sie dann gezielt einzublenden.
    rankSlots.forEach(slot => { if(slot.container.type) slot.container.collapse() });

    if (topUsers && topUsers.length > 0) {
        // Wenn Top-Nutzer vorhanden sind, zeige den Hauptcontainer.
        if($w("#rankCon").type) $w("#rankCon").expand();
        
        // Gehe durch die Top-Nutzer und befülle die entsprechenden UI-Slots.
        topUsers.forEach((user, index) => {
            if (index < rankSlots.length) {
                const slot = rankSlots[index];
                if (slot.container.type && slot.userEl.type && slot.pointsEl.type) {
                    slot.userEl.text = `@${user.nickname}`;
                    slot.pointsEl.text = `Total Points: ${user.totalXp} Points`;
                    
                    // =======================================================================
                    // NEU: onClick-Handler für den Container hinzufügen
                    // =======================================================================
                    // Prüfen, ob ein gültiger Nickname vorhanden ist, um eine gültige URL zu erstellen.
                    if (user.nickname && user.nickname !== "Unknown User" && user.nickname !== "Anonymous") {
                        const profileUrl = `https://luxelinkonline.wixstudio.com/llll/profil/${user.nickname}`;
                        
                        // Setze das Klick-Ereignis für den Container des jeweiligen Rangs.
                        slot.container.onClick(() => {
                            wixLocation.to(profileUrl);
                        });

                        // HINWEIS FÜR BESSERE UX: Setze den Cursor im Wix Editor für die Elemente
                        // #rank1, #rank2, und #rank3 auf "Pointer (Hand)", damit Nutzer sehen, dass sie klickbar sind.
                        // Das geht am einfachsten, indem man ihnen im Editor einen Platzhalter-Link gibt.
                    } else {
                        // Wenn kein gültiger Nickname vorhanden ist, mache den Container nicht klickbar,
                        // um Fehler zu vermeiden. Ein leerer onClick-Handler entfernt ggf. alte Handler.
                        slot.container.onClick(() => {}); 
                    }
                    // =======================================================================
                    
                    slot.container.expand(); // Mache den befüllten Rangplatz sichtbar.
                }
            }
        });
    } else {
        // Wenn keine Top-Nutzer gefunden wurden, sorge dafür, dass der Hauptcontainer verborgen ist.
        if($w("#rankCon").type) $w("#rankCon").collapse();
    }
}
/**
 * Ermittelt die Top 3 Mitglieder einer Gruppe basierend auf den in den letzten 7 Tagen
 * verdienten XP und aktualisiert die entsprechende UI-Anzeige.
 * @param {string} groupId Die _id der aktuellen Gruppe.
 */
async function populateTopMembersOfTheWeek(groupId) {
    console.log(`[TopMembers] Starte Ermittlung der Top-Mitglieder der Woche für Gruppe: ${groupId}`);
    const rankCon = $w("#rankCon");
    if (!rankCon.type) {
        console.error("[TopMembers ERROR] Hauptcontainer #rankCon nicht gefunden.");
        return;
    }

    try {
        // Schritt 1: Berechne das Datum für "vor 7 Tagen".
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Um den ganzen Tag zu umfassen

        // Schritt 2: Frage alle relevanten XPLog-Einträge ab.
        const logResults = await wixData.query("XPLog")
            .eq("groupRef", groupId)            // Nur Einträge für DIESE Gruppe.
            .ge("_createdDate", sevenDaysAgo)   // Nur Einträge der letzten 7 Tage.
            .gt("xpDelta", 0)                   // Nur positive XP-Gewinne berücksichtigen.
            .limit(1000)                        // Performance-Schutzwall.
            .find();
            
        console.log(`[TopMembers DEBUG] ${logResults.items.length} relevante XPLog-Einträge gefunden.`);

        if (logResults.items.length === 0) {
            console.log("[TopMembers INFO] Keine Punktevergabe in den letzten 7 Tagen. Ranking wird verborgen.");
            rankCon.collapse();
            return;
        }

        // Schritt 3: Fasse die Punkte pro Nutzer (_owner) zusammen.
        const userXpTotals = {}; // Objekt zur Speicherung der Punktesummen, z.B. { "userId1": 150, "userId2": 90 }
        logResults.items.forEach(item => {
            const userId = item._owner; // Der Nutzer, der den Eintrag erstellt hat.
            const xp = item.xpDelta;
            if (userId && xp) { // Stelle sicher, dass beide Werte vorhanden sind.
                userXpTotals[userId] = (userXpTotals[userId] || 0) + xp;
            }
        });

        const userIds = Object.keys(userXpTotals);
        console.log(`[TopMembers DEBUG] XP für ${userIds.length} einzelne Nutzer aggregiert.`);

        if (userIds.length === 0) {
            console.log("[TopMembers INFO] Keine Nutzer mit Punkten gefunden.");
            rankCon.collapse();
            return;
        }

        // Schritt 4: Hole die Nicknames für die gefundenen Nutzer-IDs.
        const userProfiles = await wixData.query("Import414")
            .hasSome("memberId", userIds) // 'memberId' muss die Wix User ID (_owner) sein.
            .find();
        
        // Erstelle eine "Landkarte" von userId zu nickname für einfachen Zugriff.
        const userIdToNicknameMap = {};
        userProfiles.items.forEach(profile => {
            userIdToNicknameMap[profile.memberId] = profile.nickname || "Anonymous";
        });
        console.log("[TopMembers DEBUG] Nicknames für die qualifizierten Nutzer geladen.");

        // Schritt 5: Erstelle ein Array mit den vollständigen Nutzerdaten für die Rangliste.
        const rankedUsers = userIds.map(userId => ({
            userId: userId,
            nickname: userIdToNicknameMap[userId] || "Unknown User",
            totalXp: userXpTotals[userId]
        }));
        
        // Schritt 6: Sortiere die Nutzer nach ihren verdienten Punkten (absteigend).
        rankedUsers.sort((a, b) => b.totalXp - a.totalXp);
        
        // Schritt 7: Nimm die Top 3.
        const top3Users = rankedUsers.slice(0, 3);
        console.log("[TopMembers INFO] Top 3 Nutzer der Woche:", top3Users);

        // Schritt 8: Zeige die Ergebnisse in der UI an.
        displayTopMembersUI(top3Users);

    } catch (error) {
        console.error("[TopMembers CRITICAL ERROR] Fehler beim Ermitteln der Top-Mitglieder:", error);
        rankCon.collapse(); // Bei Fehler den Bereich ausblenden.
    }
}
// ================================================================================================
// ENDE: NEUE FUNKTIONEN FÜR "TOP MITGLIEDER DER WOCHE"
// ================================================================================================

// --- HAUPTFUNKTIONEN FÜR GAMIFICATION ---
async function getCurrentGroupId() { 
    const currentGroupItem = $w("#groupDataset").getCurrentItem();
    if (currentGroupItem && currentGroupItem._id && typeof currentGroupItem._id === 'string' && currentGroupItem._id.trim() !== '') {
        return currentGroupItem._id;
    }
    console.warn("[GruppenSystem] getCurrentGroupId: Konnte Gruppen-ID nicht über #groupDataset.getCurrentItem() beziehen oder ID ist ungültig.");
    return null;
}
async function initializeAndDisplayGroupXP(groupId) { 
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === "") {
        console.error(`[GruppenXP ERROR] initializeAndDisplayGroupXP: Ungültige groupId übergeben: '${groupId}' (Typ: ${typeof groupId}). Abbruch.`);
        if (typeof $w !== 'undefined' && $w("#groupProgress").type && typeof $w("#groupProgress").collapse === 'function') {
            $w("#groupProgress").collapse();
        }
        return;
    }
    console.log(`[GruppenXP INFO] initializeAndDisplayGroupXP gestartet für groupId: ${groupId}`);
    const groupLevelThresholds = LEVEL_THRESHOLDS;
    try {
        let groupXpEntry;
        console.log(`[GruppenXP INFO] Suche nach bestehendem groupXP Eintrag für groupRef: ${groupId}`);
        const xpQueryResult = await wixData.query("groupXP").eq("groupRef", groupId).limit(1).find();
        if (xpQueryResult.items.length > 0) {
            groupXpEntry = xpQueryResult.items[0];
            console.log(`[GruppenXP INFO] Bestehenden groupXP Eintrag gefunden für groupId ${groupId}: ID ${groupXpEntry._id}, Ref ${groupXpEntry.groupRef}, XP ${groupXpEntry.totalXP}, Level ${groupXpEntry.level}`);
            if (groupXpEntry.groupRef !== groupId) {
                console.error(`[GruppenXP CRITICAL] Inkonsistenz! Gefundener Eintrag ${groupXpEntry._id} hat groupRef ${groupXpEntry.groupRef}, aber abgefragt wurde für ${groupId}.`);
            }
        } else {
            console.log(`[GruppenXP INFO] Kein groupXP Eintrag für groupId ${groupId} gefunden. Erstelle neuen Eintrag mit 0 XP.`);
            if (!groupId || typeof groupId !== 'string' || groupId.trim() === "") {
                 console.error(`[GruppenXP CRITICAL] initializeAndDisplayGroupXP: groupId wurde UNGÜLTIG ('${groupId}') direkt vor dem Insert! Abbruch des Inserts.`);
                 return; 
            }
            const newGroupXpData = { groupRef: groupId, totalXP: 0, level: 1 };
            console.log(`[GruppenXP INFO] Daten für neuen groupXP Eintrag (initialize):`, JSON.stringify(newGroupXpData));
            const insertedItem = await wixData.insert("groupXP", newGroupXpData, { suppressHooks: true });
            groupXpEntry = insertedItem;
            console.log(`[GruppenXP SUCCESS] Neuen groupXP Eintrag erstellt: ID ${groupXpEntry._id}, Ref ${groupXpEntry.groupRef}`);
            const newXpLogData = { groupRef: groupId, xpDelta: 0, reasonLabel: "Group XP Account Created" };
            await wixData.insert("XPLog", newXpLogData, { suppressHooks: true });
            console.log(`[GruppenXP INFO] XPLog-Eintrag für Kontoerstellung der Gruppe ${groupId} hinzugefügt.`);
        }
        if (!groupXpEntry || !groupXpEntry._id) {
            console.error(`[GruppenXP CRITICAL] groupXpEntry ist ungültig nach Query/Insert für groupId ${groupId}. Abbruch der UI-Aktualisierung.`);
            if (typeof $w !== 'undefined' && $w("#groupProgress").type && typeof $w("#groupProgress").collapse === 'function') { $w("#groupProgress").collapse(); }
            return;
        }
        const totalXP = groupXpEntry.totalXP || 0;
        let dbLevel = groupXpEntry.level || 1; 
        let calculatedLevel = groupLevelThresholds.findIndex(xpThreshold => totalXP < xpThreshold);
        if (calculatedLevel === -1 && totalXP >= groupLevelThresholds[groupLevelThresholds.length -1]) calculatedLevel = groupLevelThresholds.length;
        else if (calculatedLevel === -1) calculatedLevel = 1;
        if (calculatedLevel === 0 && totalXP >= groupLevelThresholds[0]) calculatedLevel = 1;
        if (calculatedLevel < 1) calculatedLevel = 1;
        if (dbLevel !== calculatedLevel || groupXpEntry.totalXP !== totalXP) {
            console.log(`[GruppenXP INFO] Level/XP von Gruppe <span class="math-inline">\{groupId\} wird in DB synchronisiert\. DB\: L</span>{dbLevel}/<span class="math-inline">\{groupXpEntry\.totalXP\}XP\. Berechnet\: L</span>{calculatedLevel}/${totalXP}XP.`);
            const updatePayload = { _id: groupXpEntry._id, level: calculatedLevel, totalXP: totalXP };
            if (!groupXpEntry.groupRef && groupId) { updatePayload.groupRef = groupId; console.warn(`[GruppenXP WARN] Fehlende groupRef in groupXP Eintrag ${groupXpEntry._id} für Gruppe ${groupId} wurde beim Update ergänzt.`); }
            await wixData.update("groupXP", updatePayload, { suppressHooks: true });
            console.log(`[GruppenXP SUCCESS] groupXP Eintrag für Gruppe ${groupId} synchronisiert.`);
            groupXpEntry.level = calculatedLevel; 
            groupXpEntry.totalXP = totalXP;
        }
        const currentLevelForDisplay = groupXpEntry.level; 
        const xpForCurrentLevelStart = groupLevelThresholds[currentLevelForDisplay - 1] || 0;
        const xpForNextLevelStart = (currentLevelForDisplay < groupLevelThresholds.length) ? groupLevelThresholds[currentLevelForDisplay] : totalXP;
        let progressPercentage = 0;
        if (xpForNextLevelStart > xpForCurrentLevelStart) {
            progressPercentage = (totalXP - xpForCurrentLevelStart) / (xpForNextLevelStart - xpForCurrentLevelStart);
        } else if (currentLevelForDisplay >= groupLevelThresholds.length) { progressPercentage = 1; }
        if ($w("#groupProgress").type && $w("#groupLVL").type && $w("#pip").type && $w("#progressBar").type) {
            $w("#groupProgress").expand(); $w("#groupLVL").text = `Level ${currentLevelForDisplay}`;
            if (currentLevelForDisplay < groupLevelThresholds.length) { $w("#pip").text = `${totalXP} / ${xpForNextLevelStart}P`; } 
            else { $w("#pip").text = `${totalXP}P (Max Level)`; }
            $w("#progressBar").value = progressPercentage * 100;
        } else { console.warn("[GruppenXP WARN] UI-Elemente für Gruppen-Fortschrittsanzeige nicht gefunden."); }
    } catch (err) {
        console.error(`[GruppenXP ERROR] Kritischer Fehler in initializeAndDisplayGroupXP für Gruppe ${groupId}:`, err, err.stack);
        if (typeof $w !== 'undefined' && $w("#groupProgress").type && typeof $w("#groupProgress").collapse === 'function') { $w("#groupProgress").collapse(); }
    }
}
async function addGroupXP(groupId, xpAmount, reason) { 
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === "") {
        console.error(`[GruppenXP ERROR] addGroupXP: Ungültige groupId: '${groupId}'. Abbruch.`); return false;
    }
    if (typeof xpAmount !== 'number') {
        console.error(`[GruppenXP ERROR] addGroupXP: Ungültiger xpAmount: '${xpAmount}'. Abbruch.`); return false;
    }
    console.log(`[GruppenXP INFO] addGroupXP: Gestartet für groupId: ${groupId}, Betrag: ${xpAmount}, Grund: ${reason}`);
    const groupLevelThresholds = LEVEL_THRESHOLDS;
    try {
        console.log(`[GruppenXP INFO] Suche nach bestehendem groupXP Eintrag für groupRef (addGroupXP): ${groupId}`);
        const xpQueryResult = await wixData.query("groupXP").eq("groupRef", groupId).limit(1).find();
        if (xpQueryResult.items.length === 0) {
            console.error(`[GruppenXP CRITICAL] addGroupXP: Kein groupXP Eintrag für Gruppe ${groupId} gefunden! XP können nicht hinzugefügt werden. Initialisierung beim Seitenaufbau prüfen.`);
            return false; 
        }
        let groupXpEntry = xpQueryResult.items[0];
        console.log(`[GruppenXP INFO] Bestehenden groupXP Eintrag gefunden (ID: ${groupXpEntry._id}, Ref: ${groupXpEntry.groupRef}) für groupId ${groupId}.`);
        if (groupXpEntry.groupRef !== groupId) {
            console.error(`[GruppenXP CRITICAL] Inkonsistenz in addGroupXP! Gefundener Eintrag ${groupXpEntry._id} hat groupRef ${groupXpEntry.groupRef}, aber Update ist für ${groupId}. Abbruch.`);
            return false;
        }
        const newTotalXP = (groupXpEntry.totalXP || 0) + xpAmount;
        await wixData.insert("XPLog", { groupRef: groupId, xpDelta: xpAmount, reasonLabel: reason }, { suppressHooks: true });
        console.log(`[GruppenXP INFO] XPLog-Eintrag für Gruppe <span class="math-inline">\{groupId\} \(</span>{reason}, ${xpAmount}XP) hinzugefügt.`);
        let newCalculatedLevel = groupLevelThresholds.findIndex(xpThreshold => newTotalXP < xpThreshold);
        if (newCalculatedLevel === -1 && newTotalXP >= groupLevelThresholds[groupLevelThresholds.length -1]) newCalculatedLevel = groupLevelThresholds.length;
        else if (newCalculatedLevel === -1) newCalculatedLevel = groupXpEntry.level || 1;
        if (newCalculatedLevel === 0 && newTotalXP >= groupLevelThresholds[0]) newCalculatedLevel = 1;
        if (newCalculatedLevel < 1) newCalculatedLevel = 1;
        const updateData = { _id: groupXpEntry._id, totalXP: newTotalXP, level: newCalculatedLevel, groupRef: groupId };
        console.log(`[GruppenXP INFO] Aktualisiere groupXP Eintrag ${groupXpEntry._id} mit Daten:`, JSON.stringify(updateData));
        await wixData.update("groupXP", updateData, { suppressHooks: true });
        console.log(`[GruppenXP SUCCESS] groupXP Eintrag für Gruppe ${groupId} aktualisiert.`);
        await initializeAndDisplayGroupXP(groupId); 
        return true;
    } catch (err) {
        console.error(`[GruppenXP ERROR] Kritischer Fehler in addGroupXP für Gruppe ${groupId} (Grund: ${reason}, Betrag: ${xpAmount}):`, err, err.stack);
        return false;
    }
}
async function awardBadgeToGroup(groupId, badgeId, reasonForLog) { 
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === "" || !badgeId || typeof badgeId !== 'string' || badgeId.trim() === "") {
        console.error("[GruppenBadges ERROR] awardBadgeToGroup: groupId oder badgeId ungültig.", {groupId, badgeId});
        return false;
    }
    try {
        const existingBadgeResult = await wixData.query("GroupVerdienteBadges").eq("groupRef", groupId).eq("badgeId_ref", badgeId).limit(1).find();
        if (existingBadgeResult.items.length === 0) {
            await wixData.insert("GroupVerdienteBadges", { groupRef: groupId, badgeId_ref: badgeId }, { suppressHooks: true });
            console.log(`[GruppenBadges SUCCESS] Badge ${badgeId} an Gruppe ${groupId} verliehen.`);
            if (reasonForLog) { 
                await wixData.insert("XPLog", { groupRef: groupId, xpDelta: 0, reasonLabel: reasonForLog }, { suppressHooks: true });
            }
            return true; 
        } else {
            console.log(`[GruppenBadges INFO] Gruppe ${groupId} besitzt Badge ${badgeId} bereits.`);
            return false; 
        }
    } catch (error) {
        console.error(`[GruppenBadges ERROR] Fehler beim Verleihen von Badge ${badgeId} an Gruppe ${groupId}:`, error);
        return false;
    }
}
async function checkAndAwardMemberMilestones(groupId, newTotalMemberCount) {
    if (!groupId || typeof newTotalMemberCount !== 'number') {
        console.error("[Milestones ERROR] Ungültige Parameter für checkAndAwardMemberMilestones", { groupId, newTotalMemberCount });
        return;
    }
    console.log(`[Milestones INFO] Prüfe Mitglieder-Meilensteine für Gruppe ${groupId} mit ${newTotalMemberCount} Mitgliedern.`);
    for (const milestone of MEMBER_MILESTONES_CONFIG) { 
        if (newTotalMemberCount >= milestone.count) { 
            if (milestone.badgeId) { 
                console.log(`[Milestones INFO] Prüfe Meilenstein (Badge): "${milestone.reason}" für ${milestone.count} Mitglieder.`);
                const badgeNewlyAwarded = await awardBadgeToGroup(groupId, milestone.badgeId, milestone.badgeReason);
                if (badgeNewlyAwarded && milestone.xp > 0) { 
                    await addGroupXP(groupId, milestone.xp, milestone.reason); 
                }
            } else { 
                console.log(`[Milestones INFO] Prüfe Meilenstein (XP-Only): "${milestone.reason}" für ${milestone.count} Mitglieder.`);
                const logCheckResult = await wixData.query("XPLog").eq("groupRef", groupId).eq("reasonLabel", milestone.reason).limit(1).find();
                if (logCheckResult.items.length === 0 && milestone.xp > 0) { 
                    await addGroupXP(groupId, milestone.xp, milestone.reason);
                } else if (logCheckResult.items.length > 0) {
                     console.log(`[Milestones INFO] XP für "${milestone.reason}" bereits an Gruppe ${groupId} vergeben.`);
                }
            }
        }
    }
}
// ERSETZE die bestehende populateNextBadgesRepeater Funktion mit dieser Version

// ERSETZE die bestehende populateNextBadgesRepeater Funktion mit dieser optimierten Version.

/**
 * Lädt Badge-Definitionen, filtert bereits verdiente, berechnet Fortschritt parallel,
 * sortiert und befüllt den "Nächste Badges"-Repeater. Zeigt währenddessen eine Ladeanzeige.
 * @param {string} currentGroupId Die _id der aktuellen Gruppe.
 * @param {object} currentGroupData Das Datenobjekt der aktuellen Gruppe.
 */
// ERSETZE die bestehende populateNextBadgesRepeater Funktion mit dieser Version

/**
 * Lädt Badge-Definitionen, filtert bereits verdiente UND zu 100% erfüllte Badges heraus,
 * berechnet den Fortschritt, sortiert und befüllt den "Nächste Badges"-Repeater.
 * @param {string} currentGroupId Die _id der aktuellen Gruppe.
 * @param {object} currentGroupData Das Datenobjekt der aktuellen Gruppe.
 */
// ERSETZE die bestehende populateNextBadgesRepeater Funktion mit dieser Version

/**
 * Lädt und zeigt die nächsten 3 Badges an, die die Gruppe verdienen kann.
 * Verwendet eine Ladeanimation und parallele Datenabfragen für bessere Performance.
 * @param {string} currentGroupId Die _id der aktuellen Gruppe.
 * @param {object} currentGroupData Das Datenobjekt der aktuellen Gruppe.
 */
async function populateNextBadgesRepeater(currentGroupId, currentGroupData) {
    // Strenge Prüfung der Eingabeparameter.
    if (!currentGroupId || !currentGroupData) {
        console.error("[NextBadges ERROR] populateNextBadgesRepeater: currentGroupId oder currentGroupData fehlt.");
        if ($w("#achievementsContainer").type) $w("#achievementsContainer").collapse();
        return;
    }
    console.log(`[NextBadges INFO] Starte Ladevorgang für nächste Badges für Gruppe: ${currentGroupId}`);

    // UI-Elemente für die Steuerung der Anzeige.
    const container = $w("#achievementsContainer");
    const loader = $w("#achievementsLoader"); // ‼️ Dein Lade-Element
    const repeater = $w("#achievementRptr");

    // Ladezustand initialisieren: Container und Loader anzeigen, Repeater verbergen.
    if (container.type && container.collapsed) container.expand();
    if (loader.type) loader.show();
    if (repeater.type) repeater.collapse();

    try {
        // --- Schritt 1: Alle notwendigen Basisdaten parallel abfragen ---
        const [badgeDefResults, earnedBadgesResults] = await Promise.all([
            wixData.query("groupBadgesDef").find(),
            wixData.query("GroupVerdienteBadges").eq("groupRef", currentGroupId).find()
        ]);
        
        if (!badgeDefResults || !badgeDefResults.items) {
             throw new Error("'groupBadgesDef'-Kollektion konnte nicht geladen oder ist leer.");
        }
        
        const allBadgeDefs = badgeDefResults.items;
        const earnedBadgeIds = earnedBadgesResults.items.map(b => b.badgeId_ref);
        const unearnedBadges = allBadgeDefs.filter(def => !def.hidden && !earnedBadgeIds.includes(def._id)); // def.hidden hinzugefügt

        console.log(`[NextBadges DEBUG] ${unearnedBadges.length} sichtbare, unverdiente Badges gefunden.`);

        if (unearnedBadges.length === 0) {
            console.log(`[NextBadges INFO] Keine unverdienten Badges mehr für Gruppe.`);
            if (repeater.type) repeater.data = []; // Repeater leeren
            return; // Funktion hier beenden, 'finally' wird trotzdem ausgeführt.
        }

        // --- Schritt 2: Fortschrittsdaten parallel abfragen ---
        const progressData = await Promise.all([
            getGroupPostCount(currentGroupId),
            getGroupCommentCount(currentGroupId),
            getGroupLevelFromXP(currentGroupId),
            getConsecutivePostingDaysStreakForGroup(currentGroupId),
            getGroupChallengesCompletedCount(currentGroupId),
            getMemberProjectsLaunchedCount(currentGroupId, currentGroupData)
        ]).then(([postCount, commentCount, groupLevel, postingStreak, challengesCompleted, memberProjects]) => {
            return { postCount, commentCount, groupLevel, postingStreak, challengesCompleted, memberProjects };
        });
        
        console.log("[NextBadges DEBUG] Alle Fortschrittsdaten parallel geladen:", progressData);

        // --- Schritt 3: Fortschritt für jedes Badge mit den geladenen Daten berechnen ---
        let badgesWithProgress = [];
        for (const badgeDef of unearnedBadges) {
            let currentProgressValue = 0;
            const criteriaType = badgeDef.criteriaType;
            const targetValue = Number(badgeDef.targetValue);

            switch (criteriaType) {
                case CRITERIA_MEMBER_COUNT: currentProgressValue = getMemberCount(currentGroupData.members); break;
                case CRITERIA_POST_COUNT: currentProgressValue = progressData.postCount; break;
                case CRITERIA_COMMENT_COUNT: currentProgressValue = progressData.commentCount; break;
                case CRITERIA_GROUP_LEVEL_REACHED: currentProgressValue = progressData.groupLevel; break;
                case CRITERIA_CONSECUTIVE_POSTING_DAYS_STREAK: currentProgressValue = progressData.postingStreak; break;
                case CRITERIA_CHALLENGES_COMPLETED: currentProgressValue = progressData.challengesCompleted; break;
                case CRITERIA_MEMBER_PROJECTS: currentProgressValue = progressData.memberProjects; break;
                case CRITERIA_DAYS_SINCE_CREATION: currentProgressValue = getDaysSinceCreation(currentGroupData._createdDate); break;
                // Weitere Fälle hier hinzufügen, falls nötig...
                default: currentProgressValue = 0;
            }

            let progressPercentage = 0;
            if (targetValue > 0) {
                 const clampedProgress = Math.min(currentProgressValue, targetValue);
                 progressPercentage = (clampedProgress / targetValue) * 100;
            }
            
            // Füge nur Badges hinzu, deren Fortschritt unter 100% liegt.
            if (progressPercentage < 100) {
                badgesWithProgress.push({
                    ...badgeDef,
                    progressPercentage: Math.round(progressPercentage),
                    targetValueActual: targetValue || 1 
                });
            } else {
                 console.log(`[NextBadges INFO] Badge "${badgeDef.badgeName}" wird nicht angezeigt (100% erreicht).`);
            }
        }
        
        // --- Schritt 4: Sortieren und UI vorbereiten ---
        badgesWithProgress.sort((a, b) => {
            if (a.progressPercentage > b.progressPercentage) return -1;
            if (a.progressPercentage < b.progressPercentage) return 1;
            if (a.targetValueActual < b.targetValueActual) return -1;
            if (a.targetValueActual > b.targetValueActual) return 1;
            return 0;
        });

        const nextThreeBadges = badgesWithProgress.slice(0, 3);
        console.log(`[NextBadges INFO] Top 3 nächste Badges für Repeater ausgewählt.`);
        
        if (repeater.type) {
            repeater.data = nextThreeBadges;
        }

    } catch (error) {
        console.error("[NextBadges CRITICAL ERROR] Schwerwiegender Fehler in populateNextBadgesRepeater:", error, error.stack);
        if (repeater.type) repeater.data = []; // Bei Fehler den Repeater leeren
    } finally {
        // --- Aufräumen: Dieser Block wird IMMER ausgeführt ---
        console.log("[NextBadges INFO] Aufräumen: Ladeanzeige wird ausgeblendet.");
        
        if (loader.type) loader.hide(); // Loader immer ausblenden.

        // Repeater anzeigen, wenn er Daten hat, sonst den ganzen Container verbergen.
        if (repeater.type && repeater.data && repeater.data.length > 0) {
            repeater.expand();
        } else {
            if (container.type) container.collapse();
        }
    }
}

async function handleFirstGroupJoin(import414Id) {
    if (!import414Id || typeof import414Id !== 'string' || import414Id.trim() === "") {
        console.error(`[UserXP ERROR] handleFirstGroupJoin: Ungültige import414Id: '${import414Id}'. Abbruch.`); return;
    }
    console.log(`[UserXP INFO] handleFirstGroupJoin: Gestartet für import414Id: ${import414Id}`);
    try {
        const badgeEarnedQuery = await wixData.query("NutzerVerdienteBadges").eq("userId", import414Id).eq("badgeId_ref", FIRST_GROUP_JOIN_BADGE_ID_FOR_USER).limit(1).find();
        if (badgeEarnedQuery.items.length === 0) {
            console.log(`[UserXP INFO] User ${import414Id} hat Badge ${FIRST_GROUP_JOIN_BADGE_ID_FOR_USER} noch nicht.`);
            const badgeDef = await wixData.get("BadgeDefinitionen", FIRST_GROUP_JOIN_BADGE_ID_FOR_USER);
            if (!badgeDef) { console.error(`[UserXP CRITICAL] BadgeDefinition ${FIRST_GROUP_JOIN_BADGE_ID_FOR_USER} nicht gefunden!`); return; }
            const points = badgeDef.pointsAwarded ?? 0;
            const badgeDescription = badgeDef.description ?? "Erster Gruppenbeitritt"; 
            console.log(`[UserXP INFO] Für Badge ${FIRST_GROUP_JOIN_BADGE_ID_FOR_USER} Punkte: ${points}`);
            if (typeof points !== 'number') { console.error(`[UserXP CRITICAL] pointsAwarded für Badge ${FIRST_GROUP_JOIN_BADGE_ID_FOR_USER} ist keine Zahl: ${badgeDef.pointsAwarded}.`); return; }
            let userXpDoc, userFullName = "", userPrestige = 0;
            console.log(`[UserXP INFO] Suche UserXP für userRef: ${import414Id}`);
            let userXPQueryResults = await wixData.query("UserXP").eq("userRef", import414Id).limit(1).find();
            console.log(`[UserXP INFO] UserXP Query für '${import414Id}' ergab ${userXPQueryResults.items.length} Treffer.`);
            if (userXPQueryResults.items.length === 0) {
                console.log(`[UserXP INFO] Kein UserXP für ${import414Id}. Erstelle initialen Eintrag.`);
                try {
                    const userProfile = await wixData.get("Import414", import414Id);
                    if (userProfile) userFullName = [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ").trim();
                } catch (e) { console.warn(`[UserXP WARN] Name für neuen UserXP (User ${import414Id}) nicht geladen: ${e.message}`);}
                const newUserXpData = { userRef: import414Id, totalXP: 0, level: 1, prestige: 0, title: userFullName };
                console.log(`[UserXP INFO] Daten für NEUEN initialen UserXP (User ${import414Id}):`, JSON.stringify(newUserXpData));
                userXpDoc = await wixData.insert("UserXP", newUserXpData, { suppressHooks: true });
                console.log(`[UserXP SUCCESS] Initialer UserXP für ${import414Id} ERSTELLT (ID: ${userXpDoc._id}).`);
            } else {
                userXpDoc = userXPQueryResults.items[0];
                console.log(`[UserXP INFO] Bestehender UserXP für ${import414Id} (ID: ${userXpDoc._id}, Ref: ${userXpDoc.userRef}, XP: ${userXpDoc.totalXP}).`);
                if (userXpDoc.userRef !== import414Id) { console.error(`[UserXP CRITICAL] Inkonsistenz! UserXP <span class="math-inline">\{userXpDoc\.\_id\} hat userRef '</span>{userXpDoc.userRef}', erwartet '${import414Id}'. Abbruch.`); return; }
                userFullName = userXpDoc.title || ""; userPrestige = userXpDoc.prestige || 0;
            }
            const currentTotalXP = userXpDoc.totalXP || 0; 
            const newTotalXPAfterAddingPoints = currentTotalXP + points;
            let newCalculatedLevel = LEVEL_THRESHOLDS.findIndex(xpThreshold => newTotalXPAfterAddingPoints < xpThreshold);
            if (newCalculatedLevel === -1 && newTotalXPAfterAddingPoints >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length -1]) newCalculatedLevel = LEVEL_THRESHOLDS.length;
            else if (newCalculatedLevel === -1) newCalculatedLevel = userXpDoc.level || 1;
            if (newCalculatedLevel === 0 && newTotalXPAfterAddingPoints >= LEVEL_THRESHOLDS[0]) newCalculatedLevel = 1; 
            if (newCalculatedLevel < 1) newCalculatedLevel = 1;
            const updatePayload = { _id: userXpDoc._id, userRef: import414Id, totalXP: newTotalXPAfterAddingPoints, level: newCalculatedLevel, prestige: userPrestige, title: userFullName };
            console.log(`[UserXP INFO] Daten für UserXP UPDATE (User ${import414Id}, Item ${userXpDoc._id}):`, JSON.stringify(updatePayload));
            await wixData.update("UserXP", updatePayload, { suppressHooks: true });
            console.log(`[UserXP SUCCESS] UserXP für ${import414Id} AKTUALISIERT.`);
            if (points > 0) { 
                await wixData.insert("XPLog", { userRef: import414Id, xpDelta: points, reasonLabel: badgeDescription }, { suppressHooks: true });
                console.log(`[UserXP INFO] XPLog für User <span class="math-inline">\{import414Id\} \(</span>{points}XP, "${badgeDescription}") eingetragen.`);
            }
            await wixData.insert("NutzerVerdienteBadges", { userId: import414Id, badgeId_ref: FIRST_GROUP_JOIN_BADGE_ID_FOR_USER }, { suppressHooks: true });
            console.log(`[UserXP INFO] Badge ${FIRST_GROUP_JOIN_BADGE_ID_FOR_USER} für User ${import414Id} eingetragen.`);
            console.log(`[UserXP SUCCESS] Verarbeitung für User <span class="math-inline">\{import414Id\} \(Badge\: '</span>{badgeDescription}', Punkte: ${points}) abgeschlossen.`);
        } else { console.log(`[UserXP INFO] User ${import414Id} hat Badge ${FIRST_GROUP_JOIN_BADGE_ID_FOR_USER} bereits.`); }
    } catch (error) { console.error(`[UserXP CRITICAL ERROR] Fehler in handleFirstGroupJoin für ${import414Id}:`, error, error.stack); }
}
async function joinGroup(groupData) { 
    if (!groupData || !groupData._id) { console.error("[JoinGroup ERROR] Ungültige groupData."); return; }
    const groupId = groupData._id;
    const joinButton = $w("#joinBtn");
    if (!joinButton.type) { console.error("[JoinGroup ERROR] #joinBtn nicht gefunden."); return; }
    joinButton.disable(); joinButton.label = "Joining...";
    if (!currentUserImport414Id) {
        console.error("[JoinGroup ERROR] Beitritt fehlgeschlagen: Import414 ID fehlt.");
        joinButton.label = "Login required"; joinButton.enable();
        if (!wixUsers.currentUser.loggedIn) wixUsers.promptLogin({ mode: "login" });
        return;
    }
    try {
        const groupRecord = await wixData.get("Groups", groupId);
        let currentMembersString = groupRecord.members || "";
        let memberIdArray = currentMembersString.split(',').map(id => id.trim()).filter(id => id !== "");
        const countBeforeAdding = memberIdArray.length;
        const warSchonMitglied = memberIdArray.includes(currentUserImport414Id);
        if (!warSchonMitglied) {
            memberIdArray.push(currentUserImport414Id);
            groupRecord.members = memberIdArray.join(',');
            await wixData.update("Groups", groupRecord, { suppressHooks: true });
            console.log(`[JoinGroup INFO] Nutzer ${currentUserImport414Id} zur Gruppe ${groupId} hinzugefügt.`);
            if (countBeforeAdding === 0) { 
                console.log(`[GruppenSystem INFO] Meilenstein: Erstes Mitglied für Gruppe ${groupId}.`);
                await addGroupXP(groupId, XP_FOR_FIRST_MEMBER_MILESTONE, "Milestone: First member joined");
                await awardBadgeToGroup(groupId, FIRST_MEMBER_BADGE_ID_FOR_GROUP, "Milestone: Group received its first member");
            }
            await handleFirstGroupJoin(currentUserImport414Id);
            const updatedGroupAfterJoin = await wixData.get("Groups", groupId); 
            const newTotalMemberCount = getMemberCount(updatedGroupAfterJoin.members); 
            await checkAndAwardMemberMilestones(groupId, newTotalMemberCount);
        } else { console.log(`[JoinGroup INFO] Nutzer ${currentUserImport414Id} war bereits Mitglied.`); }
        const finalGroupState = await wixData.get("Groups", groupId); 
        populateHeader(finalGroupState); await setupJoinButton(finalGroupState); updatePrivateContainer(finalGroupState);
        await populateNextBadgesRepeater(groupId, finalGroupState);
    } catch (error) {
        console.error(`[JoinGroup ERROR] Fehler beim Beitreten zu ${groupId}:`, error, error.stack);
        joinButton.label = "Error Joining"; joinButton.enable();
    }
}
async function leaveGroup(groupData) { 
    if (!groupData || !groupData._id) { console.error("[LeaveGroup ERROR] Ungültige groupData."); return; }
    const groupId = groupData._id;
    const joinButton = $w("#joinBtn");
    if (!joinButton.type) { console.error("[LeaveGroup ERROR] #joinBtn nicht gefunden."); return;}
    joinButton.disable(); joinButton.label = "Leaving...";
    if (!currentUserImport414Id) { console.error("[LeaveGroup ERROR] User Import414 ID fehlt."); joinButton.label = "Error"; joinButton.enable(); return; }
    try {
        const groupRecord = await wixData.get("Groups", groupId);
        let currentMembersString = groupRecord.members || "";
        let memberIdArray = currentMembersString.split(',').map(id => id.trim()).filter(id => id !== "" && id !== currentUserImport414Id);
        groupRecord.members = memberIdArray.join(',');
        await wixData.update("Groups", groupRecord, { suppressHooks: true });
        console.log(`[LeaveGroup INFO] Nutzer ${currentUserImport414Id} aus Gruppe ${groupId} entfernt.`);
        const updatedGroup = await wixData.get("Groups", groupId);
        populateHeader(updatedGroup);
        await setupJoinButton(updatedGroup);
        updatePrivateContainer(updatedGroup);
        await populateNextBadgesRepeater(groupId, updatedGroup);
    } catch (error) { 
        console.error(`[LeaveGroup ERROR] Fehler beim Verlassen der Gruppe ${groupId}:`, error, error.stack); 
        joinButton.label = "Error Leaving"; joinButton.enable(); 
    }
}
async function setupJoinButton(groupData) { 
    if (!groupData || !groupData._id) {
             console.warn("[SetupJoinButton WARN] Ungültige groupData.");
             if ($w("#joinBtn").type) { $w("#joinBtn").disable(); $w("#joinBtn").label = "N/A"; }
            return;
    }
    const joinButton = $w("#joinBtn");
    if (!joinButton.type) { console.error("[SetupJoinButton ERROR] #joinBtn nicht gefunden."); return; }
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        joinButton.label = "Login to Join";
        joinButton.onClick(() => { wixUsers.promptLogin({ mode: "login" }); });
        joinButton.enable(); return; 
    }
    if (!currentUserImport414Id) { 
        console.log("[SetupJoinButton INFO] Warte auf currentUserImport414Id...");
        joinButton.label = "Loading User..."; joinButton.disable(); return;
    }
    joinButton.disable(); 
    const membersString = groupData.members || "";
    const memberIds = membersString.split(',').map(id => id.trim()).filter(id => id !== "");
    joinButton.onClick(() => {}); // Reset
    if (memberIds.includes(currentUserImport414Id)) {
        joinButton.label = "Leave"; 
        joinButton.onClick(async () => { await leaveGroup(groupData); });
    } else {
        joinButton.label = "+ Join"; 
        joinButton.onClick(async () => { await joinGroup(groupData); });
    }
    joinButton.enable();
}

$w.onReady(async function () { 
    const user = wixUsers.currentUser;
    if (!user.loggedIn) {
        console.log("[OnReady INFO] Kein Nutzer eingeloggt. Zeige Login-Aufforderung auf Join-Button.");
        const joinButton = $w("#joinBtn");
        if (joinButton.type) {
            joinButton.label = "Login to Join";
            joinButton.onClick(() => { wixUsers.promptLogin({ mode: "login" }); });
            joinButton.enable();
        }
        // UI für Gäste initialisieren
        $w("#groupDataset").onReady(async () => { 
            const currentGroup = $w("#groupDataset").getCurrentItem();
            if (currentGroup && currentGroup._id) {
                populateHeader(currentGroup);
                await initializeAndDisplayGroupXP(currentGroup._id);
                await populateNextBadgesRepeater(currentGroup._id, currentGroup);
            }
        });
        return; // Beende die onReady-Funktion für Gäste hier.
    }
    const wixUserId = user.id;

    // Initialisierung für eingeloggte Nutzer
    try {
        const results = await wixData.query("Import414").eq("memberId", wixUserId).limit(1).find();
        if (results.items.length > 0) {
            currentUserImport414Id = results.items[0]._id;
            console.log("[OnReady INFO] Import414 ID des Nutzers gefunden:", currentUserImport414Id);
        } else { 
            console.warn("[OnReady WARN] Eingeloggter Nutzer nicht in 'Import414'-Kollektion gefunden.");
        }
    } catch (err) { 
        console.error("[OnReady ERROR] Fehler beim Abrufen der Import414 ID:", err); 
    }

// Diesen Block in deiner $w.onReady Funktion ersetzen oder einfügen

// Dieser Code gehört in deine $w.onReady Funktion.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion auf der Gruppendetailseite.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion auf der Gruppendetailseite.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion auf der Gruppendetailseite.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

// Dieser Code gehört in deine $w.onReady Funktion.
// Er ersetzt den bestehenden onItemReady-Block für den Repeater #achievementRptr.

const achievementRepeaterElement = $w("#achievementRptr");
if (achievementRepeaterElement.type) {
    achievementRepeaterElement.onItemReady(($item, itemData) => {
        
        const badgeName = itemData.badgeName;
        const taskDescription = itemData.task;

        console.log(`[NextBadges Repeater] Lade Item: "${badgeName}"`);
        
        // Aufgabe/Titel im Repeater setzen
        const taskElement = $item("#task");
        if (taskElement.type) {
            taskElement.text = taskDescription || "Unbenanntes Achievement"; 
        }
        
        // Badge-Icon setzen
        const badgeIconElement = $item("#badgeIcon"); 
        if (badgeIconElement.type) {
            if (itemData.badgeIcon) { 
                badgeIconElement.src = itemData.badgeIcon;
                badgeIconElement.show();
            } else {
                badgeIconElement.hide();
            }
        }

        // ===============================================================
        // KORREKTUR: Fortschrittsbalken und Prozentanzeige
        // ===============================================================

        // Fortschrittsbalken #progress2 direkt mit dem berechneten Prozentwert setzen.
        const progressElement = $item("#progress2");
        if (progressElement.type) {
            // Der Wert ist bereits eine Zahl zwischen 0 und 100.
            progressElement.value = itemData.progressPercentage;
        }

        // Prozenttext in #pip2 setzen.
        const pipElement = $item("#pip2"); 
        if (pipElement.type) { 
            pipElement.text = `${itemData.progressPercentage}%`; 
        }
        // ===============================================================

        // Klick-Handler für die Lightbox
        const clickableBox = $item("#box213");
        if (clickableBox.type) {
            clickableBox.onClick(() => {
                const dataToPass = {
                    name: badgeName,
                    taskDescription: taskDescription,
                    pointsAwarded: itemData.xp,
                    icon: itemData.badgeIcon,
                    debug_badgeId: itemData._id
                };
                wixWindow.openLightbox("badgeCriteria-LB", dataToPass);
            });
        }
    });
} else {
    console.error("[OnReady ERROR] Repeater #achievementRptr nicht auf der Seite gefunden.");
}

    $w("#groupDataset").onReady(async () => { 
        const currentGroup = $w("#groupDataset").getCurrentItem(); 
        if (currentGroup && currentGroup._id && typeof currentGroup._id === 'string' && currentGroup._id.trim() !== '') {
            const groupId = currentGroup._id;
            console.log(`[DatasetOnReady INFO] Aktuelle Gruppe geladen: "${currentGroup.title}", ID: ${groupId}`);
            
            populateHeader(currentGroup);
            updatePrivateContainer(currentGroup);
            await setupJoinButton(currentGroup); 
            await initializeAndDisplayGroupXP(groupId);
            await populateNextBadgesRepeater(groupId, currentGroup);
            await populateTopMembersOfTheWeek(groupId);

        } else {
            console.error("[DatasetOnReady ERROR] Gruppendaten konnten nicht geladen werden oder Gruppen-ID ist ungültig.");
            if ($w("#groupTitle").type) $w("#groupTitle").text = "Group not found";
            if ($w("#achievementsContainer").type) $w("#achievementsContainer").collapse();
        }
    });
});



// ==============================================================================================
// POSTS-REPEATER – Version 4.4 (Velo-JS compliant)
//  ✦ entfernt TypeScript-Casting  ("as [...][]") → keine Parsing-Error mehr
// ==============================================================================================
// Quick-Check-Liste:
//   • GroupPosts.author enthält _id der Import414-Collection
//   • GroupPosts erlaubt Update (oder Backend-Proxy für Likes)
// ==============================================================================================

// ==============================================================================================
// POSTS-REPEATER – Version 4.4 (Velo‑JS compliant)
//  ✦ entfernt TypeScript‑Casting  ("as [...][]") → keine Parsing‑Error mehr
// ==============================================================================================
// Quick‑Check‑Liste:
//   • GroupPosts.author enthält _id der Import414‑Collection
//   • GroupPosts erlaubt Update (oder Backend‑Proxy für Likes)
// ==============================================================================================



/* -------------------------------------------------- */
/* 1) Zeit-Helper („x minutes ago“)                   */
/* -------------------------------------------------- */
function timeSince(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  const spans = [
    { label: 'year',   secs: 31536000 },
    { label: 'month',  secs: 2592000  },
    { label: 'day',    secs: 86400    },
    { label: 'hour',   secs: 3600     },
    { label: 'minute', secs: 60       },
    { label: 'second', secs: 1        }
  ];
  for (const { label, secs } of spans) {
    const n = Math.floor(s / secs);
    if (n >= 1) return `${n} ${label}${n !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/* -------------------------------------------------- */
/* 2) HALT-Helper  →  ersetzt evt.stopPropagation()   */
/* -------------------------------------------------- */
const halt = (e) => {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
};

/* -------------------------------------------------- */
/* 3) Author-Info (Import414 → MediaAssets)           */
/* -------------------------------------------------- */
const authorCache = new Map();
async function fetchAuthorInfo(importId) {
  if (!importId) return { nickname: 'User', profilePicture: null };
  if (authorCache.has(importId)) return authorCache.get(importId);

  try {
    const doc = await wixData.get('Import414', importId);
    let pic   = doc.profilePicture || null;

    if (!pic) {
      const m = await wixData.query('MediaAssets')
        .eq('memberRef', importId)
        .descending('_createdDate').limit(1).find();
      if (m.items.length) pic = m.items[0].profilePicture || null;
    }

    const info = { nickname: doc.nickname || 'User', profilePicture: pic };
    authorCache.set(importId, info);
    return info;
  } catch {
    const fb = { nickname: 'User', profilePicture: null };
    authorCache.set(importId, fb); return fb;
  }
}

/* -------------------------------------------------- */
/* 4) Follow-Button                                   */
/* -------------------------------------------------- */
async function setupFollowButton($btn, targetImportId) {
  if (!$btn?.type || !targetImportId) return;

  const { currentUser } = wixUsers;
  if (!currentUser.loggedIn) { $btn.collapse(); return; }

  const viewerMemberId = currentUser.id;
  const res = await wixData.query('Import414')
    .eq('memberId', viewerMemberId).limit(1).find();
  if (!res.items.length) { $btn.collapse(); return; }

  const viewerImportId = res.items[0]._id;
  if (viewerImportId === targetImportId) { $btn.collapse(); return; }

  let isFollowing = await wixData.query('Follows')
    .eq('followerId', viewerImportId).eq('targetId', targetImportId)
    .count().then(c => c > 0).catch(() => false);

  $btn.label = isFollowing ? 'Unfollow' : 'Follow';
  $btn.expand();

  $btn.onClick(async (evt) => {
    halt(evt);                                    // ← ersetzt stopPropagation()
    if (typeof $btn.disable === 'function') $btn.disable();
    try {
      if (isFollowing) {
        const del = await wixData.query('Follows')
          .eq('followerId', viewerImportId).eq('targetId', targetImportId)
          .limit(1).find();
        if (del.items.length) await wixData.remove('Follows', del.items[0]._id);
      } else {
        await wixData.insert('Follows', {
          followerId: viewerImportId, targetId: targetImportId, _createdDate: new Date()
        });
      }
      isFollowing = !isFollowing;
      $btn.label  = isFollowing ? 'Unfollow' : 'Follow';
    } catch (e) { console.error('[FollowBtn]', e); }
    if (typeof $btn.enable === 'function') $btn.enable();
  });
}

/* -------------------------------------------------- */
/* 5) Like-Button                                     */
/* -------------------------------------------------- */
const isVector = ($el) => $el && 'src' in $el;
const incl     = (arr, v) => Array.isArray(arr) && arr.includes(v);

async function setupLikeButton($icon, $cnt, post, viewerImportId) {
  if (!$icon?.type || !$cnt?.type || !post?._id || !viewerImportId) return;

  const oSrc = isVector($icon) ? $icon.src : null;
  const fSrc = isVector($icon) && oSrc?.includes('outline') ? oSrc.replace('outline', 'filled') : oSrc;

  const render = (arr) => {
    const liked = incl(arr, viewerImportId);
    if (isVector($icon) && fSrc) $icon.src = liked ? fSrc : oSrc;
    else if ('label' in $icon)   $icon.label = liked ? '♥' : '♡';
    $cnt.text = String(arr.length);
  };
  render(post.likedBy || []);

  $icon.onClick(async (evt) => {
    halt(evt);                                    // ← ersetzt stopPropagation()
    if (typeof $icon.disable === 'function') $icon.disable();
    try {
      const fresh = await wixData.get('GroupPosts', post._id, { suppressAuth: true });
      let arr     = Array.isArray(fresh.likedBy) ? [...fresh.likedBy] : [];
      incl(arr, viewerImportId)
        ? arr = arr.filter(i => i !== viewerImportId)
        : arr.push(viewerImportId);
      fresh.likedBy = arr; fresh.likes = arr.length;
      await wixData.update('GroupPosts', fresh, { suppressHooks: true });
      post.likedBy = arr; post.likes = arr.length;
      render(arr);
    } catch (e) { console.error('[LikeBtn]', e); }
    if (typeof $icon.enable === 'function') $icon.enable();
  });
}

/* -------------------------------------------------- */
/* 6) Letzte fünf Posts laden                          */
/* -------------------------------------------------- */
export async function loadRecentGroupPosts(groupId) {
  if (!groupId) return;
  const rpt = $w('#postRepeater');
  if (!rpt?.type) return;

  try {
    const { items: posts } = await wixData.query('GroupPosts')
      .eq('groupId', groupId).descending('_createdDate').limit(5).find();

    rpt.data = posts;

    rpt.onItemReady(async ($item, post) => {
      /* A) Author */
      const info = await fetchAuthorInfo(post.author);
      const $author = $item('#postAuthor');
      if ($author?.type) {
        $author.text = `@${info.nickname}`;
        $author.onClick((e) => { halt(e); wixLocation.to(`/profil/${info.nickname}`); });
      }

      const $pic = $item('#profilePic');
      if ($pic?.type)
        info.profilePicture ? ($pic.src = info.profilePicture, $pic.show()) : $pic.hide();

      /* B) Follow */
      setupFollowButton($item('#flwBtn'), post.author);

      /* C) Zeit / Titel / Content */
      if ($item('#postDate')?.type)    $item('#postDate').text = timeSince(new Date(post._createdDate));
      if ($item('#postTitle')?.type)   $item('#postTitle').text = post.title || '';
      if ($item('#postContent')?.type) $item('#postContent').text = post.content || '';

      /* D) Like */
      let viewerImportId = wixLocal.getItem('viewerImportId');
      if (!viewerImportId && wixUsers.currentUser.loggedIn) {
        const r = await wixData.query('Import414')
          .eq('memberId', wixUsers.currentUser.id).limit(1).find();
        if (r.items.length) {
          viewerImportId = r.items[0]._id;
          wixLocal.setItem('viewerImportId', viewerImportId);
        }
      }
      setupLikeButton($item('#like'), $item('#likeCnt'), post, viewerImportId);

      /* E) Optionen-Toggle */
      const $optI = $item('#options');
      const $optC = $item('#optionCon');
      if ($optI?.type && $optC?.type) {
        $optC.collapse();
        $optI.onClick((e) => { halt(e); $optC.collapsed ? $optC.expand() : $optC.collapse(); });
      }

      /* F) Card-Click → Detailseite */
      const $card = $item('#postCard');
      if ($card?.type && post.postedInGroup && post.title) {
        $card.style.cursor = 'pointer';
        $card.onClick(() => {
          const groupName = encodeURIComponent(post.postedInGroup);
          const postTitle = encodeURIComponent(post.title);
          const fullUrl = `https://luxelinkonline.wixstudio.com/llll/group/${groupName}/posts/${postTitle}`;
          wixLocation.to(fullUrl);
        });
      }
    });

  } catch (err) {
    console.error('[PostsRepeater]', err);
  }
}

/* -------------------------------------------------- */
/* 7) Page-onReady                                    */
/* -------------------------------------------------- */
$w.onReady(() => {
  $w('#groupDataset').onReady(async () => {
    const grp = $w('#groupDataset').getCurrentItem();
    if (grp?._id) await loadRecentGroupPosts(grp._id);
  });
});
