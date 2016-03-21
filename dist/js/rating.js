function initRating(rushee) {
  var rating = $('#rating-' + rushee.id);
  rating.avg_rating = rushee.avg_rating;
  rating.rushee_id = rushee.id;
  rating.own_rating = rushee.own_rating;
  rating.checkedStar = null; // star that the user checked
  rating.activeStar = null; // star representing this rushee's avg rating
  rating.stars = [];

  function checkStar(star) {
    if (rating.checkedStar != null)
      rating.checkedStar.removeAttr('checked');
    star.attr('checked', '');
    rating.checkedStar = star;
  }

  function activateStar(starIdx) {
    if (rating.activeStar != null)
      rating.activeStar.removeAttr('active');
    rating.stars[starIdx].attr('active', '');
    rating.activeStar = rating.stars[starIdx];
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
        checkStar(self);
        $.post('/rate/' + rating.rushee_id, { rating: number }, function(data) {
          var avg_rounded = Math.round(data.avg);
          activateStar(avg_rounded);
        }, 'json');
      });
    });

  // set active star to reflect avg rating
  if (rating.avg_rating != null) {
    var rating_rounded = Math.round(rating.avg_rating);
    activateStar(rating_rounded);
  }
}