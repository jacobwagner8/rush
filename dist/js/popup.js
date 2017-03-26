function initPopup(elem) {
  return function showResult(message) {
    elem.text(message);
    elem.addClass('enabled');
    setTimeout(function() {
      elem.removeClass('enabled');
    }, 1000);
  }
}
