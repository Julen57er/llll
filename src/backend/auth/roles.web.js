/*************************************************************
 *  LuxeLink – Backend | auth/roles.jsw
 *  -----------------------------------------------------------
 *  Zentrales Rollen-Utility & Admin-Guard
 *************************************************************/

import { authorization, currentMember } from 'wix-members-backend';
import wixData from 'wix-data';

const COLL_IMPORT = 'Import414';

/* ▸ Hilfsfunktion – Rolle zuweisen (Website-Rolle UND Import414) */
export async function assignRole(memberId, roleName) {
  /* Website-Rolle */
  await authorization.assignRole(memberId, roleName).catch(() => {/* Role evtl. noch nicht existiert */});

  /* Import414-Update */
  const item = await wixData.query(COLL_IMPORT).eq('memberId', memberId).limit(1).find()
                .then(r => r.items[0]);
  if (item) {
    item.role = roleName;
    await wixData.update(COLL_IMPORT, item, { suppressAuth: true });
  }
}

/* ▸ Admin-Check (für Server-Code) */
export async function isAdmin() {
  const member = await currentMember.getMember().catch(() => null);
  if (!member) return false;
  const roles  = await currentMember.getRoles();
  return roles.some(r => (r.slug ?? r.name ?? '').toLowerCase() === 'admin');
}

/* ▸ Freigabe / Ablehnung durch Admin */
export async function adminSetRole(memberId, newRole, newStatus) {
  if (!await isAdmin()) throw new Error('FORBIDDEN');

  // Import414 patch
  const rec = await wixData.query(COLL_IMPORT).eq('memberId', memberId).limit(1).find()
              .then(r => r.items[0]);
  if (!rec) throw new Error('MEMBER_NOT_FOUND');

  rec.role   = newRole;
  rec.status = newStatus;
  await wixData.update(COLL_IMPORT, rec, { suppressAuth: true });

  // Website-Rolle
  await assignRole(memberId, newRole);

  return { ok: true };
}
