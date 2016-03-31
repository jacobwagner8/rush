/**
 * Sets up histogram on element
 * Use:
 * var hist = new Histogram(elem)
 * @param  {jQuery object} elem
 * @param  {5-element array} ratings
 * @return {[type]}      [description]
 */
function Histogram(elem, ratings) {
  this.elem = elem;
  this.ratings = ratings;

  var height = elem.find('.hist-bars').innerHeight();

  var maxRating = Math.max.apply(Math, ratings) || 1;

  for (var i = 1; i <= 5; i++) {
    var bar = elem.find('.hist-bar-' + i);
    bar.outerHeight(height * ratings[i] / maxRating);
    bar.attr('data-count', ratings[i]);
  }
}
