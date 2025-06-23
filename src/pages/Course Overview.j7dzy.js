import wixData from 'wix-data';

let filterValues = {
  duration: [],
  difficult: [],
  ratings: []
};

let currentState = null;
let searchTerm = "";

$w.onReady(() => {
  $w('#multiStateBox1').collapse();

  // Neue Close-Buttons für explizites Schließen
  $w('#close1').onClick(() => {
    $w('#multiStateBox1').collapse();
    currentState = null;
  });

  $w('#close2').onClick(() => {
    $w('#multiStateBox1').collapse();
    currentState = null;
  });

  $w('#vecSorter').onClick(() => {
    if (currentState === 'State1') {
      $w('#multiStateBox1').collapse();
      currentState = null;
    } else {
      $w('#multiStateBox1').changeState("State1");
      $w('#multiStateBox1').expand();
      currentState = 'State1';
    }
  });

  $w('#vecFilter').onClick(() => {
    if (currentState === 'State2') {
      $w('#multiStateBox1').collapse();
      currentState = null;
    } else {
      $w('#multiStateBox1').changeState("State2");
      $w('#multiStateBox1').expand();
      currentState = 'State2';
      loadFilterOptions();
    }
  });

  $w('#sortDurationDownw').onClick(() => sortCoursesByDuration("desc"));
  $w('#sortDurationUpw').onClick(() => sortCoursesByDuration("asc"));
  $w('#sortDifficulty').onClick(() => sortCourses("difficult", "asc"));
  $w('#sortRating').onClick(() => sortCourses("ratings", "desc"));

  $w('#coursesearch').onInput((event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    applyFilters();
  });

  $w('#duroReap').onItemReady(($item, itemData) => {
    const isActive = filterValues.duration[0] === itemData.value;
    $item('#duration').show();
    $item('#duration').text = itemData.value;
    $item('#box103').style.backgroundColor = isActive ? 'rgba(251, 165, 39, 0.2)' : 'rgba(0, 0, 0, 0)';
    $item('#duration').onClick(() => {
      toggleFilter("duration", itemData.value);
    });
  });

  $w('#diffyReap').onItemReady(($item, itemData) => {
    const isActive = filterValues.difficult[0] === itemData.value;
    $item('#difficulty').show();
    $item('#difficulty').text = itemData.value;
    $item('#box104').style.backgroundColor = isActive ? 'rgba(251, 165, 39, 0.2)' : 'rgba(0, 0, 0, 0)';
    $item('#difficulty').onClick(() => {
      toggleFilter("difficult", itemData.value);
    });
  });

  $w('#rateReap').onItemReady(($item, itemData) => {
    const isActive = filterValues.ratings[0] === itemData.value;
    $item('#rating').show();
    $item('#rating').text = String(itemData.value);
    $item('#box105').style.backgroundColor = isActive ? 'rgba(251, 165, 39, 0.2)' : 'rgba(0, 0, 0, 0)';
    $item('#rating').onClick(() => {
      toggleFilter("ratings", itemData.value);
    });
  });
});

function loadFilterOptions() {
  wixData.query('Import904').find().then(res => {
    const items = res.items;
    const getUnique = (arr) => [...new Set(arr.filter(v => v !== undefined && v !== null && v !== ''))];

    const durations = getUnique(items.map(i => i.duration));
    const difficulties = getUnique(items.map(i => i.difficult));
    const ratings = getUnique(items.map(i => Number(i.ratings)).filter(v => !isNaN(v)));

    console.log("DURATION:", durations);
    console.log("DIFFICULT:", difficulties);
    console.log("RATINGS:", ratings);

    $w('#duroReap').data = durations.map((v, i) => ({ _id: String(i), value: v }));
    $w('#diffyReap').data = difficulties.map((v, i) => ({ _id: String(i), value: v }));
    $w('#rateReap').data = ratings.map((v, i) => ({ _id: String(i), value: v }));
  });
}

function sortCoursesByDuration(order) {
  wixData.query('Import904').find().then(res => {
    let items = res.items.map(item => {
      const match = item.duration.match(/\d+-?(\d+)/);
      const durationVal = match ? Number(match[1]) : 0;
      return { ...item, sortDuration: durationVal };
    });

    items.sort((a, b) => {
      return order === "asc"
        ? a.sortDuration - b.sortDuration
        : b.sortDuration - a.sortDuration;
    });

    $w('#coursesRepeater').data = items;
  });
}

function sortCourses(field, order) {
  let query = wixData.query('Import904');
  query = order === "desc" ? query.descending(field) : query.ascending(field);
  query.find().then(res => {
    $w('#coursesRepeater').data = res.items;
  });
}

function toggleFilter(category, value) {
  if (filterValues[category][0] === value) {
    filterValues[category] = [];
  } else {
    filterValues[category] = [value];
  }
  applyFilters();
}

function applyFilters() {
  updateFilterStyles();
  let query = wixData.query('Import904');

  if (filterValues.duration.length > 0) query = query.hasSome('duration', filterValues.duration);
  if (filterValues.difficult.length > 0) query = query.hasSome('difficult', filterValues.difficult);
  if (filterValues.ratings.length > 0) query = query.hasSome('ratings', filterValues.ratings);

  if (searchTerm.length > 0) {
    query = query.contains("title", searchTerm).or(wixData.query('Import904').contains("shortDescription", searchTerm));
  }

  query.find().then(res => {
    $w('#coursesRepeater').data = res.items;
  });
}

function updateFilterStyles() {
  const highlight = "rgba(251, 165, 39, 0.2)";
  const transparent = "rgba(0, 0, 0, 0)";

  $w("#duroReap").forEachItem(($item, itemData) => {
    const isActive = filterValues.duration.includes(itemData.value);
    $item("#box103").style.backgroundColor = isActive ? highlight : transparent;
  });

  $w("#diffyReap").forEachItem(($item, itemData) => {
    const isActive = filterValues.difficult.includes(itemData.value);
    $item("#box104").style.backgroundColor = isActive ? highlight : transparent;
  });

  $w("#rateReap").forEachItem(($item, itemData) => {
    const isActive = filterValues.ratings.includes(itemData.value);
    $item("#box105").style.backgroundColor = isActive ? highlight : transparent;
  });
}
