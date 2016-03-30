function initRating(rushee) {
  var rating = $('#rating-' + rushee.id);
  rating.avg_rating = rushee.avg_rating;
  rating.rushee_id = rushee.id;
  rating.own_rating = rushee.own_rating;
  rating.checkedStar = null; // star that the user checked
  rating.activeStar = null; // star representing this rushee's avg rating
  rating.stars = [];
  rating.avg = $('#avg-rating-' + rushee.id);

  function checkStar(star) {
    if (rating.checkedStar)
      rating.checkedStar.removeAttr('checked');
    if (star)
      star.attr('checked', '');
    rating.checkedStar = star;
  }

  function activateStar(starIdx) {
    if (rating.activeStar)
      rating.activeStar.removeAttr('active');
    if (starIdx) {
      rating.stars[starIdx].attr('active', '');
      rating.activeStar = rating.stars[starIdx];
    }
  }

  function setActiveStar(response) {
    var avg_rounded = Math.round(response.avg);
    activateStar(avg_rounded);
    rating.avg.text(Math.round(response.avg * 100) / 100); // round to 2 decimal places
  }

  // make stars rate rushees on click
  // also check the star corresponding to own_rating, if any
  $('[id^="rating-input-' + rating.rushee_id +'-"]')
    .each(function(idx, elem) {
      var self = $(this);
      var number = elem.id.slice(-1) - '0';
      rating.stars[number] = self;

      if (number == rating.own_rating)
        checkStar(self);

      $(this).click(function(e) {
        e.preventDefault();
        if (rating.checkedStar == self) {
          checkStar(null);
          $.post('/unrate/' + rating.rushee_id, {}, setActiveStar, 'json');
        }
        else {
          checkStar(self);
          $.post('/rate/' + rating.rushee_id, { rating: number }, setActiveStar, 'json');
        }
      });
    });

  // set active star to reflect avg rating
  if (rating.avg_rating != null) {
    var rating_rounded = Math.round(rating.avg_rating);
    activateStar(rating_rounded);
  }
}