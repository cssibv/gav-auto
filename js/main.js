// GAV Auto — comportament partajat (meniu mobil, header la scroll, reveal)
(function () {
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var header = document.getElementById('header');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
      });
    });
  }

  if (header) {
    var tick = false;
    function onScroll() {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        header.classList.toggle('scrolled', window.scrollY > 8);
        tick = false;
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // FAQ acordeon: o singură întrebare deschisă pe rând
  document.querySelectorAll('.faq').forEach(function (group) {
    var items = group.querySelectorAll('details');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) {
          items.forEach(function (o) { if (o !== d) o.open = false; });
        }
      });
    });
  });

  var rv = document.querySelectorAll('.rv');
  if (rv.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }
})();
