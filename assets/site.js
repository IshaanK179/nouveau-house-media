(function () {
  var d = document, rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // mobile menu
  var menu = d.querySelector(".menu"), nav = d.getElementById("nav");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }
    });
  }

  // hero video: pause for reduced motion; play/pause toggle
  var hv = d.querySelector(".hero-reel video"), tg = d.querySelector("[data-video-toggle]");
  function syncBtn() { if (!tg || !hv) return; var p = hv.paused; tg.classList.toggle("paused", p); tg.setAttribute("aria-label", p ? "Play video" : "Pause video"); }
  if (hv) {
    if (rm) { hv.removeAttribute("autoplay"); hv.pause(); }
    hv.addEventListener("play", syncBtn); hv.addEventListener("pause", syncBtn); syncBtn();
    if (tg) tg.addEventListener("click", function () { if (hv.paused) hv.play(); else hv.pause(); });
  }

  var io = "IntersectionObserver" in window;

  // reveal on scroll
  var rv = d.querySelectorAll(".rv");
  if (io && !rm) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) { ro.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // lazy clips: load + play in view
  var clips = d.querySelectorAll("video[data-lazy]");
  function load(v) { if (!v.getAttribute("src")) { v.src = v.dataset.src; } }
  if (io) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { load(v); if (!rm) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: "200px 0px", threshold: 0.2 });
    clips.forEach(function (v) { vo.observe(v); });
  } else clips.forEach(function (v) { load(v); v.controls = true; });
  if (rm) clips.forEach(function (v) { v.controls = true; });

  // reel dialog
  var dlg = d.getElementById("reel-dialog");
  if (dlg) {
    var dv = dlg.querySelector("video");
    d.querySelectorAll("[data-open-reel]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!dv.getAttribute("src")) dv.src = dv.dataset.src;
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
        var p = dv.play(); if (p && p.catch) p.catch(function () {});
      });
    });
    function close() { dv.pause(); if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
    dlg.querySelector("[data-close-reel]").addEventListener("click", close);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener("close", function () { dv.pause(); });
  }

  // film strip arrows
  var strip = d.querySelector(".strip");
  d.querySelectorAll("[data-strip]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = strip.querySelector("figure"); var w = f ? f.getBoundingClientRect().width + 14 : 400;
      strip.scrollBy({ left: w * parseInt(b.dataset.strip, 10), behavior: rm ? "auto" : "smooth" });
    });
  });

  // sticky mobile CTA: show after hero, hide over booking form or while typing
  var bar = d.getElementById("mbar"), hero = d.querySelector(".hero"), book = d.getElementById("book");
  if (bar && io) {
    var pastHero = false, atBook = false, typing = false;
    function upd() { bar.classList.toggle("show", pastHero && !atBook && !typing); }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(function (es) { atBook = es[0].isIntersecting; upd(); }, { threshold: 0 }).observe(book);
    d.addEventListener("focusin", function (e) { if (e.target.matches("input,select,textarea")) { typing = true; upd(); } });
    d.addEventListener("focusout", function () { typing = false; setTimeout(upd, 50); });
  }
})();
