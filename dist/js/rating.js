/**
 * Initializes the 5-star rating widget
 * checked star = user's rating
 * active star = rushee score indicator
 * @param {*Rushee object as returned by getAllHydrated} rushee 
 * @param {*Boolean, whether to reload the page on user interaction} reloadOnChange 
 */
function initRating(rushee, reloadOnChange) {
  var rating = $('#rating-' + rushee.id);
  rating.checkedStar = null;
  rating.activeStar = null;
  rating.stars = [];
  rating.score = $('#score-' + rushee.id);

  function checkStar(star) {
    if (rating.checkedStar)
      rating.checkedStar.removeAttr('checked');
    if (star)
      star.attr('checked', '');
    rating.checkedStar = star;
  }

  function activateStar(starIdx) {
    if (rating.activeStar) rating.activeStar.removeAttr('active');
    rating.stars[starIdx].attr('active', '');
    rating.activeStar = rating.stars[starIdx];
  }

  function handleChange(response) {
    if (reloadOnChange) {
      location.reload();
    }
    else {
      var score_rounded = Math.round(response.score);
      activateStar(score_rounded);
      var score_truncated = Math.round(response.score * 100) / 100;
      rating.score.text('' + score_truncated + ' (' + (response.count) + ')'); // round to 2 decimal places
    }
  }

  // make stars rate rushees on click
  // also check the star corresponding to own_rating, if any
  $('[id^="rating-input-' + rushee.id +'-"]')
    .each(function(idx, elem) {
      var self = $(this);
      var number = elem.id.slice(-1) - '0';
      rating.stars[number] = self;

      if (number == rushee.own_rating)
        checkStar(self);

      $(this).click(function(e) {
        e.preventDefault();
        if (rating.checkedStar == self) {
          checkStar(null);
          $.post('/unrate/' + rushee.id, {}, handleChange, 'json');
        }
        else {
          checkStar(self);
          $.post('/rate/' + rushee.id, { rating: number }, handleChange, 'json');
        }
      });
    });

  // set active star to reflect score
  activateStar(Math.round(rushee.score));
}