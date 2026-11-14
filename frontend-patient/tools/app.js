// Small navigation layer shared by every screen: the wireframes were rendered
// from design components, so primary actions are plain <button>/<label>
// elements. Anything carrying data-href behaves like a link.
(function () {
  function go(href) {
    if (href) window.location.href = href;
  }

  function canGoBack() {
    if (!document.referrer) return false;
    try {
      return new URL(document.referrer).origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target;

    if (target.closest('[data-unavailable]')) {
      event.preventDefault();
      return;
    }

    var back = target.closest('a[aria-label="Back"]');
    if (back && canGoBack()) {
      event.preventDefault();
      window.history.back();
      return;
    }

    var action = target.closest('[data-href]');
    if (action) {
      // a label would otherwise also toggle its hidden checkbox
      if (action.tagName === 'LABEL') event.preventDefault();
      go(action.getAttribute('data-href'));
      return;
    }

    // links the wireframes left as placeholders should not jump the page
    var placeholder = target.closest('a[href="#"]');
    if (placeholder) event.preventDefault();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var action = event.target.closest('[data-href]');
    if (!action || action.tagName === 'BUTTON' || action.tagName === 'A') return;
    event.preventDefault();
    go(action.getAttribute('data-href'));
  });
})();
