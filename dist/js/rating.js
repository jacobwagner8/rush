function initRating(rushee) {
  // make stars rate rushees on click
  $('input[id^="rating-input-' + rushee.id +'-"]')
    .each(function(idx, elem) {
      var number = elem.id.slice(-1) - '0';
      $(this).click(function() {
        $.post('/rate/' + rushee.id, { rating: number });
      });
    });

  // set correct button checked
  document.getElementById("rating-input-" + rushee.id + '-' + Math.round(rushee.avg_rating)).checked = true;
}