initRating(rushee);

var summary = $('#detail-summary');
autosize(summary);

summary.keydown(function(e) {
  if (e.keyCode == 13 && !e.shiftKey) {
    e.preventDefault();
    $.post('/summary/' + rushee.id, { summary: this.value });
  }
});