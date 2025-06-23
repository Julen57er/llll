// ==============================================================================
// POST-DETAILSEITE  –  KOMPLETTCODE   (12 Jun 2025)
// Seite: groups-posts-details
// ==============================================================================

// --------------------------------------------------
// 1) Imports & globale Variablen
// --------------------------------------------------
import wixUsers    from 'wix-users';
import wixData     from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow   from 'wix-window';
import { local as wixLocal } from 'wix-storage';

let currentUserImport414Id = null;   // _id des eingeloggten Users in Import414
let currentPostId          = null;   // _id des angezeigten Posts
let currentGroupData       = null;   // Gruppen-Objekt (für Header + Join)

const HOME_URL = 'https://luxelinkonline.wixstudio.com/llll';

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 13000,
  16000, 20000, 24000, 29000, 34000, 40000, 46000, 53000, 60000,
  68000, 76000, 85000, 94000, 103000, 113000, 124000, 136000,
  149000, 163000, 178000, 194000, 211000, 229000, 248000, 268000,
  289000, 311000, 334000, 358000, 383000, 409000, 436000, 464000,
  493000, 523000, 554000, 586000, 619000, 653000
];



// --------------------------------------------------
// 2) Hilfsfunktionen (Header & Sidebar)
// --------------------------------------------------
function getMemberCount(str) {
  if (!str || typeof str !== 'string') return 0;
  return str.split(',').map(s => s.trim()).filter(Boolean).length;
}
function privacyLabel(v) {
  if (v?.toLowerCase() === 'private') return 'Private Group';
  if (v?.toLowerCase() === 'public')  return 'Public Group';
  return 'Group';
}

function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[äåàáâã]/g, 'a')
    .replace(/[öòóôõ]/g, 'o')
    .replace(/[üùúû]/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// -------- HEADER (Bereich 1) ---------------------------------------------------
function populateHeader(groupData) {
  if (!groupData?._id) return;
  if ($w('#groupImage')?.type)  $w('#groupImage').src  = groupData.image;
  if ($w('#groupTitle')?.type)  $w('#groupTitle').text = groupData.title || 'Untitled Group';
  if ($w('#privacyMembers')?.type) {
    const info = privacyLabel(groupData.privacy);
    const cnt  = getMemberCount(groupData.members);
    $w('#privacyMembers').text = `${info} • ${cnt === 1 ? '1 Member' : `${cnt} Members`}`;
  }
}
async function setupJoinButton(groupData) {
  const btn = $w('#joinBtn');
  if (!btn?.type || !groupData?._id) return;

  const wixUser = wixUsers.currentUser;
  if (!wixUser.loggedIn) {
    btn.label = 'Login to Join';
    btn.onClick(() => wixUsers.promptLogin({ mode: 'login' }));
    btn.enable(); return;
  }
  if (!currentUserImport414Id) { btn.label = 'Loading User…'; btn.disable(); return; }

  const isMember = (groupData.members || '')
        .split(',').map(s => s.trim()).includes(currentUserImport414Id);

  btn.onClick(() => {});   // reset
  if (isMember) {
    btn.label = 'Leave';
    btn.onClick(() => leaveGroup(groupData));
  } else {
    btn.label = '+ Join';
    btn.onClick(() => joinGroup(groupData));
  }
  btn.enable();
}

// -------- SIDEBAR (Bereich 5) --------------------------------------------------
async function populateSidebar() {
  const wixUser = wixUsers.currentUser;
  if (!wixUser.loggedIn) return;

  const res = await wixData.query('Import414').eq('memberId', wixUser.id).limit(1).find();
  if (!res.items.length) return;

  const user = res.items[0];
  currentUserImport414Id = user._id;

  if ($w('#sidebarNickname')?.type) $w('#sidebarNickname').text = user.nickname || 'Unknown';

  if ($w('#sidebarLevel')?.type && typeof user.totalXP === 'number') {
    const xp  = user.totalXP;
    const lvl = LEVEL_THRESHOLDS.findIndex(t => xp < t);
    $w('#sidebarLevel').text = `Level ${lvl === -1 ? LEVEL_THRESHOLDS.length : lvl}`;
  }
  if ($w('#logoutIcon')?.type) {
  $w('#logoutIcon').onClick(() => {
    wixUsers.logout()
      .then(() => wixLocation.to(HOME_URL))
      .catch(() => wixLocation.to(HOME_URL));
  });
  }}

// --------------------------------------------------
// 3) Profilbild-Service   (für Header-Bild & Kommentare)
// --------------------------------------------------
const authorCache = new Map();
/**
 * Holt nickname + Profilbild (Import414 ▸ fallback MediaAssets.profilePicture).
 * @param {string} importId  _id des Users in Import414
 */
async function getAuthor(importId) {
  if (!importId) return { nickname: 'User', profilePicture: null };
  if (authorCache.has(importId)) return authorCache.get(importId);

  let nickname = 'User';
  let pic      = null;

  try {
    const doc = await wixData.get('Import414', importId);
    nickname  = doc.nickname || 'User';
    pic       = doc.profilePicture || null;
  } catch{/* ignore */}

  if (!pic) {                                   // Fallback MediaAssets
    try {
      const m = await wixData.query('MediaAssets')
                              .eq('memberRef', importId)
                              .descending('_createdDate').limit(1).find();
      if (m.items.length && m.items[0].profilePicture)
        pic = m.items[0].profilePicture;
    } catch{/* ignore */}
  }

  const info = { nickname, profilePicture: pic };
  authorCache.set(importId, info);
  return info;
}

// --------------------------------------------------
// 4) Reaktionen  (Like / Share / Counter)
// --------------------------------------------------
async function refreshReactionCounters() {
  if (!currentPostId) return;
  const [cCnt, lCnt, sCnt] = await Promise.all([
    wixData.query('PostComments').eq('postId', currentPostId).count(),
    wixData.query('PostLikes')   .eq('postId', currentPostId).count(),
    wixData.query('PostShares')  .eq('postId', currentPostId).count()
  ]);
  if ($w('#commentCounter')?.type) $w('#commentCounter').text = String(cCnt);
  if ($w('#likeCounter')?.type)    $w('#likeCounter').text    = String(lCnt);
  if ($w('#shareCounter')?.type)   $w('#shareCounter').text   = String(sCnt);
}
async function togglePostLike() {
  if (!currentPostId || !currentUserImport414Id) return;

  const q = await wixData.query('PostLikes')
      .eq('postId', currentPostId).eq('userId', currentUserImport414Id)
      .limit(1).find();

  if (q.items.length) {                             // Like entfernen
    await wixData.remove('PostLikes', q.items[0]._id);
  } else {                                          // Like hinzufügen
    await wixData.insert('PostLikes', {
      postId: currentPostId,
      userId: currentUserImport414Id,
      _createdDate: new Date()
    });
  }
  refreshReactionCounters();
}
async function registerShare() {
  if (!currentPostId || !currentUserImport414Id) return;
  try {
    await wixWindow.copyToClipboard(wixLocation.url);     // URL kopieren
    $w('#goal')?.show(); setTimeout(() => $w('#goal')?.hide(), 3000);

    await wixData.insert('PostShares', {
      postId: currentPostId,
      userId: currentUserImport414Id,
      _createdDate: new Date()
    });
    refreshReactionCounters();
  } catch (e) { console.error('[Share]', e); }
}

// --------------------------------------------------
// 5) Kommentare  (Input, Repeater, Like)
// --------------------------------------------------
function timeSince(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  const map = [['year',31536000],['month',2592000],['day',86400],
               ['hour',3600],['minute',60],['second',1]];
  for (const [lbl, secs] of map) {
    const n = Math.floor(s / secs); if (n >= 1) return `${n} ${lbl}${n!==1?'s':''} ago`;
  }
  return 'just now';
}
async function toggleCommentLike(comment, iconEl, cntEl) {
  if (!currentUserImport414Id) { wixUsers.promptLogin({ mode:'login' }); return; }

  // Vollständigen Eintrag holen ➞ nur likedBy ändern (kein Datenverlust!)
  const full = await wixData.get('PostComments', comment._id, { suppressAuth:true });
  const arr  = Array.isArray(full.likedBy) ? [...full.likedBy] : [];
  const idx  = arr.indexOf(currentUserImport414Id);
  idx > -1 ? arr.splice(idx, 1) : arr.push(currentUserImport414Id);

  full.likedBy = arr;                               // nur dieses Feld ändern
  await wixData.update('PostComments', full);       // gesamtes Objekt speichern

  cntEl.text = String(arr.length);
  iconEl.src = idx > -1
      ? iconEl.src.replace('filled','outline')
      : iconEl.src.replace('outline','filled');
}
async function loadComments() {
  if (!currentPostId) return;

  const rpt = $w('#commentRepeater');
  if (!rpt?.type) return;

  const { items } = await wixData.query('PostComments')
    .eq('postId', currentPostId)
    .ascending('_createdDate').find();

  rpt.data = items;

  rpt.onItemReady(async ($item, data) => {
    const info = await getAuthor(data.author);

    // ► Nutzername setzen + klickbar machen
    if ($item('#userName')?.type && info.nickname) {
      $item('#userName').text = `@${info.nickname}`;
      $item('#userName').style.cursor = 'pointer';
      $item('#userName').onClick(() => {
        wixLocation.to(`https://luxelinkonline.wixstudio.com/llll/profil/${info.nickname}`);
      });
    }

    // ► Profilbild im Kommentar
    if ($item('#userImg')?.type) {
      if (info.profilePicture) {
        $item('#userImg').src = info.profilePicture;
        $item('#userImg').show();
      } else {
        $item('#userImg').hide();
      }
    }

    // ► Kommentartext & Zeit
    if ($item('#commentContent')?.type) $item('#commentContent').text = data.commentText;
    if ($item('#commentTime')?.type) $item('#commentTime').text = timeSince(new Date(data._createdDate));

    // ► Kommentar-Like-Icon
    const cIcon = $item('#likeCommentIcon');
    const cCnt = $item('#likeCommentCounter');
    if (cIcon?.type && cCnt?.type) {
      const arr = Array.isArray(data.likedBy) ? data.likedBy : [];
      cCnt.text = String(arr.length);
      cIcon.src = arr.includes(currentUserImport414Id)
        ? cIcon.src.replace('outline', 'filled')
        : cIcon.src.replace('filled', 'outline');
      cIcon.onClick(() => toggleCommentLike(data, cIcon, cCnt));
    }
  });
}

async function submitComment() {
  const inp = $w('#commentInput');
  if (!inp?.type) return;
  const txt = inp.value.trim();
  if (!txt) return;

  if (!currentUserImport414Id) { wixUsers.promptLogin({ mode:'login' }); return; }

  await wixData.insert('PostComments', {
    postId:      currentPostId,
    author:      currentUserImport414Id,
    commentText: txt,
    _createdDate: new Date()
  });

  inp.value = '';
  loadComments();
  refreshReactionCounters();
}

// --------------------------------------------------
// 6) Gruppenbeitritt / -Verlassen
// --------------------------------------------------
async function joinGroup(group) {
  if (!currentUserImport414Id || !group?._id) return;
  const arr = (group.members || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!arr.includes(currentUserImport414Id)) arr.push(currentUserImport414Id);
  await wixData.update('Groups', { _id: group._id, members: arr.join(',') });
  currentGroupData = await wixData.get('Groups', group._id);
  populateHeader(currentGroupData); setupJoinButton(currentGroupData);
}
async function leaveGroup(group) {
  if (!currentUserImport414Id || !group?._id) return;
  const arr = (group.members || '').split(',').map(s => s.trim())
                .filter(id => id && id !== currentUserImport414Id);
  await wixData.update('Groups', { _id: group._id, members: arr.join(',') });
  currentGroupData = await wixData.get('Groups', group._id);
  populateHeader(currentGroupData); setupJoinButton(currentGroupData);
}

// --------------------------------------------------
// 7) Seiteneinstieg
// --------------------------------------------------
$w.onReady(async () => {
  await populateSidebar();                    // Sidebar zuerst

  // Dataset-Callback
  $w('#postDataset').onReady(async () => {
    const post = $w('#postDataset').getCurrentItem();
    if (!post?._id) { console.error('Post not found'); return; }

    currentPostId = post._id;

    // ▸ Profilbild im Detail-Header (imageX23)
    if ($w('#userImg2')?.type) {
      const info = await getAuthor(post.author);
      if (info.profilePicture) $w('#userImg2').src = info.profilePicture;
    }

    // ▸ Dokumentname aus attachments (falls vorhanden)
    if ($w('#docName')?.type) {
      const doc = post.attachments;   // single file oder array
      if (doc) {
        const fileName = Array.isArray(doc)
            ? (doc[0]?.name || doc[0]?.split('/').pop())
            : (doc.name || String(doc).split('/').pop());
        $w('#docName').text = fileName || '';
      }
    }

    // Gruppe für Header/Join
    if (post.groupId) {
      currentGroupData = await wixData.get('Groups', post.groupId);
      populateHeader(currentGroupData);
      await setupJoinButton(currentGroupData);
    }

    if ($w('#grpHmeBtn')?.type) {
  $w('#grpHmeBtn').onClick(() => {
    if (!currentGroupData) return;
    const slug = currentGroupData.slug
               || slugify(currentGroupData.title || '');
    wixLocation.to(`/group/${slug}/home`);
  });
}

    // Reaktionen
    $w('#likeIcon') ?.onClick(togglePostLike);
    $w('#shareIcon')?.onClick(registerShare);
    refreshReactionCounters();

    // Kommentar-Input (ENTER → senden)
    $w('#commentInput')?.onKeyPress(e => { if (e.key === 'Enter') submitComment(); });

    loadComments();
  });
});
