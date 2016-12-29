initRating(rushee, true);

var summary = $('#detail-summary');
autosize(summary);

var hist_elem = $('#histogram');
var histogram = new Histogram(hist_elem, ratings);

summary.keydown(function(e) {
  if (e.keyCode == 13 && !e.shiftKey) {
    e.preventDefault();
    $.post('/summary/' + rushee.id, { summary: this.value }, function() {
      summary.blur();
    });
  }
});

traits.forEach(function(trait) {
  var checkbox = $('input[id^="trait-vote-' + encodeURI(trait.trait_name) +'"]');
  checkbox.attr('checked', trait.voted);
  // make trait vote when the plus sign is clicked
  checkbox.click(function() {
    var checked = checkbox.is(':checked');
    $.post('/rushee/' + rushee.id + '/trait/' + trait.trait_name, { vote: checked }, function() {
      location.reload();
    });
  });
});

var trait_input = $('#trait-input');
trait_input.keydown(function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    $.post('/rushee/' + rushee.id + '/new_trait/' + this.value, {}, function() {
      location.reload();
    });
  }
});

var comment_input = $('#comment-input');
autosize(comment_input);
comment_input.keydown(function(e) {
  if (e.keyCode == 13) {
    e.preventDefault();
    $.post('/rushee/' + rushee.id + '/comment', { comment: this.value }, function done() {
      location.reload();
    });
  }
});
