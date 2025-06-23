import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Funktion zur Slug-Erzeugung aus Titel
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

$w.onReady(() => {
  console.log("Lightbox ready");

  // Gruppen-Dropdown befüllen
  wixData.query("Groups")
    .find()
    .then((results) => {
      const options = results.items.map(group => ({
        label: group.title,
        value: group._id
      }));
      $w("#groupDropdown").options = options;
    })
    .catch((err) => {
      console.error("Group loading failed:", err);
    });

  // Cancel Button: Lightbox schließen
  $w("#cancelButton").onClick(() => {
    wixWindow.lightbox.close();
  });

  // Submit Button
  $w("#submitButton").onClick(async () => {
    console.log("Submit button clicked");

    // Eingaben sammeln
    const groupId = $w("#groupDropdown").value;
    const postTitle = $w("#postTitleInput").value;
    const postContent = $w("#postContentInput").value;
    const tags = $w("#tagInput").value;
    const isVisible = $w("#visibleCheckbox").checked;
    const isPinned = $w("#pinnedCheckbox").checked;

    // Validierung
    if (!groupId || !postTitle || !postContent) {
      console.log("Validation failed: groupId, title, content required.");
      return;
    }

    // User-ID holen
    const wixUserId = wixUsers.currentUser.id;
    console.log("Current Wix User ID:", wixUserId);

    let authorNickname = null;

    // Nickname aus Import414 holen über memberId
    try {
      const userQuery = await wixData.query("Import414")
        .eq("memberId", wixUserId)
        .find();

      console.log("Import414 query result:", userQuery.items);

      if (userQuery.items.length > 0) {
        authorNickname = userQuery.items[0].nickname;
        console.log("Nickname found:", authorNickname);
      } else {
        console.log("Nickname not found for user.");
        return;
      }
    } catch (err) {
      console.error("Error while querying Import414:", err);
      return;
    }

    // Datei-Upload (optional)
    let attachmentUrl = null;
    if ($w("#attachmentUploader").value.length > 0) {
      try {
        const uploadResult = await $w("#attachmentUploader").uploadFiles();
        if (uploadResult.length > 0 && uploadResult[0].fileUrl) {
          attachmentUrl = uploadResult[0].fileUrl;
        }
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        return;
      }
    }

    // Postdaten vorbereiten
    const postData = {
      groupId: groupId,
      author: authorNickname,
      title: postTitle,
      content: postContent,
      attachments: attachmentUrl,
      tags: tags,
      createdDate: new Date(),
      isVisible: isVisible,
      isPinned: isPinned,
      likes: 0,
      slug: createSlug(postTitle)
    };

    // In Datenbank speichern
    wixData.insert("GroupPosts", postData)
      .then(() => {
        console.log("Post created successfully.");
        wixWindow.lightbox.close();

        // Nach kurzer Verzögerung Seite neu laden
        setTimeout(() => {
          wixLocation.to(wixLocation.url);
        }, 300);
      })
      .catch((err) => {
        console.error("Error inserting post:", err);
      });
  });
});
