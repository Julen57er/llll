// Diesen Code in die Seiten-Code-Datei deiner Lightbox "badgeCriteria-LB.js" einfügen.

import { lightbox } from 'wix-window';

$w.onReady(function () {
    // Holt die Daten, die von der Gruppenseite übergeben wurden.
    const contextData = lightbox.getContext();

    // Debugging-Log, um zu sehen, welche Daten ankommen.
    console.log("Lightbox ('badgeCriteria-LB') hat folgenden Kontext empfangen:", contextData);

    // Sicherheitsprüfung, falls keine Daten übergeben wurden.
    if (!contextData) {
        console.error("Lightbox: Badge-Kontext (Daten) nicht gefunden!");
        if ($w('#badgeTitle').type) $w('#badgeTitle').text = 'Badge nicht gefunden';
        if ($w('#badgeTask').type) $w('#badgeTask').text = 'Keine Aufgabenbeschreibung verfügbar.';
        if ($w('#badgePoints').type) $w('#badgePoints').text = ''; 
        if ($w('#badgeIcon').type) $w('#badgeIcon').hide();
        return;
    }

    try {
        // KORREKTUR: Badge-Titel in #badgeTitle setzen
        const badgeTitleElement = $w("#badgeTitle");
        if (badgeTitleElement.type) {
            // Empfängt 'name' aus dataToPass (was aus dem Feld 'badgeName' kommt).
            badgeTitleElement.text = contextData.name || "Badge-Details";
        }

        // KORREKTUR: Badge-Aufgabe in #badgeTask setzen
        const badgeTaskElement = $w("#badgeTask");
        if (badgeTaskElement.type) {
            // Empfängt 'taskDescription' aus dataToPass (was aus dem Feld 'task' kommt).
            badgeTaskElement.text = contextData.taskDescription || "Keine Aufgabenbeschreibung verfügbar.";
        }

        // KORREKTUR: Punkteanzeige aus 'pointsAwarded' (was aus dem Feld 'xp' kommt)
        const badgePointsElement = $w("#badgePoints");
        if (badgePointsElement.type) {
            badgePointsElement.text = `${contextData.pointsAwarded || 0} XP`;
        }
        
        // Badge-Icon setzen.
        const badgeIconElement = $w("#badgeIcon");
        if (badgeIconElement.type) {
            if (contextData.icon) {
                badgeIconElement.src = contextData.icon;
                badgeIconElement.show();
            } else {
                badgeIconElement.hide();
            }
        }

        console.log("Lightbox: Elemente wurden mit Badge-Daten befüllt:", contextData.name);

    } catch (e) {
        console.error("Lightbox: Fehler beim Befüllen der Elemente:", e);
        // Fallback-UI, falls ein Fehler beim Befüllen auftritt
        if ($w('#badgeTitle').type) $w('#badgeTitle').text = 'Fehler bei der Anzeige';
        if ($w('#badgeTask').type) $w('#badgeTask').text = 'Fehler bei der Anzeige.';
        if ($w('#badgePoints').type) $w('#badgePoints').text = '';
        if ($w('#badgeIcon').type) $w('#badgeIcon').hide();
    }

    // NEU: Funktionalität für den Schließen-Button #closeBtn hinzufügen
    const closeButton = $w("#closeBtn");
    if (closeButton.type) {
        closeButton.onClick(() => {
            lightbox.close(); // Standardmethode zum Schließen der Lightbox
        });
    } else {
        console.warn("Lightbox: #closeBtn wurde auf der Seite nicht gefunden.");
    }
});