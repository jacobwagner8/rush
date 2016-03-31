// Init rating stars for each rushee
rushees.forEach(function(rushee) {
  initRating(rushee);
});

// Rushee Search

var updateDelay = 0; // Debouncing time (ms) between filters

var numRushees = rushees.length;
var rusheeCards = rushees.map(function(rushee) {
  return $('#rushee-card-' + rushee.id);
});

function anyStartsWith(arr, prefix) {
  return arr.some(function(elem) {
    return elem.lastIndexOf(prefix, 0) === 0; // elem starts with prefix
  });
}

var yearAliases = {
  'Fr': ['freshman', 'frosh'],
  'So': ['sophomore'],
  'Jr': ['junior', 'jr'],
  'Sr': ['senior', 'sr']
};

/**
 * Returns whether the given filter matches the given rushee
 * @param  {[type]} rushee [description]
 * @param  {[type]} filter [description]
 * @return {Boolean}        [description]
 */
function matchRushee(rushee, filter) {
  var filterItems = filter.toLowerCase().split(' ');
  var rusheeNames = rushee.name.toLowerCase().split(' ');
  var rusheeTraits = rushee.top_traits.map(function(x) { return x.trait_name.toLowerCase() });

  // each filter item must match the rushee
  var match = filterItems.every(function(filterItem) {
    // match name
    var matchName = anyStartsWith(rusheeNames, filterItem);
    if (matchName) return true;

    // match trait
    var matchTrait = anyStartsWith(rusheeTraits, filterItem);
    if (matchTrait) return true;

    // match dorm
    var matchDorm = rushee.dorm.toLowerCase().lastIndexOf(filterItem, 0) === 0;
    if (matchDorm) return true;

    // match year
    var matchYear = anyStartsWith(yearAliases[rushee.year], filterItem);
    if (matchYear) return true;

    return false;
  });

  return match;
}

function filterRushees(filter) {
  for (var i = 0; i < numRushees; i++) {
    if (matchRushee(rushees[i], filter))
      rusheeCards[i].show();
    else
      rusheeCards[i].hide();
  }
}

var search = $('#rushee-filter');
var nextFilter; // timeout

// filter on <enter>
search.keydown(function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    filterRushees(this.value || '');
  }
});

// filter 250ms after 
search.on('input', function() {
  var filter = this.value;
  if (nextFilter) clearTimeout(nextFilter);
  nextFilter = setTimeout(function() {
    filterRushees(filter || '');
  }, updateDelay);
});

// Remember scroll position 
$(function() {
   $(window).unload(function() {
      var scrollPosition = $(document).scrollTop();
      localStorage.setItem("scrollPosition", scrollPosition);
   });
   if(localStorage.scrollPosition) {
      $(document).scrollTop(localStorage.getItem("scrollPosition"));
   }
});
