//─────────────────────────────────────────────────────────────
//  Profil-Seite (Item-Page) – komplett aus deinem Original-Code
//  – alle Funktionen kopierbereit übernommen :contentReference[oaicite:2]{index=2}
//─────────────────────────────────────────────────────────────

import wixUsers             from 'wix-users';
import wixData              from 'wix-data';
import { getProfileBundle } from 'backend/members/profile';   // .jsw-Modul
import { toggleFollow }     from 'backend/social/follow';    // .jsw-Modul
import wixLocation          from 'wix-location';

/* ══════════════════════════ TAB-KONFIG ══════════════════════════ */
const TAB_MAP = {
  '#btnOvrw'        : '#tabOverview',
  '#btnPost'        : '#tabPosts',
  '#btnGroups'      : '#tabGroups',
  '#btnProjects'    : '#tabProjects',
  '#btnAchievements': '#tabAchievements',
  '#btnContact'     : '#tabContact'
};
const ACTIVE_COLOR   = '#c8a24a';
const INACTIVE_COLOR = '#ffffff';

/**
 * Hebt im Menü den aktiven Button farblich hervor.
 */
function activateMenu(btnId) {
  Object.keys(TAB_MAP).forEach(id => {
    const btn = $w(id);
    if (btn && btn.style) {
      btn.style.color = (id === btnId) ? ACTIVE_COLOR : INACTIVE_COLOR;
    }
  });
}

/* ══════════════════════════ UTILITIES ══════════════════════════ */
const isValidImg = url =>
  typeof url === 'string' && /^(https?:\/\/|wix:image:\/\/)/.test(url);

const truncate50 = t =>
  typeof t === 'string' && t.length > 50
    ? t.slice(0, 47) + '…'
    : (t || '');

function slugify(text) {
  if (!text) return "";
  return String(text).toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function formatDateDifference(joinDate) {
  if (!joinDate) return "";
  const now = new Date(), past = new Date(joinDate);
  if (isNaN(past.getTime())) return "";
  const diffDays = Math.floor((now - past)/(1000*60*60*24));
  const yrs  = Math.floor(diffDays/365.25);
  const mos  = Math.floor(diffDays/30.4375);
  if (yrs>0) return `Member since ${yrs} year${yrs>1?'s':''}`;
  if (mos>0) return `Member since ${mos} month${mos>1?'s':''}`;
  return diffDays>0
    ? `Member since ${diffDays} day${diffDays>1?'s':''}`
    : "Member since today";
}

function setTextSafely(element, textContent) {
  if (element && element.type === "$w.Text") {
    element.text = textContent == null ? '' : String(textContent);
  }
}

/* ══════════════════════════ TAB-STEUERUNG ═══════════════════════ */
let currentTabButtonId = null;
let filterExcludeGeneralPosts = false;
let filterMediaOnlyPosts       = false;
let generalGroupIdPromiseCache = null;

function showTab(btnIdToShow) {
  // zusammenklappen alten Tab
  if (currentTabButtonId && TAB_MAP[currentTabButtonId]) {
    const oldTab = $w(TAB_MAP[currentTabButtonId]);
    if (oldTab) oldTab.collapse();
  }
  // ausklappen neuen Tab
  const newTab = $w(TAB_MAP[btnIdToShow]);
  if (newTab) newTab.expand();
  activateMenu(btnIdToShow);
  currentTabButtonId = btnIdToShow;
  // passende Ladefunktion
  if      (btnIdToShow === '#btnOvrw')        loadOverview();
  else if (btnIdToShow === '#btnPost')        loadPosts();
  else if (btnIdToShow === '#btnGroups')      loadGroups();
  else if (btnIdToShow === '#btnProjects')    loadGroupProjects();
  else if (btnIdToShow === '#btnAchievements')loadAchievements();
  else if (btnIdToShow === '#btnContact')     loadContact();
}

/* ══════════════════════════ MAINPROFILE ══════════════════════════ */
async function getMainProfile(id, fbUser) {
  let prof = null;
  if (id) {
    try {
      prof = await wixData.get('MainProfile', id);
    } catch {
      prof = null;
    }
    if (!prof) {
      try {
        const res = await wixData.query('MainProfile')
          .eq('memberRef', id).limit(1).find();
        prof = res.items[0] || null;
      } catch {
        prof = null;
      }
    }
  }
  if (!prof) {
    prof = {
      _id: id || null,
      firstName: fbUser?.firstName || '',
      lastName:  fbUser?.lastName  || '',
      nickname:  fbUser?.nickname  || 'Unbekannt',
      isFallback: true
    };
  }
  return prof;
}

/* ══════════════════════════ OVERVIEW-TAB ═══════════════════════ */
async function loadOverview() {
  const dyn = $w('#dynamicDataset').getCurrentItem();
  if (!dyn) return;

  const profileKey = dyn._id;
  const ownerId    = dyn.memberId;
  let currUserId   = null;
  if (wixUsers.currentUser.loggedIn) {
    currUserId = typeof wixUsers.currentUser.getId==='function'
      ? await wixUsers.currentUser.getId().catch(()=>wixUsers.currentUser.id)
      : wixUsers.currentUser.id;
  }
  const isOwner = currUserId === ownerId;

  const [
    detRes,
    impRes,
    medRes,
    latestPostRes,
    followerCount,
    viewerFollows,
    followingCount
  ] = await Promise.all([
    wixData.query('ProfileDetails').eq('memberRef', profileKey).limit(1).find()
      .then(r=>r.items[0]||{}).catch(()=>({})),
    wixData.query('Import414').eq('_id', profileKey).limit(1).find()
      .then(r=>r.items[0]||{}).catch(()=>({})),
    wixData.query('MediaAssets').eq('memberRef', profileKey).limit(1).find()
      .then(r=>r.items[0]||{}).catch(()=>({})),
    wixData.query('GroupPosts').eq('author', profileKey)
      .descending('_createdDate').limit(1).find()
      .then(r=>r.items[0]||{}).catch(()=>({})),
    wixData.query('Follows').eq('targetId', profileKey).count().catch(()=>0),
    currUserId
      ? wixData.query('Follows')
          .eq('targetId', profileKey)
          .eq('followerId', currUserId)
          .count().then(c=>c>0).catch(()=>false)
      : false,
    wixData.query('Follows').eq('followerId', profileKey).count().catch(()=>0)
  ]);

  const mainProf = await getMainProfile(profileKey, dyn);

  // Textfelder
  setTextSafely($w('#userNameTop'), mainProf.nickname);
  setTextSafely($w('#userNameMain'), mainProf.nickname);
  setTextSafely($w('#fullNameTop'),
    `${mainProf.firstName||''} ${mainProf.lastName||''}`.trim());
  setTextSafely($w('#fullNameMain'),
    `${mainProf.firstName||''} ${mainProf.lastName||''}`.trim());
  setTextSafely($w('#txtLuxuryLevel'), detRes.level);
  setTextSafely($w('#specializedText'), detRes.specialization);
  setTextSafely($w('#txtMemberSince'),
    impRes._createdDate ? formatDateDifference(impRes._createdDate) : '');
  setTextSafely($w('#postNumb'), dyn.posts);
  setTextSafely($w('#flwNumb'), followerCount);
  setTextSafely($w('#flwgNumb'), followingCount);
  setTextSafely($w('#txtLatestPostTitle'), latestPostRes.Title);

  // Bilder
  const pic = $w('#userPic');
  if (isValidImg(medRes.profilePicture)) { pic.src = medRes.profilePicture; pic.expand(); }
  else pic.collapse();
  const banner = $w('#banner');
  if (isValidImg(medRes.bannerPicture)) { banner.src = medRes.bannerPicture; banner.expand(); }
  else banner.collapse();

  // Edit- vs. Follow-Button
  const editBtn = $w('#editBtn');
  const flwBtn  = $w('#flwBtn');
  if (isOwner) {
    editBtn.show(); flwBtn.hide();
  } else {
    editBtn.hide(); flwBtn.show();
    let isFollowing = viewerFollows;
    flwBtn.label = isFollowing ? 'Unfollow' : 'Follow';
    flwBtn.onClick(async () => {
      flwBtn.disable();
      if (isFollowing) {
        const recs = await wixData.query('Follows')
          .eq('targetId', profileKey)
          .eq('followerId', currUserId)
          .limit(1).find();
        if (recs.items[0]) await wixData.remove('Follows', recs.items[0]._id);
      } else {
        const countExisting = await wixData.query('Follows')
          .eq('targetId', profileKey)
          .eq('followerId', currUserId)
          .count();
        if (countExisting===0) {
          await wixData.insert('Follows', {
            followerId: currUserId,
            targetId:   profileKey,
            _createdDate: new Date()
          });
        }
      }
      const newCount = await wixData.query('Follows')
        .eq('targetId', profileKey).count();
      setTextSafely($w('#flwNumb'), newCount);
      isFollowing = !isFollowing;
      flwBtn.label = isFollowing ? 'Unfollow' : 'Follow';
      flwBtn.enable();
    });
  }

  // weitere Details
  setTextSafely($w('#txtQuote'),        detRes.quote);
  setTextSafely($w('#txtGoal'),         detRes.goal);
  setTextSafely($w('#txtValues'),       detRes.values);
  setTextSafely($w('#txtRoutines'),     detRes.routines);
  setTextSafely($w('#txtFavPlaces'),    detRes.favPlaces);
  setTextSafely($w('#txtSignatureSet'), detRes.signatureSet);
  setTextSafely($w('#txtNextTrip'),     detRes.nextTrip);
  setTextSafely($w('#txtFocusArea'),    detRes.focusArea);
  setTextSafely($w('#txtAudience'),     detRes.audience);
  setTextSafely($w('#txtAvailableFor'), detRes.availableFor);
  setTextSafely($w('#txtMilestones'),   detRes.milestones);
  setTextSafely($w('#socialsRepeater'), detRes.socials);
  setTextSafely($w('#btnCommunity'),    detRes.communityLink);
  setTextSafely($w('#txtPurpose'),      detRes.purpose);
  setTextSafely($w('#txtInspires'),     detRes.inspires);
  setTextSafely($w('#txtLegacy'),       detRes.legacy);
  setTextSafely($w('#txtInfluenceScore'), detRes.influenceScore);
  setTextSafely($w('#txtInfluences'),     detRes.influences);
  setTextSafely($w('#txtVision2025'),     detRes.vision2025);
  setTextSafely($w('#txtVision2030'),     detRes.vision2030);
}

/* ══════════════════════════ POSTS-TAB ══════════════════════════ */
async function getGeneralGroupIdForPosts() {
  if (generalGroupIdPromiseCache) return generalGroupIdPromiseCache;
  generalGroupIdPromiseCache = wixData.query('Groups')
    .eq('title','General').limit(1).find()
    .then(r => r.items[0]?._id || 'INVALID_GENERAL_ID')
    .catch(()=> 'INVALID_GENERAL_ID');
  return generalGroupIdPromiseCache;
}

function updatePostsFilterUI() {
  const setBtn = (sel, lbl, active) => {
    const b = $w(sel);
    if (b && b.type === "$w.Button") {
      b.label = lbl;
      b.style.color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
    }
  };
  setBtn('#groupPostBtn','Groups only', filterExcludeGeneralPosts);
  setBtn('#mediaOnlyBtn','Media only', filterMediaOnlyPosts);
  setBtn('#allPostsBtn','All posts', !filterExcludeGeneralPosts && !filterMediaOnlyPosts);
}

async function loadPosts() {
  const dyn = $w('#dynamicDataset').getCurrentItem();
  if (!dyn) return;
  const profileId = dyn.memberRef || dyn._id;
  if (!profileId) return;

  let query = wixData.query('GroupPosts').eq('author', profileId);
  if (filterExcludeGeneralPosts) {
    const gid = await getGeneralGroupIdForPosts();
    if (gid!=='INVALID_GENERAL_ID') query = query.ne('groupId', gid);
  }
  if (filterMediaOnlyPosts) query = query.isNotEmpty('attachments');

  const res = await query.descending('_createdDate').find().catch(()=>({items:[]}));
  const groupIds = [...new Set(res.items.map(p=>p.groupRef||p.groupId).filter(Boolean))];
  const groups = groupIds.length
    ? (await wixData.query('Groups').hasSome('_id',groupIds).find()).items
    : [];
  const groupMap = Object.fromEntries(groups.map(g=>[g._id, g.title||'']));

  const data = res.items.map(p=>({
    _id: p._id,
    title: p.title||'',
    content: truncate50(p.content||''),
    groupName: groupMap[p.groupRef||p.groupId]||'',
    slug: p.slug||p._id
  }));

  const rpt = $w('#postRptr');
  rpt.data = data;
  rpt.onItemReady(($i, item)=> {
    const t = $i('#postTitle'), c = $i('#postContent'), g = $i('#groupRef');
    if (t) t.text = item.title;
    if (c) c.text = item.content;
    if (g) g.text = item.groupName;
    const nav = ()=> wixLocation.to(`/groups-posts-details?slug=${encodeURIComponent(item.slug)}`);
    $i('#goToPost')?.onClick(nav);
    $i('#txtMore')?.onClick(nav);
  });
  data.length ? rpt.expand() : rpt.collapse();
}

/* ══════════════════════════ GROUPS-TAB ══════════════════════════ */
async function loadGroups() {
  const dyn = $w('#dynamicDataset').getCurrentItem();
  const rpt = $w('#groupRptr');
  if (!dyn || !rpt) { rpt?.collapse(); return; }
  const pid = dyn.memberRef||dyn._id;
  if (!pid) { rpt.data=[]; rpt.collapse(); return; }

  const mainProf = await getMainProfile(pid, dyn);
  const userRow  = await wixData.get('Import414', pid).catch(()=>null);
  if (!userRow) { rpt.data=[]; rpt.collapse(); return; }

  const n = mainProf.nickname;
  const gm = userRow.Groups_members;
  const ids = Array.isArray(gm)
    ? gm.map(g=>typeof g==='string'?g:(g?g._id:'')) 
    : (typeof gm==='string'?gm.split(','):[]);
  const groups = ids.length
    ? (await wixData.query('Groups').hasSome('_id',ids).find()).items
    : [];
  const memCounts = await Promise.all(groups.map(g=>
    wixData.query('Import414').hasSome('Groups_members',[g._id]).count().catch(()=>0)));
  const badgeCounts = await Promise.all(groups.map(g=>
    wixData.query('GroupBadges').eq('earnedByGroup',g._id).count().catch(()=>0)));

  const data = groups.map((g,i)=>({
    _id:g._id,
    name:g.title||'',
    description:truncate50(g.description||''),
    membersText:`Members: ${memCounts[i]}`,
    role: (g.admins||[]).includes(n)?'Admin':'Member',
    badges: String(badgeCounts[i])
  }));

  rpt.data = data;
  rpt.onItemReady(($i,item)=>{
    const set = (sel,txt)=>{ const e=$i(sel); if(e && e.type==="$w.Text") e.text=txt; };
    set('#groupName', item.name);
    set('#groupDescription', item.description);
    set('#mbmrCount', item.membersText);
    set('#role', item.role);
    set('#badges', item.badges);
    $i('#groupBtn')?.onClick(() => {
      const slug = slugify(item.name);
      if (slug) wixLocation.to(`https://luxelinkonline.wixstudio.com/llll/groups/${slug}`);
    });
  });
  data.length ? rpt.expand() : rpt.collapse();
}

/* ═══════════════════════ PROJECTS-TAB ══════════════════════════ */
async function loadGroupProjects() {
  const rpt = $w('#projectRptr');
  if (!rpt) return;
  const dyn = $w('#dynamicDataset').getCurrentItem();
  if (!dyn) { rpt.data=[]; rpt.collapse(); return; }
  const pid = dyn.memberRef||dyn._id;
  if (!pid) { rpt.data=[]; rpt.collapse(); return; }

  const res = await wixData.query("GroupProjects")
    .contains("teamMembers", pid)
    .or(wixData.query("GroupProjects").contains("creator", pid))
    .include("groupId")
    .descending("_createdDate")
    .find()
    .catch(()=>({items:[]}));

  rpt.data = res.items;
  rpt.onItemReady(async ($item, item, idx) => {
    const useAlt = idx%2===1;
    const sel = (a,b)=> useAlt ? a : b;
    const titleEl = $item(sel("#projectTitle2","#projectTitle"));
    if (titleEl && titleEl.type==="$w.Text") titleEl.text = item.title1||'';
    const progBar  = $item(sel("#projectProgress2","#projectProgress"));
    const progTxt  = $item(sel("#progressTxt2","#progressTxt"));
    const inProg   = $item(sel("#inProgress2","#inProgress"));
    const comp     = $item(sel("#completed2","#completed"));
    const progVal = typeof item.progress==='number'?item.progress:0;
    progBar?.value = progVal;
    progTxt?.text  = `${progVal}%`;
    if (progVal===100) { comp?.show(); inProg?.hide(); }
    else { inProg?.show(); comp?.hide(); }
    const btn = $item(sel("#groupButton2","#groupButton"));
    if (btn && item.groupId?.title) {
      const gslug = slugify(item.groupId.title);
      btn.link   = `https://luxelinkonline.wixstudio.com/llll/groups/${gslug}/projects`;
      btn.target = "_self";
      btn.enable();
    }
    // Rolle Creator/Member
    let loggedInId = "";
    const cu = wixUsers.currentUser;
    if (cu.loggedIn) {
      loggedInId = typeof cu.getId==='function'
        ? await cu.getId().catch(()=>cu.id)
        : cu.id;
    }
    const creators = (item.creator||"").split(',').map(u=>u.trim());
    const roleTxt = creators.includes(loggedInId) ? "Role: Creator" : "Role: Member";
    const roleEl  = $item(sel("#projectRole2","#projectRole"));
    if (roleEl && roleEl.type==="$w.Text") roleEl.text = roleTxt;
  });
  rpt.data.length? rpt.expand(): rpt.collapse();
}

/* ═════════════════════════ INITIALISIERUNG ═════════════════════════ */
$w.onReady(() => {
  // Tab-Button-Handler
  Object.keys(TAB_MAP).forEach(id => {
    const btn = $w(id);
    if (btn && btn.onClick) {
      btn.onClick(() => showTab(id));
      btn.style.cursor = 'pointer';
    }
  });
  // Post-Filter-Buttons
  const setup = (sel,action)=> $w(sel)?.onClick(action);
  setup('#groupPostBtn', () => {
    filterExcludeGeneralPosts = !filterExcludeGeneralPosts;
    if (filterExcludeGeneralPosts) filterMediaOnlyPosts = false;
    updatePostsFilterUI(); loadPosts();
  });
  setup('#mediaOnlyBtn', () => {
    filterMediaOnlyPosts = !filterMediaOnlyPosts;
    if (filterMediaOnlyPosts) filterExcludeGeneralPosts = false;
    updatePostsFilterUI(); loadPosts();
  });
  setup('#allPostsBtn', () => {
    filterExcludeGeneralPosts = false;
    filterMediaOnlyPosts       = false;
    updatePostsFilterUI(); loadPosts();
  });

  // Dataset ready → collapse all, show Overview
  $w('#dynamicDataset').onReady(() => {
    Object.values(TAB_MAP).forEach(tab => $w(tab)?.collapse());
    updatePostsFilterUI();
    showTab('#btnOvrw');
  });
});

/* ════════════ ACHIEVEMENTS ════════════ */
async function loadAchievements() {
  const dynamicItem = $w('#dynamicDataset').getCurrentItem();
  if (!dynamicItem) {
    console.warn('loadAchievements: kein Dataset-Item'); 
    $w('#badgeRepeater').data = [];
    return;
  }
  const profileId = dynamicItem._id;
  if (!profileId) {
    console.warn('loadAchievements: kein Profil-ID-Feld'); 
    $w('#badgeRepeater').data = [];
    return;
  }

  try {
    // alle earned Badges des Users abfragen
    const earned = await wixData.query('NutzerVerdienteBadges')
      .eq('userId', profileId)
      .limit(1000)
      .find();
    const badgeRefs = earned.items.map(b => 
      typeof b.badgeId_ref === 'string' ? b.badgeId_ref : b.badgeId_ref._id
    );

    if (badgeRefs.length === 0) {
      $w('#badgeRepeater').data = [];
      return;
    }

    // Badge-Definitionen abrufen
    const defs = await wixData.query('BadgeDefinitionen')
      .hasSome('_id', badgeRefs)
      .find();

    // Daten für Repeater aufbereiten
    const data = defs.items.map(def => {
      // Erstellungsdatum aus earned finden
      const earnedRec = earned.items.find(e => {
        const ref = (typeof e.badgeId_ref === 'string' ? e.badgeId_ref : e.badgeId_ref._id);
        return ref === def._id;
      });
      return {
        badgeName: def.badgeName,
        icon:      def.icon,
        xp:        def.pointsAwarded,
        earnedOn:  earnedRec ? earnedRec._createdDate : null
      };
    });

    $w('#badgeRepeater').data = data;
  } catch (e) {
    console.error('loadAchievements Error:', e);
    $w('#badgeRepeater').data = [];
  }
}

/* ─── Hilfsfunktion zum sicheren Setzen von Text ─── */
function setTextSafely(element, text, sel) {
  if (element && element.type === '$w.Text') {
    element.text = text || '';
  } else {
    console.warn(`setTextSafely: Element ${sel} nicht gefunden oder falscher Typ.`);
  }
}