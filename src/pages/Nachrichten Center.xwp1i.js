import wixUsers from 'wix-users';
import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(() => {
  const user = wixUsers.currentUser;
  const userId = user.id;

  $w('#editContainer').hide();
  $w('#infoContainer').show();
  $w('#success').hide();

  if (user.loggedIn) {
    wixData.query("Import414")
      .eq("memberId", userId)
      .find()
      .then((res) => {
        if (res.items.length > 0) {
          const item = res.items[0];

          $w('#inputFirstName').value = item.firstName || '';
          $w('#inputLastName').value = item.lastName || '';
          $w('#inputNickname').value = item.nickname || '';
          $w('#inputSpecialization').value = item.specialization || '';
          $w('#inputTags').value = item.tags || '';
          $w('#inputEmail').value = item.email || '';
          $w('#inputAbout').value = item.about || '';

          $w('#displayName').text = `${item.firstName || ''} ${item.lastName || ''}`;
          $w('#displayUsername').text = `@${item.nickname || ''}`;
          $w('#displaySpecialization').text = item.specialization || '';
          $w('#displayEmail').text = item.email || '';
          $w('#displayAbout').text = item.about || '';
        }
      })
      .catch((err) => {
        console.error("❌ Fehler beim Laden der Profildaten:", err);
      });
  }
});

$w('#editBtn').onClick(() => {
  console.log("🟣 editBtn wurde geklickt");
  $w('#infoContainer').hide();
  $w('#editContainer').show();
});

// ✅ SPEICHERN MIT EMAIL-CHECK + FEEDBACK
$w('#btnSaveProfile').onClick(async () => {
  const userId = wixUsers.currentUser.id;
  const newEmail = $w('#inputEmail').value;

  // Überprüfe, ob die E-Mail schon einem anderen Nutzer gehört
  const emailExists = await wixData.query("Import414")
    .eq("email", newEmail)
    .ne("memberId", userId)
    .find();

  if (emailExists.totalCount > 0) {
    console.warn("❌ E-Mail-Adresse ist bereits vergeben.");
    $w('#success').text = "Diese E-Mail-Adresse ist bereits mit einem anderen Konto verknüpft.";
    $w('#success').show();
    setTimeout(() => $w('#success').hide(), 5000);
    return;
  }

  try {
    const res = await wixData.query("Import414").eq("memberId", userId).find();
    if (res.items.length === 0) {
      console.warn("⚠️ Kein Datensatz zum Aktualisieren gefunden.");
      return;
    }

    const item = res.items[0];

    // Eingaben übernehmen
    item.firstName = $w('#inputFirstName').value;
    item.lastName = $w('#inputLastName').value;
    item.nickname = $w('#inputNickname').value;
    item.specialization = $w('#inputSpecialization').value;
    item.tags = $w('#inputTags').value;
    item.email = newEmail;
    item.about = $w('#inputAbout').value;

    // Uploads
    if ($w('#uploadProfileImage').value.length > 0) {
      const profileUpload = await $w('#uploadProfileImage').startUpload();
      item.profilePicture = profileUpload.url;
    }

    if ($w('#uploadBackgroundImage').value.length > 0) {
      const bgUpload = await $w('#uploadBackgroundImage').startUpload();
      item.banner = bgUpload.url;
    }

    await wixData.update("Import414", item);

    // Anzeige aktualisieren
    $w('#displayName').text = `${item.firstName || ''} ${item.lastName || ''}`;
    $w('#displayUsername').text = `@${item.nickname || ''}`;
    $w('#displaySpecialization').text = item.specialization || '';
    $w('#displayEmail').text = item.email || '';
    $w('#displayAbout').text = item.about || '';

    // Erfolgsanzeige
    $w('#editContainer').hide();
    $w('#infoContainer').show();
    $w('#success').text = "Dein Profil wurde erfolgreich gespeichert.";
    $w('#success').show();
    setTimeout(() => $w('#success').hide(), 3000);

    console.log("✅ Profil gespeichert & Anzeige aktualisiert.");
  } catch (err) {
    console.error("❌ Fehler beim Speichern:", err);
  }
});

// ✅ ABBRECHEN
$w('#btnCancelProfile').onClick(() => {
  console.log("⛔️ Bearbeitung abgebrochen");
  $w('#editContainer').hide();
  $w('#infoContainer').show();
});
