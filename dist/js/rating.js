function initRating(rushee) {
  var ownRating = rushee.ownRating;
  var checkedStar = null;
  var activeStar = null;

  function checkStar(star) {
    if (checkedStar != null)
      checkedStar.removeAttr('checked');
    star.attr('checked', '');
    checkedStar = star;
  }

  // make stars rate rushees on click
  // also check the star corresponding to ownRating, if any
  $('[id^="rating-input-' + rushee.id +'-"]')
    .each(function(idx, elem) {
      var self = $(this);
      var number = elem.id.slice(-1) - '0';

      if (number == ownRating)
        checkStar(self);

      $(this).click(function(e) {
        e.preventDefault();
        checkStar(self);
        $.post('/rate/' + rushee.id, { rating: number });
      });
    });

  // set active star to reflect avg rating
  var active_star = document.getElementById("rating-input-" + rushee.id + '-' + Math.round(rushee.avg_rating));
  if (active_star != null)
    $(active_star).attr('active', '');
}