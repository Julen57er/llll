/*****************************************************************
 * Minimal-Header
 * • Gäste sehen authBox  (Register | Log In – Links legst du im Editor fest)
 * • eingeloggte Nutzer sehen userBox  (Avatar + Dropdown)
 *****************************************************************/

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import { getMyProfile } from 'backend/customMember'; // Annahme: Diese Backend-Funktion ist korrekt implementiert

$w.onReady(async () => {
    // Elemente einmal selektieren und für spätere Verwendung speichern
    const authBox = $w('#authBox');
    const userBox = $w('#userBox');
    const menuBox = $w('#menuBox');
    const lnkMyProfile = $w('#lnkMyProfile');
    const imgMini = $w('#imgMini');
    const lnkLogout = $w('#lnkLogout');

    /* ─ Grundeinstellung beim Laden ─ */
    if (authBox.type) authBox.show();
    if (userBox.type) userBox.hide();
    if (menuBox.type) menuBox.collapse();

    // Die folgende Zeile wurde entfernt, da '.link' nicht für $w.Text existiert.
    // Der Velo onClick-Handler für #lnkMyProfile sollte die Navigation steuern.
    // if (lnkMyProfile.type && typeof lnkMyProfile.link !== 'undefined') {
    //     try {
    //         lnkMyProfile.link = ''; 
    //     } catch (e) {
    //         console.warn("Konnte .link für #lnkMyProfile nicht direkt setzen, evtl. kein Link-fähiges Element.", e)
    //     }
    // }

    let myNickname = '';
    let userProfilePicture = null;

    /* ─ Wenn bereits eingeloggt → Avatar + Nickname holen ─ */
    if (wixUsers.currentUser.loggedIn) {
        const currentUser = wixUsers.currentUser;
        const veloUserId = currentUser.id;
        console.log('masterPage.js - Velo User ID:', veloUserId);

        try {
            const profileDataFromBackend = await getMyProfile();
            console.log('masterPage.js - Profile object from getMyProfile():', profileDataFromBackend);

            if (profileDataFromBackend) {
                if (profileDataFromBackend.profilePicture) {
                    userProfilePicture = profileDataFromBackend.profilePicture;
                }
                if (profileDataFromBackend.nickname) {
                    myNickname = profileDataFromBackend.nickname;
                    console.log('masterPage.js - Nickname from getMyProfile():', myNickname);
                }
            }
            
            // Fallback-Logik für Nickname (optional, falls getMyProfile zuverlässig ist):
            // Hier ggf. korrekten Fallback einfügen, der .eq('memberId', veloUserId) verwendet,
            // falls getMyProfile() nicht immer alle Daten liefert.
            // Für dieses Update bleibt es bei der Annahme, dass getMyProfile() primär ist.

        } catch (err) {
            console.error('masterPage.js - Fehler beim Laden des Profils:', err);
        }

        if (userProfilePicture && imgMini.type) {
            imgMini.src = userProfilePicture;
        } else if (imgMini.type) {
            console.log("masterPage.js - Kein Profilbild für imgMini gesetzt oder Element nicht vorhanden.");
        }

        if (authBox.type) authBox.hide();
        if (userBox.type) userBox.show();

    } else {
        if (authBox.type) authBox.show();
        if (userBox.type) userBox.hide();
    }

    /* ─ Avatar klick: Dropdown auf/zu ─ */
    if (userBox.type && menuBox.type) {
        userBox.onClick(() => {
            if (menuBox.collapsed) {
                menuBox.expand();
            } else {
                menuBox.collapse();
            }
        });
    }

    /* ─ Menü-Einträge ─ */
    if (lnkMyProfile.type) {
        lnkMyProfile.onClick(() => {
            if (myNickname) {
                const targetUrl = `/profil/${encodeURIComponent(myNickname)}`;
                console.log('masterPage.js - Weiterleitung zu Profil:', targetUrl);
                wixLocation.to(targetUrl);
            } else {
                console.warn('masterPage.js - Nickname nicht gefunden, Weiterleitung auf generisches /profil');
                wixLocation.to('/profil');
            }
        });
    }

    if (lnkLogout.type) {
        lnkLogout.onClick(async () => {
            try {
                await wixUsers.logout();
                wixLocation.to('/'); 
            } catch (logoutError){
                console.error("masterPage.js - Logout Error:", logoutError);
                wixLocation.to('/'); 
            }
        });
    }
});