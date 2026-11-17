(function () {
  var FORM_URL = "https://nhm-booking.ishaankre.workers.dev/book";
  var SLUGS = {
    photos: "photos",
    "listing-photos": "photos",
    "listing_photos": "photos",
    reel: "reel",
    "listing-reel": "reel",
    "listing_reel": "reel",
    "photos-reel": "photos-reel",
    "photos+reel": "photos-reel",
    "photos_reel": "photos-reel",
    bundle: "photos-reel",
    premium: "premium",
    "pack-2": "pack-2",
    pack2: "pack-2",
    "2-listing-pack": "pack-2",
    "listing-2": "pack-2",
    "2-pack": "pack-2",
    "pack-4": "pack-4",
    pack4: "pack-4",
    "4-listing-pack": "pack-4",
    "listing-4": "pack-4",
    "4-pack": "pack-4",
    team: "team",
    twilight: "twilight",
    "virtual-twilight": "twilight",
    "extra-reel": "extra-reel",
    "extra-cut": "extra-reel",
    rush: "rush",
    "rush-reel": "rush"
  };

  var form = document.getElementById("booking-form");
  var success = document.getElementById("book-success");
  var errorBox = document.getElementById("book-error");
  var errorText = document.getElementById("book-error-text");
  var submitBtn = document.getElementById("book-submit");
  if (!form) return;

  function paramsFrom(search) {
    try { return new URLSearchParams(search); } catch (e) { return new URLSearchParams(); }
  }

  function readIntent(href) {
    var packageSlug = "";
    var founding = false;
    var addons = [];
    function apply(qs) {
      var p = paramsFrom(qs);
      var raw = (p.get("package") || p.get("plan") || "").trim().toLowerCase();
      if (raw && SLUGS[raw]) packageSlug = SLUGS[raw];
      if (raw === "founding" || p.get("founding") === "1" || p.get("founding") === "true") founding = true;
      var ad = (p.get("addon") || "").trim().toLowerCase();
      if (ad && SLUGS[ad]) addons.push(SLUGS[ad]);
    }
    try {
      var u = href ? new URL(href, location.href) : location;
      apply(u.search);
      var hash = (u.hash || "").replace(/^#/, "");
      var qi = hash.indexOf("?");
      if (qi >= 0) apply(hash.slice(qi));
      else if (hash.indexOf("&") >= 0) apply(hash.slice(hash.indexOf("&")));
    } catch (e) {}
    return { packageSlug: packageSlug, founding: founding, addons: addons };
  }

  function clearPackages() {
    form.querySelectorAll('input[name="package"]').forEach(function (el) { el.checked = false; });
  }

  function applyIntent(intent, scroll) {
    if (intent.packageSlug) {
      clearPackages();
      var box = form.querySelector('input[name="package"][data-slug="' + intent.packageSlug + '"]');
      if (box) box.checked = true;
    }
    intent.addons.forEach(function (slug) {
      var ad = form.querySelector('input[name="addon"][data-slug="' + slug + '"]');
      if (ad) ad.checked = true;
    });
    if (intent.founding) {
      var f = document.getElementById("book-founding");
      if (f) f.checked = true;
    }
    if (scroll) {
      var section = document.getElementById("book");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function showError(msg) {
    if (success) success.hidden = true;
    if (errorText) errorText.textContent = msg || "Please try again, or email ishaan@nouveauhousemedia.com.";
    if (errorBox) {
      errorBox.hidden = false;
      errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function showSuccess() {
    if (errorBox) errorBox.hidden = true;
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    form.hidden = true;
  }

  function firstInvalid() {
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var phone = form.phone.value.trim();
    var address = form.address.value.trim();
    var pkgs = form.querySelectorAll('input[name="package"]:checked');
    if (!name) return { el: form.name, msg: "Please enter your name." };
    if (!email || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) return { el: form.email, msg: "Please enter a valid email address." };
    if (!phone) return { el: form.phone, msg: "Please enter a phone number." };
    if (!address) return { el: form.address, msg: "Please enter the property address." };
    if (!pkgs.length) return { el: form.querySelector('input[name="package"]'), msg: "Please select at least one package." };
    return null;
  }

  applyIntent(readIntent(), false);

  document.querySelectorAll('a[href*="#book"], a[data-package], a[href*="founding=1"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var intent = readIntent(a.href);
      if (a.getAttribute("data-package")) {
        var slug = SLUGS[a.getAttribute("data-package").toLowerCase()] || "";
        if (slug) intent.packageSlug = slug;
      }
      if (a.getAttribute("data-founding") === "1") intent.founding = true;
      if (!intent.packageSlug && !intent.founding && intent.addons.length === 0 && (a.getAttribute("href") || "").indexOf("#book") === -1) return;
      e.preventDefault();
      applyIntent(intent, true);
      try {
        var url = new URL(location.href);
        url.hash = "book";
        if (intent.packageSlug) url.searchParams.set("package", intent.packageSlug);
        else url.searchParams.delete("package");
        if (intent.founding) url.searchParams.set("founding", "1");
        else url.searchParams.delete("founding");
        history.replaceState(null, "", url);
      } catch (err) {}
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errorBox) errorBox.hidden = true;
    var bad = firstInvalid();
    if (bad) {
      showError(bad.msg);
      if (bad.el) bad.el.focus();
      return;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    var fd = new FormData(form);
    fetch(FORM_URL, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok && data && data.ok, error: data && data.error, status: res.status };
        }).catch(function () {
          return { ok: res.ok, error: null, status: res.status };
        });
      })
      .then(function (result) {
        if (result.ok) {
          showSuccess();
          return;
        }
        showError(result.error || "The request could not be sent. Please email ishaan@nouveauhousemedia.com.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit request";
        }
      })
      .catch(function () {
        showError("The request could not be sent. Please check your connection, or email ishaan@nouveauhousemedia.com.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit request";
        }
      });
  });
})();
