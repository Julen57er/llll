import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixUsers from 'wix-users';

const TARGET_URL = 'https://luxelinkonline.wixstudio.com/llll/dashboard/academy/course-catalog-1-1';
let activeTask = null;
let isPanelBusy = false;

$w.onReady(async () => {
  $w('#createTaskButton').onClick(() => redirectToCreateTask());
  $w('#taskTitleInput').onKeyPress((event) => {
    if (event.key === 'Enter') redirectToCreateTask();
  });

  try {
    const res = await wixData.query('Import904').find();
    const options = res.items.map(course => ({ label: course.title, value: course._id }));
    $w('#detailCourseDropdown').options = options;
  } catch (err) {
    console.error('❌ Fehler beim Laden der Kurse:', err);
  }

  loadTasksForStatus('Unfinished', '#todoRepeater', '', '');
  loadTasksForStatus('In Progress', '#inProgressRepeater', '2', '2');
  loadTasksForStatus('Done', '#doneRepeater', '3', '3');

  $w('#closeDetailsButton').onClick(() => {
    $w('#detailPanel').collapse();
    activeTask = null;
    isPanelBusy = false;
  });

  $w('#saveDetailsButton').onClick(() => {
    if (!activeTask) return;
    const updated = {
      ...activeTask,
      title: $w('#detailTitleInput').value,
      status: $w('#detailStatusDropdown').value,
      dueDate: $w('#detailDatePicker').value,
      courseRef: $w('#detailCourseDropdown').value,
      reminder: $w('#detailReminderCheckbox').checked,
      description: $w('#detailDescriptionInput').value,
      priority: $w('#detailPriorityDropdown').value
    };
    wixData.update('ToDos', updated).then(() => {
      $w('#detailPanel').collapse();
      activeTask = null;
      isPanelBusy = false;
    }).catch(err => {
      console.error("❌ Fehler beim Speichern:", err);
    });
  });
});

function redirectToCreateTask() {
  const title = $w('#taskTitleInput').value?.trim();
  if (!title) return;
  wixLocation.to(`${TARGET_URL}?title=${encodeURIComponent(title)}`);
}

function loadTasksForStatus(status, repeaterId, suffix, prioSuffix) {
  wixData.query('ToDos')
    .eq('status', status)
    .ascending('order')
    .find()
    .then(results => {
      $w(repeaterId).data = results.items;
      $w(repeaterId).onItemReady(($item, itemData) => {
        $item(`#taskTitle${suffix}`).text = itemData.title || 'Ohne Titel';
        $item(`#dueDateText${suffix}`).text = itemData.dueDate
          ? new Date(itemData.dueDate).toLocaleDateString('de-DE')
          : 'Kein Datum';

        const prio = (itemData.priority || '').toLowerCase();
        const boxId = `#priorityBox${prioSuffix}`;
        if ($item(boxId) && typeof $item(boxId).changeState === 'function') {
          switch (prio) {
            case 'hoch': case 'high': $item(boxId).changeState('hoch'); break;
            case 'mittel': case 'middle': $item(boxId).changeState('mittel'); break;
            case 'niedrig': case 'low': $item(boxId).changeState('niedrig'); break;
            default: $item(boxId).hide();
          }
        }

        $item('#edit').onClick(() => {
          if (isPanelBusy && activeTask && activeTask._id === itemData._id) {
            console.log('🛑 Panel bereits geöffnet für diese Task.');
            return;
          }

          isPanelBusy = true;
          activeTask = itemData;
          console.log('🧠 Panel öffnet mit:', itemData);
          fillDetailPanel(itemData);
        });
      });
    })
    .catch(err => console.error(`❌ Fehler beim Laden von "${status}":`, err));
}

function fillDetailPanel(itemData) {
  console.log('🧪 STARTE fillDetailPanel für Task-ID:', itemData._id);

  $w('#detailPanel').expand().then(() => {
    const safeSet = (label, selector, value) => {
      const el = $w(selector);
      const old = 'value' in el ? el.value : el.checked;
      if ('value' in el) el.value = value;
      else if ('checked' in el) el.checked = !!value;
      console.log(`🔍 ${label}: Vorher = ${old} | ✅ Neu = ${value}`);
    };

    safeSet('Titel', '#detailTitleInput', itemData.title || '');
    safeSet('Status', '#detailStatusDropdown', itemData.status || '');
    safeSet('Fälligkeitsdatum', '#detailDatePicker', itemData.dueDate ? new Date(itemData.dueDate) : null);
    safeSet('Beschreibung', '#detailDescriptionInput', itemData.description || '');
    safeSet('Erinnerung', '#detailReminderCheckbox', itemData.reminder || false);

    // Kurs
    const kursOpt = $w('#detailCourseDropdown').options.map(opt => opt.value);
    if (kursOpt.includes(itemData.courseRef)) {
      safeSet('Kurs', '#detailCourseDropdown', itemData.courseRef);
    } else {
      console.warn('⚠️ Kurs nicht im Dropdown:', itemData.courseRef);
    }

    // Priorität
    const prioOpt = $w('#detailPriorityDropdown').options.map(opt => opt.value.toLowerCase());
    const current = (itemData.priority || '').toLowerCase();
    if (prioOpt.includes(current)) {
      safeSet('Priorität', '#detailPriorityDropdown', current);
    } else {
      console.warn('⚠️ Priorität nicht im Dropdown:', current);
    }

    console.log('✅ Sichtbarer Titel im Eingabefeld gesetzt:', itemData.title);
  });
}
