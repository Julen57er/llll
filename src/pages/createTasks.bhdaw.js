import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

const CANCEL_URL = 'https://luxelinkonline.wixstudio.com/llll/dashboard/academy/course-catalog-1';

$w.onReady(() => {
  // Titel aus URL übernehmen, wenn vorhanden
  const query = wixLocation.query;
  if (query.title && $w('#titleInput')) {
    $w('#titleInput').value = decodeURIComponent(query.title);
  }

  // Speichern
  $w('#button4').onClick(async () => {
    const title       = $w('#titleInput').value?.trim();
    const dueDate     = $w('#datePicker1').value;
    const priority    = $w('#dropdown1').value;
    const courseRef   = $w('#dropdown2').value; // ID des ausgewählten Kurses
    const description = $w('#richTextBox1').value;

    if (!title) {
      console.warn("Titel fehlt");
      return;
    }

    const currentUser = wixUsers.currentUser;
    const userId = currentUser.id;

    const newTask = {
      title,
      dueDate,
      priority,
      courseRef,
      description,
      status: "Unfinished",
      user: userId,
      order: Date.now(),
      reminder: false  // wird später nutzbar gemacht
    };

    try {
      await wixData.insert("ToDos", newTask);
      wixLocation.to(CANCEL_URL);  // Zurück zur Kursübersicht
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
    }
  });

  // Abbrechen
  $w('#button5').onClick(() => {
    wixLocation.to(CANCEL_URL);
  });
});
