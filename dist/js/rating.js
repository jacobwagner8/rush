function initRating(rushee) {
  var own_rating = rushee.own_rating;
  var checkedStar = null; // star that the user checked
  var activeStar = null; // star representing this rushee's avg rating
  var stars = [];

  function checkStar(star) {
    if (checkedStar != null)
      checkedStar.removeAttr('checked');
    star.attr('checked', '');
    checkedStar = star;
  }

  function activateStar(starIdx) {
    if (activeStar != null)
      activeStar.removeAttr('active');
    stars[starIdx].attr('active', '');
    activeStar = stars[starIdx];
  }

  // make stars rate rushees on click
  // also check the star corresponding to own_rating, if any
  $('[id^="rating-input-' + rushee.id +'-"]')
    .each(function(idx, elem) {
      var self = $(this);
      var number = elem.id.slice(-1) - '0';
      stars[number] = self;

      if (number == own_rating)
        checkStar(self);

      $(this).click(function(e) {
        e.preventDefault();
        checkStar(self);
        $.post('/rate/' + rushee.id, { rating: number }, function(data) {
          var avg_rounded = Math.round(data.avg);
          activateStar(avg_rounded);
        }, 'json');
      });
    });

  // set active star to reflect avg rating
  var rating_rounded = Math.round(rushee.avg_rating);
  activateStar(rating_rounded);
}