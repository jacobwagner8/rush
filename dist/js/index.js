rushees.forEach(function(rushee) {
  // find rating stars for this rushee
  // set onClick methods
  // TODO
  // set correct button checked
  document.getElementById("rating-input-" + rushee.id + '-' + Math.round(rushee.avg_rating)).checked = true;
});