var updateDelay = 0; // Debouncing time (ms) between filters
var checkInBtn = $('#checkin-btn');

// same as in index.js. sue me.
function anyStartsWith(arr, prefix) {
  return arr.some(function(elem) {
    return elem.lastIndexOf(prefix, 0) === 0; // elem starts with prefix
  });
}

// Just the name part of matchRushee in index.js. Again, i am open to being sued.
function matchName(rushee, filter) {
  if (!filter)
    return false;
  var filterItems = filter.toLowerCase().split(' ');
  var rusheeNames = rushee.name.toLowerCase().split(' ');
  return filterItems.every(function(filterItem) {
    return anyStartsWith(rusheeNames, filterItem);
  });
}

function filterRushees(filter) {
  var firstVisibleEntry = null;
  rusheeInfo.forEach(function(rushee) {
    var entry = $('#returner-entry-' + rushee.id);
    if (matchName(rushee, filter)) {
      if (!firstVisibleEntry) {
        firstVisibleEntry = entry.find('input');
        firstVisibleEntry.prop('checked', true);
      }
      entry.show();
    }
    else
      entry.hide();
  });
  checkInBtn.prop('disabled', !firstVisibleEntry);
}

var nextFilter; // timeout

// Filter rushees on input
var search = $('#returner-search-input');
search.on('input', function() {
  var filter = this.value;
  if (nextFilter) clearTimeout(nextFilter);
  nextFilter = setTimeout(function() {
    filterRushees(filter || '');
  }, updateDelay);
});
filterRushees('');

checkInBtn.click(function() {
  var rusheeId = $('.checkin-radio:checked').val();
  $.post('/checkin/' + rusheeId, {}, function() {
    // TODO: clear form
  });
});
