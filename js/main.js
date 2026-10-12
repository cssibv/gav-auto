// GAV Auto: comportament partajat (meniu mobil, header la scroll, reveal)
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

  // Slider înainte/după: tragi cu mouse-ul sau degetul, ori săgețile de la tastatură
  document.querySelectorAll('.ba-frame').forEach(function (frame) {
    var range = frame.querySelector('.ba-range');
    var drag = false;
    function set(p) {
      p = Math.max(0, Math.min(100, p));
      frame.style.setProperty('--pos', p + '%');
      if (range) range.value = p;
    }
    function fromPointer(e) {
      var r = frame.getBoundingClientRect();
      set((e.clientX - r.left) / r.width * 100);
    }
    frame.addEventListener('pointerdown', function (e) {
      drag = true;
      if (frame.setPointerCapture) frame.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    frame.addEventListener('pointermove', function (e) { if (drag) fromPointer(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      frame.addEventListener(t, function () { drag = false; });
    });
    if (range) range.addEventListener('input', function () { set(+range.value); });
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

// Cookie-uri: Google Analytics pornește doar după ce vizitatorul acceptă
(function () {
  var GA_ID = ''; // ID de măsurare GA4 (G-XXXXXXXXXX); cât e gol, nu apare bannerul și nu se încarcă nimic
  var PREVIEW = /^(127\.0\.0\.1|localhost)$/.test(location.hostname); // pe copia locală bannerul apare și fără ID
  if (!GA_ID && !PREVIEW) return;

  var BASE = document.currentScript ? document.currentScript.src.replace(/js\/main\.js.*$/, '') : '/';
  var KEY = 'gav-cookies';
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // după un an întrebăm din nou

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return v && Date.now() - v.t < MAX_AGE ? v.c : null;
    } catch (e) { return null; }
  }
  function save(c) {
    try { localStorage.setItem(KEY, JSON.stringify({ c: c, t: Date.now() })); } catch (e) {}
  }

  function startGA() {
    if (!GA_ID || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  function stopGA() {
    if (!window.gtag) return;
    window['ga-disable-' + GA_ID] = true;
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    });
  }
  function track(name) { if (window.gtag) window.gtag('event', name); }

  function show() {
    if (document.getElementById('cookie-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'cookie-bar';
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie-uri');
    bar.innerHTML = '<p><b>Cookie-uri</b>Folosim Google Analytics ca să vedem câți oameni ne vizitează site-ul și ce pagini caută. Îl pornim doar dacă ești de acord. <a href="' + BASE + 'confidentialitate/">Detalii</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-soft" data-c="denied">Refuz</button>' +
      '<button type="button" class="btn btn-primary" data-c="granted">Accept</button>' +
      '</div>';
    bar.addEventListener('click', function (e) {
      var c = e.target.getAttribute && e.target.getAttribute('data-c');
      if (!c) return;
      save(c);
      if (c === 'granted') startGA(); else stopGA();
      bar.remove();
    });
    document.body.appendChild(bar);
  }

  var choice = read();
  if (choice === 'granted') startGA();
  else if (choice === null) {
    // nu acoperim primul ecran: bannerul apare la prima derulare sau după 12 secunde
    var asked = false;
    var ask = function () {
      if (asked) return;
      asked = true;
      window.removeEventListener('scroll', onFirstScroll);
      show();
    };
    var onFirstScroll = function () { if (window.scrollY > 200) ask(); };
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    setTimeout(ask, 12000);
  }

  // alegerea se poate schimba oricând din subsol
  var legal = document.querySelector('footer .legal-links') || document.querySelector('footer .legal');
  if (legal) {
    var link = document.createElement('button');
    link.type = 'button';
    link.className = 'cookie-link';
    link.textContent = 'Setări cookie-uri';
    link.addEventListener('click', show);
    legal.appendChild(link);
  }

  // ce contează pentru service: apel, WhatsApp, formular
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    var href = a ? a.getAttribute('href') || '' : '';
    if (href.indexOf('tel:') === 0) track('click_telefon');
    else if (href.indexOf('wa.me') > -1) track('click_whatsapp');
  });
  document.addEventListener('submit', function () { track('generate_lead'); });
})();

// Formularul de ofertă: deschide WhatsApp cu mesajul gata scris și trimite o copie pe email
(function () {
  var FORM_EMAIL = ''; // adresa pe care vine copia cererii (prin Formsubmit); cât e goală, se deschide doar WhatsApp
  var form = document.querySelector('form[data-wa]');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    if (f._honey && f._honey.value) return; // completat doar de roboți
    var data = {
      Nume: f.nume.value.trim(),
      Telefon: f.telefon.value.trim(),
      'Mașina': f.masina.value.trim(),
      'Am nevoie de': f.serviciu.value,
      Detalii: f.detalii.value.trim()
    };
    var lines = ['Bună ziua, aș dori o ofertă de la GAV Auto.'];
    Object.keys(data).forEach(function (k) { if (data[k]) lines.push(k + ': ' + data[k]); });

    // WhatsApp se deschide primul, direct din click, altfel browserul îl blochează ca pop-up
    window.open('https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');

    if (FORM_EMAIL && window.fetch) {
      data._subject = 'Cerere de ofertă de pe site: ' + data.Nume;
      data._template = 'table';
      data._captcha = 'false';
      fetch('https://formsubmit.co/ajax/' + FORM_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function () {});
    }

    var note = form.querySelector('.form-alt');
    if (note) note.innerHTML = '<b>Mulțumim!</b> Dacă WhatsApp nu s-a deschis, sună la <a href="tel:0740039598">0740 039 598</a>.';
  });
})();
