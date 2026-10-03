/* Estovam Tech site script. Loaded on every page.
   Edit the two settings below. Everything else draws from them:
   the header, the bottom bar (nav, clock, contact), the phone menu and the footer.

   Each page gives this script three empty places to fill:
     <header class="es-header" data-hud="Robotics engineering|Rev 0.3"></header>
     <footer class="es-cta" id="contact"></footer>
     <div class="es-bar es-bar--fixed"></div>
   data-hud is the HUD line next to the logo. Split the facts with "|". */

var SITE = {
  // Where every "Contact us" goes. Change it here and it changes everywhere.
  contact: "https://www.linkedin.com/company/146629113/",

  // The nav list. "path" is the folder from the site root. "" is Home.
  // To add a page: copy _template, then add a line here.
  nav: [
    { label: "Home",   path: "" },
    { label: "Robots", path: "robots/" },
    { label: "Blog",   path: "blog/" },
    { label: "About",  path: "about/" }
  ]
};

/* ---------- Nothing below needs editing to add pages ---------- */
(function () {
  var script = document.currentScript;
  // The site root is two folders up from assets/js/site.js, so links work from any page depth.
  var root = new URL("../../", script.src).href;
  var onDisk = location.protocol === "file:";

  // Folders need an explicit index.html when a page is opened straight from disk.
  function href(path) {
    return root + path + (onDisk && (path === "" || path.slice(-1) === "/") ? "index.html" : "");
  }

  // Which nav item are we on? "" matches only Home; other paths match anything inside their folder.
  var here = location.href.indexOf(root) === 0 ? location.href.slice(root.length).split(/[?#]/)[0].replace(/index\.html$/, "") : null;
  function isCurrent(item) {
    if (here === null) return false;
    return item.path === "" ? here === "" : here.indexOf(item.path) === 0;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  var logo = '<a class="es-logo" href="' + href("") + '" aria-label="Estovam Tech home">' +
    '<img class="for-dark" src="' + root + 'assets/img/lockup-white.png" alt="Estovam Tech">' +
    '<img class="for-light" src="' + root + 'assets/img/lockup-black.png" alt="Estovam Tech"></a>';

  function navLinks(cls) {
    return SITE.nav.map(function (item) {
      return '<a class="' + cls + '" href="' + href(item.path) + '"' + (isCurrent(item) ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("");
  }

  // Header: logo + one HUD line from data-hud
  var header = document.querySelector("header.es-header");
  if (header) {
    header.innerHTML = logo + '<p class="es-hud"></p>';
    var hud = header.querySelector(".es-hud");
    var facts = (header.getAttribute("data-hud") || "").split("|");
    hud.appendChild(document.createTextNode("// "));
    facts.forEach(function (fact, i) {
      if (i) hud.appendChild(el("span", "sep", "//"));
      if (i === facts.length - 1 && facts.length > 1) hud.appendChild(el("b")).textContent = fact;
      else hud.appendChild(document.createTextNode(fact));
    });
  }

  // Footer: the giant contact link
  var footer = document.querySelector("footer.es-cta");
  if (footer) {
    footer.innerHTML =
      '<div class="es-cta__row es-hud"><span>Interested in what we\'re building?</span><span><a href="' + SITE.contact + '" target="_blank" rel="noopener noreferrer">LinkedIn</a></span></div>' +
      '<a class="es-cta__big es-display" href="' + SITE.contact + '" target="_blank" rel="noopener noreferrer">Contact us</a>' +
      '<div class="es-cta__row es-hud"><span>&copy; 2026 Estovam Tech</span><span>Robotics engineering</span></div>';
  }

  // Bottom bar: nav, phone menu button, clock, contact
  var bar = document.querySelector(".es-bar");
  if (bar) {
    bar.innerHTML =
      '<nav aria-label="Main">' + navLinks("es-link") + "</nav>" +
      '<button class="es-link es-bar__menu" type="button" aria-haspopup="dialog" aria-controls="es-menu" aria-expanded="false">Menu</button>' +
      '<div class="es-bar__right"><span class="es-bar__clock"><span class="es-tag es-tag--blink" aria-hidden="true"></span><span id="clock">--:--:--</span></span>' +
      '<a class="es-btn" href="' + SITE.contact + '" target="_blank" rel="noopener noreferrer"><span class="es-long">Contact us</span><span class="es-short">Contact</span></a></div>';

    // Full-screen menu for phones
    var menu = el("div", "es-menu");
    menu.id = "es-menu";
    menu.hidden = true;
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Menu");
    menu.innerHTML = '<div class="es-menu__top">' + logo + '<button class="es-btn es-btn--line" type="button">Close</button></div>' +
      '<nav aria-label="Menu">' + navLinks("es-display") +
      '<a class="es-display" href="' + SITE.contact + '" target="_blank" rel="noopener noreferrer">Contact</a></nav>';
    document.body.appendChild(menu);

    var opener = bar.querySelector(".es-bar__menu"), closer = menu.querySelector(".es-btn");
    function setMenu(open) {
      menu.hidden = !open;
      document.documentElement.classList.toggle("es-menu-open", open);
      opener.setAttribute("aria-expanded", open);
      if (open) closer.focus({ preventScroll: true });
      else opener.focus({ preventScroll: true });
    }
    opener.addEventListener("click", function () { setMenu(true); });
    closer.addEventListener("click", function () { setMenu(false); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
    matchMedia("(min-width: 761px)").addEventListener("change", function (m) {
      if (m.matches && !menu.hidden) { menu.hidden = true; document.documentElement.classList.remove("es-menu-open"); }
    });
  }

  // Clock: the visitor sees Estovam Tech's time zone (Eastern)
  var clock = document.getElementById("clock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZoneName: "short" });
    var tick = function () {
      try {
        var p = {};
        fmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
        clock.textContent = p.hour + ":" + p.minute + ":" + p.second + " " + p.dayPeriod.toUpperCase() + " " + p.timeZoneName;
      } catch (e) {}
    };
    tick();
    setInterval(tick, 1000);
  }

  // Index tables: a row that holds a link opens it when you click anywhere on the row
  document.addEventListener("click", function (e) {
    var row = e.target.closest(".es-index tbody tr");
    if (!row || e.target.closest("a, button")) return;
    var a = row.querySelector("a[href]");
    if (a) a.click();
  });
})();
