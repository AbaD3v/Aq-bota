"use strict";
const main = document.querySelector("#main");
const dialog = document.querySelector("#dialog");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
const paths = {
  wall: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  stack: '<path d="m4 7-1 12 14 1m-9-15-1 12 13 1"/><rect x="10" y="3" width="11" height="12" rx="1.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 3 3-6 4 7"/>',
  expand: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
  search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
  zoom: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6"/><path class="zoom-plus" d="M10 7v6"/>',
  book: '<path d="M3 5c4-1 6-1 9 1 3-2 5-2 9-1v14c-4-1-6-1-9 1-3-2-5-2-9-1zM12 6v14"/>',
  home: '<path d="m3 11 9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 5a3 3 0 0 1 0 6m5 9v-2a4 4 0 0 0-3-4"/>',
  wa: '<path d="M20.5 11.5a8.7 8.7 0 0 1-12.9 7.7L3 20.5l1.3-4.4A8.7 8.7 0 1 1 20.5 11.5Z"/><path d="M8 7.8c.7-.6 1.1 0 1.4.8l.5 1.2-.9 1c.8 1.5 1.8 2.6 3.7 3.4l1-1.1 1.8.8c.8.4.6 1 .1 1.7-.9 1.1-2.6.7-4.3-.3-2.8-1.6-5.6-5.1-3.3-7.5Z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1m0-15.6-2.1 2.1M6.3 17.7l-2.1 2.1"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  file: '<path d="M6 2h8l4 4v16H6zM14 2v5h4M9 12h6m-6 4h6"/>',
  news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h5v5H7zM15 8h3m-3 4h3M7 16h11"/>',
  pin: '<path d="M12 22s8-8 8-14a8 8 0 1 0-16 0c0 6 8 14 8 14Z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone:
    '<path d="m5 3 3-.5 2.2 5-2 1.7a16 16 0 0 0 6.5 6.5l1.8-2 5 2.3-.7 3.1c-.3 1.3-1.4 2.2-2.7 2C10.3 20 4 13.7 3 5.8 2.9 4.6 3.7 3.4 5 3Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  route: '<path d="m12 2 10 10-10 10L2 12zM8 15v-4h8m-3-3 3 3-3 3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  leaf: '<path d="M3 20C1 7 12 2 21 3c1 11-6 17-15 15M3 21l12-12"/>',
};
const icon = (name) =>
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
  paths[name] +
  "</svg>";
let content,
  lang,
  page,
  record,
  activePhoto = 0,
  albumIndex = 0,
  albumMode = "stack",
  albumController,
  disposeHomeScroll,
  arrivalTimer,
  selectedClub = "",
  lastRoute;
const documentFilter = { query: "", section: "" };
const tr = (o) => o?.[lang] || "";
const t = (o) => esc(tr(o));
const label = (key) => t(content.labels[key]);
const pageName = (p) => (p === "home" ? label("home") : t(content.pages[p].nav));
const link = (p, id = "", l = lang) =>
  "#/" + l + "/" + p + (id ? "/" + encodeURIComponent(id) : "");
const asset = (s) =>
  /^(assets\/art\/[a-z0-9-]+\.webp|assets\/brand\.svg|assets\/uploads\/[a-f0-9]{32}\.(?:jpe?g|png|webp|pdf))$/.test(
    s
  )
    ? s
    : "";
const art = (s, alt = "", cls = "", lazy = false) =>
  asset(s)
    ? `<img class="${cls}" src="${asset(s)}" alt="${esc(alt)}" decoding="async"${lazy ? ' loading="lazy"' : ""}>`
    : "";
const paragraphs = (s) =>
  s
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>")
    .join("");
function navLink(p, symbol = "") {
  return (
    '<a href="' +
    link(p) +
    '"' +
    (page === p ? ' aria-current="page"' : "") +
    ">" +
    (symbol ? `<span class="nav-symbol">${icon(symbol)}</span><span>${pageName(p)}</span>` : pageName(p)) +
    "</a>"
  );
}
function brandLogo() {
  const path = asset(content.brand.logo);
  return path === "assets/brand.svg" ? "assets/brand.svg?v=2" : path;
}
function brand() {
  const logo = brandLogo();
  return (
    '<a class="brand" href="' +
    link("home") +
    '">' +
    (logo ? `<img src="${logo}" alt="" decoding="async">` : "") +
    "<span><strong>" +
    t(content.brand.name) +
    "</strong><small>" +
    t(content.brand.subtitle) +
    "</small></span></a>"
  );
}
function header() {
  const navigation = ["about", "groups", "clubs", "gallery"].map(key => navLink(key)).join("");
  const parentLinks = ["documents", "news"].map(key => navLink(key)).join("");
  const mobileIcons = { home: "home", about: "book", groups: "people", clubs: "sun", gallery: "image", documents: "file", news: "news", contacts: "pin" };
  const mobileLinks = ["home", ...Object.keys(content.pages)].map(key => navLink(key, mobileIcons[key])).join("");
  const locale = ["ru", "kk"]
    .map(
      (l) =>
        '<a lang="' +
        l +
        '" hreflang="' +
        l +
        '" href="' +
        link(page, record, l) +
        '" aria-label="' +
        (l === "ru" ? "Русский" : "Қазақша") +
        '"' +
        (l === lang ? ' class="selected" aria-current="true"' : "") +
        ">" +
        (l === "ru" ? "RU" : "KZ") +
        "</a>"
    )
    .join("");
  return (
    '<div class="wrap mast">' +
    brand() +
    '<nav class="desktop-nav" aria-label="' +
    label("nav") +
    '">' +
    navigation +
    '<details class="dropdown"><summary>' +
    label("parents") +
    icon("chevron") +
    "</summary><div>" +
    parentLinks +
    "</div></details>" +
    navLink("contacts") +
    '</nav><div class="utilities"><div class="langs" aria-label="' +
    label("language") +
    '">' +
    locale +
    '</div><button class="mobile-toggle icon-btn" aria-controls="mobile-nav" aria-expanded="false" aria-label="' +
    label("menu") +
    '">' +
    icon("menu") +
    '</button></div></div><nav id="mobile-nav" class="wrap mobile-nav" aria-label="' + label("nav") + '" hidden>' +
    mobileLinks +
    "</nav>"
  );
}
function renderHeader() {
  const root = document.querySelector("#header");
  if (root.querySelector(".langs .selected")?.hreflang !== lang) {
    root.innerHTML = header();
    return;
  }
  // Keep the menu in place while it finishes closing over the new page.
  if (!root.querySelector(".mobile-nav").hidden) setMobileMenu(false);
  root.querySelector(".dropdown").open = false;
  for (const item of root.querySelectorAll("nav a")) {
    if (item.hash === link(page)) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  }
  for (const choice of root.querySelectorAll(".langs a")) {
    choice.href = link(page, record, choice.hreflang);
  }
}
function setMobileMenu(open) {
  const nav = document.getElementById("mobile-nav");
  const toggle = document.querySelector(".mobile-toggle");
  nav.hidden = !open;
  nav.inert = !open;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", tr(content.labels[open ? "close" : "menu"]));
  toggle.innerHTML = icon(open ? "close" : "menu");
}
function whatsappUrl() {
  const n = content.contacts.whatsapp;
  if (!/^[1-9]\d{7,14}$/.test(n)) return "";
  const message = tr(content.contacts.waMessage).trim();
  return "https://wa.me/" + n + (message ? "?text=" + encodeURIComponent(message) : "");
}
function whatsapp(caption = content.home.secondary) {
  const href = whatsappUrl();
  if (href)
    return (
      `<a class="button light" rel="noreferrer noopener" target="_blank" href="${href}">` +
      icon("wa") +
      t(caption) +
      "</a>"
    );
  return '<button class="button light" data-action="wa">' + icon("wa") + t(caption) + "</button>";
}
function updateFloatingWhatsApp() {
  const shortcut = document.getElementById("whatsapp-fab");
  if (!shortcut) return;
  const href = whatsappUrl();
  shortcut.hidden = !href;
  if (!href) return;
  const caption = tr(content.contacts.chatLabel) || tr(content.home.secondary) || "WhatsApp";
  shortcut.href = href;
  shortcut.title = caption;
  shortcut.setAttribute("aria-label", caption);
  if (!shortcut.firstElementChild) shortcut.innerHTML = icon("wa");
}
function clubShowcase() {
  const clubs = content.items.clubs;
  if (!clubs.length) return "";
  const current = clubs.find((club) => club.id === selectedClub) || clubs[0];
  selectedClub = current.id;
  const tabs = clubs
    .map((club) => {
      const selected = club.id === selectedClub;
      return `<button type="button" role="tab" id="club-tab-${esc(club.id)}" data-club="${esc(club.id)}"
      aria-controls="club-preview" aria-selected="${selected}" tabindex="${selected ? 0 : -1}">${t(club.title)}</button>`;
    })
    .join("");
  const title = t(content.home.workshopTitle) || t(content.pages.clubs.title);
  const background = art(content.home.workshopImage, "", "depth-photo", true);
  const heading = `<div class="workshop-heading"><h2>${title}</h2><p>${t(content.home.workshopIntro)}</p></div>`;
  return `<section class="workshop-band" data-home-panel>${background ? `<div class="workshop-cover">
    <div class="depth-window" aria-hidden="true">${background}</div><div class="wrap">${heading}</div></div>` : ""}
    <div class="wrap workshop">${background ? "" : heading}
    <div class="club-tabs" role="tablist" aria-label="${pageName("clubs")}">${tabs}</div>
    <div id="club-preview" role="tabpanel" tabindex="0" aria-labelledby="club-tab-${esc(current.id)}">${clubPreview(current)}</div>
  </div></section>`;
}
function clubPreview(club) {
  return `<article class="activity-feature">
    <div class="activity-art">${albumCover(club) || art(content.pages.clubs.image)}</div>
    <div class="activity-copy"><h3>${t(club.activityTitle) || t(club.title)}</h3>
      ${paragraphs(tr(club.body).trim().split(/\n\s*\n/, 1)[0])}
      <a class="button light" href="${link("clubs", club.id)}">${icon("book")}${label("open")}</a>
    </div></article>`;
}
function selectClub(tab) {
  const club = content.items.clubs.find((item) => item.id === tab.dataset.club);
  const panel = document.getElementById("club-preview");
  if (!club || !panel || tab.getAttribute("aria-selected") === "true") return;
  selectedClub = club.id;
  tab.parentElement.querySelectorAll('[role="tab"]').forEach((button) => {
    button.setAttribute("aria-selected", String(button === tab));
    button.tabIndex = button === tab ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", tab.id);
  panel.innerHTML = clubPreview(club);
}
function blockHeading(settings, level = "h2") {
  return `<${level}>${t(settings.title)}</${level}>${paragraphs(tr(settings.intro))}`;
}
function schoolFacts(onHome) {
  const settings = content.parentBlocks?.facts;
  if (!settings || (onHome && !settings.enabled)) return "";
  const groups = content.items.groups;
  const facts = [];
  if (
    groups.length &&
    tr(settings.childrenLabel) &&
    groups.every((g) => /^\d+$/.test(g.enrolled))
  ) {
    facts.push([
      t(settings.childrenLabel),
      String(groups.reduce((sum, group) => sum + Number(group.enrolled), 0)),
    ]);
  }
  if (groups.length && tr(settings.groupsLabel))
    facts.push([t(settings.groupsLabel), String(groups.length)]);
  for (const row of content.items.facts || []) facts.push([t(row.title), t(row.body)]);
  if (!facts.length) return "";
  const ages = groups
    .filter((g) => tr(g.age))
    .map(
      (g) => `<a href="${link("groups", g.id)}"><strong>${t(g.title)}</strong> · ${t(g.age)}</a>`
    )
    .join("");
  const details = `<dl class="school-numbers">${facts
      .map(
        ([name, value]) =>
          `<div><dt>${name}</dt><dd class="${/^\d+$/.test(value) ? "numeric" : ""}">${value}</dd></div>`
      )
      .join("")}</dl>
    ${ages ? `<div class="group-ages">${ages}</div>` : ""}`;
  const room = onHome && art(content.pages.about.image, "", "depth-photo", true);
  const heading = `<div class="block-heading${room ? " wrap" : ""}">${blockHeading(settings)}</div>`;
  if (room) return `<section class="facts-section home-facts" data-home-panel>
    <div class="facts-cover"><div class="depth-window" aria-hidden="true">${room}</div>${heading}</div>
    <div class="wrap facts-details">${details}</div>
    </section>`;
  return `<section class="facts-section${onHome ? " wrap" : ""}"${onHome ? " data-home-panel" : ""}>${heading}${details}</section>`;
}

function homeAlbum() {
  const settings = content.parentBlocks?.album;
  if (!settings?.enabled) return "";
  const photos = galleryPhotos();
  if (!photos.length) return "";
  return `<section class="wrap album-panel" data-home-panel>
    <div class="block-heading">${blockHeading(settings)}</div>
    ${pocketAlbum(photos, content.pages.gallery)}
    <a class="button dark home-album-link" href="${link("gallery")}">${t(settings.linkText) || pageName("gallery")}${icon("arrow")}</a>
    </section>`;
}
function documentDownload(row, theme, compact = false) {
  const file = asset(lang === "kk" ? row.fileKk : row.fileRu);
  const format = file ? "PDF" : "TXT";
  const name = label("download") + " " + format;
  const attrs = `class="button ${theme}" aria-label="${name} · ${t(row.title)}"`;
  const caption = compact ? format : name;
  return file
    ? `<a ${attrs} download="${esc(row.id)}-${lang}.pdf" href="${file}">${icon("download")}${caption}</a>`
    : `<button ${attrs} data-download="${esc(row.id)}">${icon("download")}${caption}</button>`;
}
function homeDocuments() {
  const settings = content.parentBlocks?.resources;
  const rows = content.items.documents.slice(0, 3);
  if (!settings?.enabled || !rows.length) return "";
  return `<section class="home-documents"><div class="block-heading">${blockHeading(settings, "h3")}</div>
    <ul>${rows.map((r) => `<li><a href="${link("documents", r.id)}">${t(r.title)}</a>${documentDownload(r, "light", true)}</li>`).join("")}</ul>
    <a class="text-link" href="${link("documents")}">${t(settings.linkText) || pageName("documents")}</a></section>`;
}
function reviewsAndContacts() {
  const blocks = content.parentBlocks;
  if (!blocks) return "";
  const reviews = content.items.reviews || [];
  const voices =
    blocks.reviews?.enabled && reviews.length
      ? `<section class="voices-panel" data-home-panel>
    <div class="block-heading">${blockHeading(blocks.reviews)}</div>
    ${reviews.map((r) => `<figure><blockquote>${paragraphs(tr(r.body))}</blockquote>${tr(r.title) ? `<figcaption>${t(r.title)}</figcaption>` : ""}</figure>`).join("")}</section>`
      : "";
  const details = blocks.reach?.enabled ? contactPage(true) : "";
  const map = blocks.reach?.enabled ? homeContactMap(content.contacts) : "";
  const reach = details || map
    ? `<section class="reach-panel" data-home-panel><div class="block-heading">${blockHeading(blocks.reach)}</div>${details}${map}</section>`
    : "";
  return voices || reach ? `<div class="wrap final-panels">${voices}${reach}</div>` : "";
}
function familySection() {
  const h = content.home;
  const questions = content.items.faq || [];
  const downloads = homeDocuments();
  const links = ["documents", "news", "contacts"]
    .filter((key) => key !== "documents" || !downloads)
    .map(
      (key) => `<a href="${link(key)}">${icon({ documents: "file", news: "news", contacts: "pin" }[key])}${pageName(key)}</a>`
    )
    .join("");
  const faq = questions.length
    ? `<div class="faq"><h3>${t(h.faqTitle) || label("parents")}</h3>
    ${questions
      .map(
        (row) => `<details name="home-faq"><summary>${t(row.title)}${icon("plus")}</summary>
    <div>${paragraphs(tr(row.body))}</div></details>`
      )
      .join("")}</div>`
    : "";
  return `<section class="wrap family-section" data-home-panel><div class="family-copy"><h2>${t(h.parentsTitle)}</h2>
    <p>${t(h.parentsText)}</p>${downloads}<div class="parent-links">${links}</div></div>${faq}</section>`;
}
function homeJumpBar(h) {
  const jump = t(h.sectionJump) || label("menu");
  return `<nav class="home-jumps" aria-label="${jump}"><div class="wrap home-jumps-inner">
    <button type="button" class="home-jump-picker" aria-expanded="false" aria-controls="home-jump-panel">
      ${icon("book")}<span class="home-current">${jump}</span><span class="home-jump-sizing" aria-hidden="true"></span>${icon("chevron")}
    </button>
    <div class="home-jump-panel" id="home-jump-panel" role="group" aria-labelledby="home-jump-title" inert>
      <div class="home-jump-heading"><span id="home-jump-title">${jump}</span>
        <button type="button" class="home-jump-close" aria-label="${label("close")}">${icon("close")}</button>
      </div>
      <ul class="home-jump-list"></ul>
    </div>
    <button type="button" class="home-to-top">${icon("arrow")}${t(h.toTop) || label("home")}</button>
    </div></nav>`;
}

function layoutTop(element) {
  let top = 0;
  for (let node = element; node; node = node.offsetParent) {
    top += node.offsetTop;
    if (node !== element) top += node.clientTop;
  }
  return top;
}

function bindHomeJumpBar(bar, motion) {
  const picker = bar.querySelector(".home-jump-picker");
  const panel = bar.querySelector(".home-jump-panel");
  const panelHeading = panel.querySelector(".home-jump-heading");
  const list = bar.querySelector(".home-jump-list");
  const caption = bar.querySelector(".home-current");
  const title = caption.textContent;
  const headings = [...main.querySelectorAll("h2, h3")].filter(heading =>
    heading.textContent.trim() && !heading.closest(".guide-card, #club-preview, .contact-card, .pocket-album")
  );
  const names = headings.map(heading => heading.textContent.trim());
  list.innerHTML = names.map((name, index) => `<li><button type="button" data-home-section="${index}">
    <span>${esc(name)}</span><span class="home-jump-trail">${icon("arrow")}${icon("check")}</span></button></li>`).join("");
  const choices = [...list.querySelectorAll("button")];
  const anchors = headings.map(heading => {
    heading.tabIndex = -1;
    const kicker = heading.previousElementSibling;
    return kicker?.matches(".eyebrow") ? kicker : heading;
  });
  // Reserve enough space for every label so the sticky bar stays the same height during a swipe.
  const sizing = bar.querySelector(".home-jump-sizing");
  sizing.innerHTML = [title, ...names].map(name => `<span>${esc(name)}</span>`).join("");
  const behavior = () => motion.matches ? "smooth" : "instant";
  const listeners = new AbortController();
  const { signal } = listeners;
  const inner = bar.querySelector(".home-jumps-inner");
  let preferred = -1, active = -1, frame = 0;
  let offsets = [], headingOffsets = [], barHeight = 0, maxScroll = 0, needsMeasure = true;
  const isPanelOpen = () => !panel.hasAttribute("inert");

  function placePanel() {
    const { top, bottom } = inner.getBoundingClientRect();
    const viewport = window.visualViewport;
    const start = viewport?.offsetTop || 0;
    const end = start + (viewport?.height || window.innerHeight);
    const above = top - start - 18;
    const below = end - bottom - 18;
    const desired = panelHeading.offsetHeight + list.scrollHeight + 2;
    const opensUp = below < desired && above > below;
    panel.classList.toggle("opens-up", opensUp);
    panel.style.setProperty("--home-jump-room", Math.max(100, Math.floor(opensUp ? above : below)) + "px");
  }

  function revealChoice(choice) {
    const row = choice.closest("li");
    const top = row.offsetTop - 6;
    const bottom = row.offsetTop + row.offsetHeight + 6;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  function setPanel(open, moveFocus = false) {
    picker.setAttribute("aria-expanded", String(open));
    panel.toggleAttribute("inert", !open);
    if (open) {
      placePanel();
      list.scrollTop = 0;
      const choice = choices[active] || choices[0];
      if (choice) {
        if (moveFocus) choice.focus({ preventScroll: true });
        revealChoice(choice);
      }
    } else if (moveFocus) {
      picker.focus({ preventScroll: true });
    }
  }

  function updateCurrent() {
    frame = 0;
    if (needsMeasure) {
      needsMeasure = false;
      barHeight = bar.offsetHeight;
      maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      // Measure layout positions so entrance animations cannot move section boundaries.
      headingOffsets = anchors.map(layoutTop);
      offsets = anchors.map((anchor, i) => {
        const cover = anchor.closest(".facts-cover, .guide-cover, .workshop-cover");
        return cover ? layoutTop(cover) : headingOffsets[i];
      });
      const barSize = barHeight + "px";
      if (main.style.getPropertyValue("--home-bar-height") !== barSize) main.style.setProperty("--home-bar-height", barSize);
    }
    const y = window.scrollY;
    const atBottom = y > 0 && y >= maxScroll - 2;
    const line = y + barHeight + Math.min(64, window.innerHeight * .09);
    let current = -1;
    for (let i = 0; i < offsets.length; i++) {
      if (!atBottom && offsets[i] > line) continue;
      // Two columns can start on the same row. Honour a manual choice on that row.
      if (current < 0 || offsets[i] > offsets[current] + 2 ||
          (i === preferred && Math.abs(offsets[i] - offsets[current]) <= 2)) current = i;
    }
    if (preferred >= 0) {
      const aligned = Math.abs(headingOffsets[preferred] - y - (window.innerHeight > 350 ? barHeight + 14 : 12)) <= 3;
      if (aligned || (atBottom && headingOffsets[preferred] >= y + barHeight + 12)) current = preferred;
    }
    if (current !== active) {
      choices[active]?.removeAttribute("aria-current");
      choices[current]?.setAttribute("aria-current", "location");
      active = current;
      caption.textContent = names[active] || title;
    }
    if (isPanelOpen()) placePanel();
  }
  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(updateCurrent);
  }
  function layoutChanged() {
    needsMeasure = true;
    scheduleUpdate();
  }
  picker.addEventListener("click", event => setPanel(!isPanelOpen(), event.detail === 0));
  panel.querySelector(".home-jump-close").addEventListener("click", () => setPanel(false, true));
  list.addEventListener("click", event => {
    const choice = event.target.closest("button[data-home-section]");
    if (!choice || !isPanelOpen()) return;
    const index = Number(choice.dataset.homeSection);
    const heading = headings[index];
    setPanel(false);
    heading.focus({ preventScroll: true });
    preferred = index;
    anchors[index].scrollIntoView({ block: "start", behavior: behavior() });
    scheduleUpdate();
  });
  list.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const index = choices.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1
      : Math.max(0, Math.min(choices.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
    choices[next].focus({ preventScroll: true });
    revealChoice(choices[next]);
  });
  function dismissOutside(event) {
    if (isPanelOpen() && !picker.contains(event.target) && !panel.contains(event.target)) {
      setPanel(false, panel.contains(document.activeElement));
    }
  }
  document.addEventListener("click", dismissOutside, { signal });
  document.addEventListener("focusin", dismissOutside, { signal });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !isPanelOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    setPanel(false, true);
  }, { capture: true, signal });
  bar.querySelector(".home-to-top").addEventListener("click", () => {
    setPanel(false);
    preferred = -1;
    document.querySelector("#header .brand")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: behavior() });
  });
  let sizeObserver;
  if ("ResizeObserver" in window) {
    sizeObserver = new ResizeObserver(layoutChanged);
    for (const block of main.children) sizeObserver.observe(block);
    sizeObserver.observe(document.body);
  }
  window.addEventListener("scroll", scheduleUpdate, { passive: true, signal });
  window.addEventListener("resize", layoutChanged, { signal });
  window.visualViewport?.addEventListener("resize", scheduleUpdate, { signal });
  updateCurrent();
  return () => {
    listeners.abort();
    sizeObserver?.disconnect();
    cancelAnimationFrame(frame);
    main.style.removeProperty("--home-bar-height");
  };
}

function bindHomeParallax(motion) {
  const scenes = [...main.querySelectorAll(".depth-photo")].map(photo => ({
    photo, window: photo.parentElement,
    hero: photo.parentElement.classList.contains("hero-window")
  }));
  let frame = 0, measure = true, lastTime = 0;

  function paint(time) {
    frame = 0;
    const scroll = Math.max(0, window.scrollY);
    if (measure) {
      measure = false;
      for (const scene of scenes) {
        const height = scene.window.offsetHeight;
        const bleed = Number(getComputedStyle(scene.window).getPropertyValue("--depth-overscan"));
        scene.anchor = layoutTop(scene.window) - (scene.hero ? 0 : height * .55);
        scene.range = Math.max(1, height * .48);
        scene.travel = Math.max(0, height * bleed - 2);
      }
    }

    const elapsed = lastTime ? Math.min(50, time - lastTime) : 16.7;
    const blend = 1 - Math.exp(-elapsed / 42);
    let settling = false;
    for (const scene of scenes) {
      // Use the cover's document position so mobile browser chrome cannot move the photo.
      const target = scene.travel * Math.tanh((scroll - scene.anchor) / scene.range);
      const previous = scene.shift ?? target;
      const delta = target - previous;
      const moving = Math.abs(delta) > .2;
      scene.shift = moving ? previous + delta * blend : target;
      settling ||= moving;
      const offset = scene.shift.toFixed(2);
      if (scene.renderedOffset !== offset) {
        scene.renderedOffset = offset;
        scene.photo.style.transform = `translate3d(0,${offset}px,0)`;
      }
    }
    lastTime = settling ? time : 0;
    if (settling) schedule();
  }

  function schedule() {
    if (!frame && motion.matches) frame = requestAnimationFrame(paint);
  }
  function layoutChanged() {
    measure = true;
    schedule();
  }
  function stop() {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", layoutChanged);
    resize?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    for (const scene of scenes) {
      scene.shift = undefined;
      scene.renderedOffset = undefined;
      scene.photo.style.removeProperty("transform");
    }
  }
  const resize = "ResizeObserver" in window ? new ResizeObserver(layoutChanged) : null;
  function refresh() {
    stop();
    if (!motion.matches || !scenes.length) return;
    measure = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", layoutChanged);
    resize?.observe(document.getElementById("header"));
    for (const section of main.children) resize?.observe(section);
    for (const scene of scenes) resize?.observe(scene.window);
    paint(performance.now());
  }
  refresh();
  motion.addEventListener("change", refresh);
  return () => {
    motion.removeEventListener("change", refresh);
    stop();
  };
}

function bindHomeWheel(motion) {
  const listeners = new AbortController();
  const { signal } = listeners;
  const settlingTime = 78;
  let frame = 0, position, velocity = 0, target, lastScroll, lastTime;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function advance(time) {
    if (dialog.open || Math.abs(window.scrollY - lastScroll) > 1) {
      stop();
      return;
    }
    const elapsed = Math.max(1, Math.min(48, time - lastTime));
    lastTime = time;
    // Critically damped movement starts smoothly and keeps its velocity between wheel ticks.
    const distance = position - target;
    const slope = velocity + distance / settlingTime;
    const decay = Math.exp(-elapsed / settlingTime);
    position = target + (distance + slope * elapsed) * decay;
    velocity = (velocity - slope * elapsed / settlingTime) * decay;
    const settled = Math.abs(target - position) < 1;
    window.scrollTo({ top: settled ? target : position, behavior: "instant" });
    lastScroll = window.scrollY;
    frame = settled ? 0 : requestAnimationFrame(advance);
  }

  window.addEventListener("wheel", event => {
    // Continuous trackpad input and pinch-to-zoom already have their own browser physics.
    const { deltaMode, deltaY, deltaX } = event;
    const continuous = deltaMode === 0 && (!Number.isInteger(deltaY) || Math.abs(deltaY) < 48);
    if (!motion.matches || !event.cancelable || event.defaultPrevented || continuous ||
        event.ctrlKey || event.metaKey || event.shiftKey || dialog.open || !deltaY ||
        Math.abs(deltaX) > Math.abs(deltaY) / 2 ||
        event.target.closest?.(".mobile-nav, .home-jump-panel, select, textarea, input, [contenteditable]")) {
      stop();
      return;
    }
    const root = document.scrollingElement;
    const delta = deltaY * (deltaMode === 1 ? 40 : deltaMode === 2 ? root.clientHeight : 1);
    const y = window.scrollY;
    if (frame && Math.abs(y - lastScroll) > 1) stop();
    const continuing = frame && Math.sign(target - y) === Math.sign(delta);
    const next = Math.max(0, Math.min(root.scrollHeight - root.clientHeight, (continuing ? target : y) + delta));
    if (next === y) {
      stop();
      return;
    }
    event.preventDefault();
    target = next;
    if (!continuing) velocity = 0;
    if (frame) return;
    position = lastScroll = y;
    lastTime = performance.now();
    frame = requestAnimationFrame(advance);
  }, { passive: false, signal });
  window.addEventListener("pointerdown", stop, { passive: true, signal });
  window.addEventListener("keydown", stop, { signal });
  window.addEventListener("resize", stop, { signal });
  main.addEventListener("change", stop, { signal });
  motion.addEventListener("change", stop, { signal });
  return () => {
    listeners.abort();
    stop();
  };
}

function bindHomePanelAssist(bar, motion) {
  const panels = main.querySelectorAll("[data-home-panel]");
  const listeners = new AbortController();
  const passive = { passive: true, signal: listeners.signal };
  let timer, touching = false, previous = 0, direction = 0;
  let manual = false, destination = null;

  function interrupt() {
    clearTimeout(timer);
    manual = false;
    if (destination === null) return;
    destination = null;
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
  }

  function alignPanel() {
    manual = false;
    if (!direction || !motion.matches || document.hidden || dialog.open) return;
    const root = document.scrollingElement;
    const y = window.scrollY;
    const inset = window.innerHeight > 350 ? bar.offsetHeight : 0;
    const max = root.scrollHeight - root.clientHeight;
    // Only finish the current gesture, within a small fraction of the viewport.
    let closest = Math.min(96, window.innerHeight * .13);
    let next = null;
    for (const panel of panels) {
      const top = Math.max(0, layoutTop(panel) - inset);
      const delta = top - y;
      if (top > max || Math.sign(delta) !== direction || Math.abs(delta) < 4 || Math.abs(delta) > closest) continue;
      next = top;
      closest = Math.abs(delta);
    }
    if (next === null) return;
    destination = next;
    window.scrollTo({ top: next, behavior: "smooth" });
  }

  function waitForRest() {
    clearTimeout(timer);
    if (!touching && manual) timer = setTimeout(alignPanel, 180);
  }

  function arm() {
    if (!motion.matches || dialog.open) return;
    if (destination !== null) interrupt();
    if (!manual) {
      previous = window.scrollY;
      direction = 0;
      manual = true;
    }
    waitForRest();
  }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (destination !== null && Math.abs(y - destination) <= 1) destination = null;
    if (!manual) return;
    const movement = y - previous;
    if (movement) direction = Math.sign(movement);
    previous = y;
    waitForRest();
  }, passive);
  window.addEventListener("touchstart", () => { touching = true; interrupt(); }, passive);
  window.addEventListener("touchmove", event => {
    if (event.touches.length === 1 && (window.visualViewport?.scale || 1) <= 1 &&
        !event.target.closest?.(".home-jump-panel")) arm();
    else interrupt();
  }, passive);
  window.addEventListener("touchend", event => {
    touching = event.touches.length > 0;
    waitForRest();
  }, passive);
  window.addEventListener("touchcancel", () => { touching = false; interrupt(); }, passive);
  window.addEventListener("wheel", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) ||
        event.target.closest?.(".mobile-nav, .home-jump-panel, select, textarea, input, [contenteditable]")) {
      interrupt();
    } else arm();
  }, passive);
  for (const event of ["pointerdown", "keydown", "focusin", "resize", "change"]) {
    window.addEventListener(event, interrupt, passive);
  }
  motion.addEventListener("change", interrupt, passive);
  return () => { listeners.abort(); interrupt(); };
}

function mountHomeScroll() {
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const bar = main.querySelector(".home-jumps");
  const releaseAssist = bindHomePanelAssist(bar, motion);
  const releaseWheel = bindHomeWheel(motion);
  const releaseBar = bindHomeJumpBar(bar, motion);
  const releaseParallax = bindHomeParallax(motion);
  // Leave content readable by default. Only prepare blocks still below the fold.
  const blocks = main.querySelectorAll([
    ".facts-section .school-numbers", ".guide > h2", ".guide-card", ".album-panel > .block-heading",
    ".workshop-heading", ".club-tabs", "#club-preview", ".family-copy",
    ".faq > h3", ".faq > details", ".voices-panel", ".reach-panel"
  ].join(", "));
  let observer;
  function clearMotion() {
    observer?.disconnect();
    for (const block of blocks) block.classList.remove("home-waiting", "home-entering");
  }
  function prepareMotion() {
    clearMotion();
    if (!motion.matches || !("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver((entries, activeObserver) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        activeObserver.unobserve(entry.target);
        entry.target.classList.replace("home-waiting", "home-entering");
      }
    }, { rootMargin: "0px 0px 6% 0px" });
    const belowFold = [...blocks].filter(block => block.getBoundingClientRect().top >= window.innerHeight);
    for (const block of belowFold) {
      block.classList.add("home-waiting");
      observer.observe(block);
    }
  }
  function showFocused(event) {
    const block = event.target.closest(".home-waiting, .home-entering");
    if (block) {
      observer?.unobserve(block);
      block.classList.remove("home-waiting", "home-entering");
    }
  }
  function finishEntrance(event) {
    if (event.animationName === "home-arrive") event.target.classList.remove("home-entering");
  }
  prepareMotion();
  motion.addEventListener("change", prepareMotion);
  main.addEventListener("focusin", showFocused);
  main.addEventListener("animationend", finishEntrance);
  return () => {
    observer?.disconnect();
    releaseAssist();
    releaseWheel();
    releaseBar();
    releaseParallax();
    motion.removeEventListener("change", prepareMotion);
    main.removeEventListener("focusin", showFocused);
    main.removeEventListener("animationend", finishEntrance);
  };
}
function home() {
  const h = content.home;
  const photo = art((lang === "kk" && asset(h.heroImageKk)) || h.heroImage, tr(h.heroAlt), "depth-photo");
  const playground = art(h.exploreImage, "", "depth-photo", true);
  const guideHeading = `<div class="eyebrow rule">${t(h.exploreKicker)}</div><h2>${t(h.exploreTitle)}</h2>`;
  const cards = ["groups", "clubs", "gallery"]
    .map((k) => {
      const p = content.pages[k];
      return (
        '<a class="guide-card ' +
        k +
        '" href="' +
        link(k) +
        '"><div class="card-copy"><h3>' +
        t(p.nav) +
        "</h3><p>" +
        t(p.teaser) +
        '</p><span class="card-plus">' +
        icon("arrow") +
        "</span></div>" +
        art(p.image, "", "card-art") +
        "</a>"
      );
    })
    .join("");
  return (
    `<section class="hero home-cover">${photo ? `<div class="depth-window hero-window">${photo}</div>` : ""}
    <div class="wrap hero-grid"><div class="hero-copy"><div class="eyebrow sun-label">` +
    icon("sun") +
    t(h.eyebrow) +
    "</div><h1>" +
    t(h.title) +
    " <em>" +
    t(h.accent) +
    '</em></h1><p class="hero-text">' +
    t(h.summary) +
    '</p><div class="actions"><a class="button dark" href="' +
    link("about") +
    '">' +
    icon("book") +
    t(h.primary) +
    "</a>" +
    (content.contacts.whatsapp
      ? whatsapp()
      : '<a class="button light" href="' +
        link("documents") +
        '">' +
        icon("file") +
        pageName("documents") +
        "</a>") +
    '</div></div>' +
    (photo && tr(h.heroAlt) ? `<p class="cover-caption" aria-hidden="true">${icon("pin")}${t(h.heroAlt)}</p>` : "") +
    "</div></section>" +
    homeJumpBar(h) + schoolFacts(true) +
    `<section class="guide${playground ? "" : " wrap"}"${playground ? "" : " data-home-panel"}>${playground ? `<div class="guide-cover wrap" data-home-panel>
    <div class="depth-window" aria-hidden="true">${playground}</div><div class="guide-heading">${guideHeading}</div></div>`
    : guideHeading}<div class="guide-grid${playground ? " wrap" : ""}">` +
    cards +
    "</div></section>" +
    homeAlbum() +
    clubShowcase() +
    familySection() +
    reviewsAndContacts()
  );
}
function mapCoordinates(point) {
  const match = (point || "")
    .trim()
    .match(/^([+-]?\d{1,2}(?:\.\d+)?)\s*,\s*([+-]?\d{1,3}(?:\.\d+)?)$/);
  if (!match || Math.abs(Number(match[1])) > 90 || Math.abs(Number(match[2])) > 180) return null;
  return match.slice(1);
}
function directionsUrl(point, cardUrl) {
  const card = cardUrl ? new URL(cardUrl) : null;
  const match = card && /^(?:www\.)?2gis\.(?:kz|ru|com)$/.test(card.hostname)
    ? card.pathname.match(/^\/(?:([a-z0-9_-]+)\/)?(?:geo|firm)\/(?:\d+\/)?([^/]+)\/?$/i)
    : null;
  const cardCoordinates = match?.[2].replace(/%2c/ig, ",").split(",");
  const destination = (mapCoordinates(point) || mapCoordinates(cardCoordinates?.reverse().join(",")))
    ?.reverse().map(Number).join(",");
  if (!destination) return "";
  const area = match?.[1] ? "/" + match[1] : "";
  return "https://2gis.kz" + area + "/directions/points/|" + destination;
}
function dialNumber(phone) {
  const number = (phone || "").replace(/[\s()-]/g, "");
  if (!/^\+?\d{7,15}$/.test(number)) return "";
  if (/^[78]\d{10}$/.test(number)) return "+7" + number.slice(1);
  return number;
}
function externalMapUrl(value) {
  const link = (value || "").trim();
  if (!/^https:\/\//i.test(link) || /[\s\\]/u.test(link)) return "";
  try {
    const url = new URL(link);
    return url.username || url.password ? "" : url.href;
  } catch {
    return "";
  }
}
function contactDetail(key, symbol, value, action = "") {
  return value
    ? `<div class="contact-detail"><dt>${icon(symbol)}${label(key)}${action}</dt><dd>${value}</dd></div>`
    : "";
}
function contactCard(theme, details, actions) {
  if (!details && !actions) return "";
  return `<div class="contact-card ${theme}">${details ? `<dl>${details}</dl>` : ""}
    ${actions ? `<div class="contact-actions">${actions}</div>` : ""}</div>`;
}
function overviewMapUrl(lon, lat, zoom) {
  const point = `${lon},${lat}`;
  const params = new URLSearchParams({
    ll: point,
    z: Number(zoom) || 17,
    l: "map",
    pt: point + ",pm2rdm",
    lang: lang === "kk" ? "kk_KZ" : "ru_KZ",
  });
  return "https://yandex.kz/map-widget/v1/?" + params;
}
function overviewLabel(contacts) {
  const name = tr(contacts.mapOverviewLabel);
  return !name || name === "Село · 2ГИС" || name === "Ауыл · 2GIS"
    ? (lang === "kk" ? "Яндекс Карта" : "Яндекс Карты")
    : name;
}
function homeContactMap(contacts) {
  const point = contacts.mapEnabled && mapCoordinates(contacts.mapPoint);
  if (!point) return "";
  const [lat, lon] = point.map(Number);
  const title = [overviewLabel(contacts), tr(contacts.mapCaption)].filter(Boolean).join(" · ");
  return `<div class="contact-map reach-map"><div class="contact-map-surface">
    <iframe src="${esc(overviewMapUrl(lon, lat, contacts.mapZoom))}" title="${esc(title)}" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div></div>`;
}
function directionsLabel(contacts) {
  const label = tr(contacts.routeLabel);
  return !label || label === "Маршрут в Google Maps" || label === "Google Maps-та бағыт құру"
    ? (lang === "kk" ? "2GIS-те бағыт құру" : "Маршрут в 2ГИС")
    : label;
}
function entranceImage(contacts) {
  return asset((lang === "kk" && contacts.entrancePhotoKk) || contacts.entrancePhoto);
}
async function housePlanUrl(frame, contacts, lon, lat) {
  const street = tr(contacts.mapStreet).trim();
  const house = contacts.mapHouseNumber;
  if (!street || !house) return "";
  try {
    const { featuresAtSite } = await import("./maps/geography.js");
    if (!(await featuresAtSite(lon, lat)).length) return "";
  } catch {
    return "";
  }
  if (!frame.isConnected) return "";
  const settings = new URLSearchParams({
    lang,
    street,
    house,
    name: tr(contacts.mapCaption),
    address: tr(contacts.address),
    brand: tr(content.brand.name),
    title: tr(contacts.mapDetailLabel),
  });
  // Older static exports may still contain one landmark in the contacts fields.
  const landmarks = contacts.landmarks ?? [
    {
      id: "medical-post",
      enabled: contacts.landmarkEnabled,
      title: contacts.landmarkLabel,
      point: contacts.landmarkPoint,
    },
  ];
  const visibleLandmarks = landmarks.filter((row) => row.enabled && tr(row.title).trim());
  const entrance = entranceImage(contacts);
  if (entrance) {
    frame.dataset.entranceCard = "true";
    frame.dataset.entranceLabel = tr(contacts.entrancePhotoLabel);
  }
  frame.dataset.landmarks = JSON.stringify(
    visibleLandmarks.map((row) => ({ id: row.id, title: tr(row.title), point: row.point }))
  );
  frame.addEventListener("aqb-open-landmark", (event) => {
    // The house marker already has its own location on the plan.
    const row =
      event.detail === null && entrance
        ? {
            title: contacts.mapCaption,
            description: contacts.address,
            image: entrance,
            alt: contacts.entrancePhotoAlt,
          }
        : visibleLandmarks.find((item) => item.id === event.detail);
    if (!row || dialog.open) return;
    const opener = frame.contentDocument?.activeElement;
    const photo = art(row.image, tr(row.alt) || tr(row.title), "landmark-card-photo");
    modal(`<article class="landmark-card"><h2 id="modal-title">${t(row.title)}</h2>
      ${photo}${paragraphs(tr(row.description).trim())}${event.detail === null ? paragraphs(tr(contacts.arrivalText)) : ""}</article>`);
    dialog.addEventListener(
      "close",
      () => {
        if (frame.isConnected && opener?.isConnected) opener.focus({ preventScroll: true });
      },
      { once: true }
    );
  });
  return "assets/maps/house.html?" + settings;
}
async function loadContactMap(frame, contacts) {
  const [lat, lon] = mapCoordinates(contacts.mapPoint).map(Number);
  const detail = contacts.mapZoom === "house" ? await housePlanUrl(frame, contacts, lon, lat) : "";
  if (!frame.isConnected) return;
  const mapLabel = detail ? tr(contacts.mapDetailLabel) : overviewLabel(contacts);
  frame.title = [tr(contacts.mapCaption), mapLabel].filter(Boolean).join(" · ");
  frame.src = detail || overviewMapUrl(lon, lat, contacts.mapZoom);
  const jump = main.querySelector(".map-jump");
  if (jump) jump.hidden = false;
}
function arrivalGuide(contacts) {
  const instructions = tr(contacts.arrivalText).trim();
  const photo = entranceImage(contacts);
  if (!instructions && !photo) return "";
  const image = photo
    ? `<button class="arrival-photo" type="button" data-photo="0" aria-haspopup="dialog">${art(photo, tr(contacts.entrancePhotoAlt) || tr(contacts.arrivalTitle))}<span>${icon("expand")}${t(contacts.entrancePhotoLabel)}</span></button>`
    : "";
  return `<div class="arrival-guide">${image}${instructions ? `<div class="arrival-text">${paragraphs(instructions)}</div>` : ""}</div>`;
}
function contactPage(compact = false) {
  const c = content.contacts;
  const address = tr(c.address).trim();
  const twoGis = externalMapUrl(c.twoGisUrl);
  const route = directionsUrl(c.mapPoint, twoGis);
  const routeButton = route
    ? `<a class="button dark" href="${esc(route)}" target="_blank" rel="noopener noreferrer">${icon("route")}${esc(directionsLabel(c))}</a>`
    : "";
  const twoGisButton =
    twoGis && tr(c.twoGisLabel).trim()
      ? `<a class="button light" href="${esc(twoGis)}" target="_blank" rel="noopener noreferrer">${icon("pin")}${t(c.twoGisLabel)}</a>`
      : "";
  const hours = [c.hours, c.days]
    .map(tr)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => `<span>${esc(value)}</span>`)
    .join("");
  const mapActions = routeButton + twoGisButton;
  const hasMap = !compact && c.mapEnabled && mapCoordinates(c.mapPoint);
  const jumpText = tr(c.mapLinkLabel) || (lang === "kk" ? "Картадан көру" : "На карте");
  const jump = hasMap
    ? `<button type="button" class="map-jump" data-action="contact-map" aria-controls="contact-plan" hidden>${esc(jumpText)}${icon("arrow")}</button>` : "";
  const visit = contactCard(
    "visit-card",
    contactDetail("address", "pin", esc(address), jump) + contactDetail("hours", "clock", hours),
    mapActions
  );
  const phone = dialNumber(c.phone);
  const phoneLink = phone ? `<a href="tel:${esc(phone)}" dir="ltr">${esc(c.phone)}</a>` : "";
  const call = phone && !compact
    ? `<a class="button dark" href="tel:${esc(phone)}">${icon("phone")}${t(c.callLabel) || label("phone")}</a>`
    : "";
  const chat = /^[1-9]\d{7,14}$/.test(c.whatsapp)
    ? whatsapp(c.chatLabel || content.home.secondary)
    : "";
  const email = c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "";
  const reach = contactCard(
    "call-card",
    contactDetail("phone", "phone", phoneLink) + contactDetail("email", "mail", email),
    call + chat
  );
  if (compact) return visit || reach ? `<div class="contact-directory compact">${visit}${reach}</div>` : "";
  const guide = arrivalGuide(c);
  const mapAddress = [tr(c.mapStreet).trim(), c.mapHouseNumber].filter(Boolean).join(", ") || address;
  const map = hasMap
    ? `<div class="contact-map" id="contact-plan" role="region" aria-label="${t(c.mapCaption)}" tabindex="-1">
        <div class="contact-map-surface"><iframe id="contact-map" title="${t(c.mapCaption)}" referrerpolicy="no-referrer"></iframe></div>
        ${mapAddress ? `<p class="contact-map-address">${icon("pin")}${esc(mapAddress)}</p>` : ""}
      </div>`
    : "";
  const heading = directoryHeading(content.pages.contacts);
  if (!visit && !reach && !guide && !map) return heading + `<p class="empty">${label("contactEmpty")}</p>`;
  return `<div class="contact-intro${reach ? " with-reach" : ""}">${heading}${visit}${reach}</div>
    ${map || guide ? `<section class="contact-location"><h2>${t(c.arrivalTitle) || t(c.mapCaption)}</h2><div class="location-grid">${map}${guide}</div></section>` : ""}`;
}
function albumCover(row) {
  if (row.cover) return art(row.cover, tr(row.coverAlt));
  const first = row.photos?.[0];
  return first ? art(first.image, tr(first.alt)) : "";
}
function groupFacts(group) {
  const pairs = [];
  if (tr(group.age)) pairs.push([label("groupAge"), t(group.age)]);
  if (/^\d+$/.test(group.enrolled)) pairs.push([label("groupCount"), esc(group.enrolled)]);
  return pairs.length
    ? `<dl class="group-facts">${pairs.map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join("")}</dl>`
    : "";
}
function directoryHeading(p) {
  const picture = art(p.image, "", "directory-art");
  return `<section class="directory-heading ${page}${picture ? " illustrated" : ""}"><h1>${t(p.title)}</h1>
    ${picture}${paragraphs(tr(p.lead))}</section>`;
}
function groupDirectory(p) {
  const rows = content.items.groups;
  const heading = directoryHeading(p);
  if (!rows.length) return heading + '<p class="empty">' + label("empty") + "</p>";
  return heading + `<div class="group-cards">${rows
    .map((group) => {
      const cover = albumCover(group);
      return `<a class="group-card${cover ? " illustrated" : ""}" aria-labelledby="card-${esc(group.id)}" href="${link("groups", group.id)}">
      <div class="group-card-copy"><h2 id="card-${esc(group.id)}">${t(group.title)}</h2>${groupFacts(group)}</div>
      ${cover ? `<div class="group-cover">${cover}</div>` : ""}
      <div class="group-card-summary"><div>${paragraphs(tr(group.summary) || tr(group.body).split(/\n\s*\n/)[0])}</div><span class="group-card-arrow">${icon("arrow")}</span></div></a>`;
    })
    .join("")}</div>`;
}
function photoGrid(rows, offset = 0) {
  return `<div class="photos">${rows
    .map(
      (photo, index) =>
        `<button type="button" data-photo="${offset + index}"><span class="photo-thumb">${art(photo.image, tr(photo.alt), "", index >= 3)}</span><span class="photo-title">${t(photo.title)}</span></button>`
    )
    .join("")}</div>`;
}
const galleryAlbums = {
  "album.places": { id: "places", label: "placesAlbum" },
  "album.activities": { id: "activities", label: "activitiesAlbum" }
};
const initialActivityGroups = {
  "activity-paper-shapes": "altyn-saka",
  "activity-apple-shapes": "altyn-saka",
  "activity-number-six": "erketai",
  "activity-count-to-five": "erketai",
  "activity-loops": "erketai"
};
function galleryAlbum(photo) {
  if (photo.album !== undefined) return photo.album;
  if (photo.id?.startsWith("activity-")) return "activities";
  if (photo.id?.startsWith("aqb-")) return "places";
  return "";
}
function galleryPhotos(groupId = "") {
  const { gallery, groups, clubs } = content.items;
  if (Object.hasOwn(galleryAlbums, groupId)) {
    const album = galleryAlbums[groupId].id;
    return gallery.filter(photo => galleryAlbum(photo) === album);
  }
  const groupPhotos = groups
    .filter((group) => !groupId || group.id === groupId)
    .flatMap((group) => group.photos || []);
  const matches = (photo) => !groupId || photo.groupId === groupId;
  // Older published snapshots gain the initial album assignment without replacing live edits.
  const galleryRows = gallery.filter(photo => {
    const initialGroup = photo.album === undefined ? initialActivityGroups[photo.id] : "";
    return !groupId || (photo.groupId || initialGroup) === groupId;
  });
  const clubPhotos = clubs.flatMap((club) => (club.photos || []).filter(matches));
  return groupId
    ? [...groupPhotos, ...galleryRows, ...clubPhotos]
    : [...galleryRows, ...groupPhotos, ...clubPhotos];
}
function galleryText(key) {
  const defaults = {
    placesAlbum: { ru: "Садик и двор", kk: "Балабақша мен аула" },
    activitiesAlbum: { ru: "Занятия", kk: "Сабақтар" },
    albumsLabel: { ru: "Альбомы", kk: "Альбомдар" },
    wallMode: { ru: "Все фото", kk: "Барлық фото" },
    stackMode: { ru: "Листать", kk: "Парақтау" },
    viewLabel: { ru: "Режим просмотра", kk: "Көру режимі" },
    imageUnavailable: { ru: "Снимок недоступен", kk: "Сурет қолжетімсіз" }
  };
  return tr(content.pages.gallery[key]) || tr(defaults[key]);
}
function unavailablePhoto() {
  return `<span class="print-unavailable">${icon("image")}<span>${esc(galleryText("imageUnavailable"))}</span></span>`;
}
function galleryImage(photo, { deferred = false, lazy = false } = {}) {
  const src = asset(photo.image);
  if (!src) return unavailablePhoto();
  return `<img data-album-image ${deferred ? "data-src" : "src"}="${src}" alt="${t(photo.alt) || t(photo.title)}" decoding="async" draggable="false"${lazy ? ' loading="lazy"' : ""}>`;
}
function stackIndices(index, count, direction) {
  return Array.from({ length: Math.min(count, 3) }, (_, depth) => (index + count + direction * depth) % count);
}
function printCard(photo, index, depth, count) {
  const g = content.pages.gallery;
  const expand = t(g.fullscreenLabel) || t(g.zoomIn) || label("image");
  return `<article class="album-sheet" data-index="${index}" data-depth="${depth}" data-pose="${index % 4}"${depth ? ' inert aria-hidden="true"' : ""}>
    <div class="album-mount"><div class="lightbox-stage album-photo">${galleryImage(photo, { lazy: page === "home" })}</div>
      <button type="button" class="album-expand" data-photo="${index}" aria-haspopup="dialog" title="${expand}" aria-label="${expand}">${icon("expand")}</button>
      ${tr(g.zoomReset) ? `<button type="button" class="photo-zoom album-reset" aria-label="${t(g.zoomReset)}" title="${t(g.zoomReset)}">${icon("zoom")}</button>` : ""}</div>
    <div class="album-caption"><div class="album-caption-line"><h2>${t(photo.title) || label("image")}</h2>
      <span class="album-counter" dir="ltr">${index + 1} / ${count}</span></div>${tr(photo.alt) ? `<p>${t(photo.alt)}</p>` : ""}</div>
    </article>`;
}
function pocketAlbum(photos, p) {
  const count = photos.length;
  const cards = stackIndices(albumIndex, count, 1).map((index, depth) => printCard(photos[index], index, depth, count)).join("");
  return `<section class="pocket-album" aria-label="${t(p.nav)}">
    <div class="album-studio"><div class="album-stack">${cards}</div></div>
    <span class="album-announcement" aria-live="polite" aria-atomic="true"></span>
    ${count > 1 ? `<div class="album-controls">
      <button type="button" data-album-step="-1" aria-label="${label("previous")}">${icon("arrow")}</button>
      <div class="album-track"><progress aria-hidden="true" value="${albumIndex + 1}" max="${count}"></progress>
      ${tr(p.swipeHint) ? `<span>${t(p.swipeHint)}</span>` : ""}</div>
      <button type="button" data-album-step="1" aria-label="${label("next")}">${icon("arrow")}</button></div>` : ""}</section>`;
}
function mountPocketAlbum(album) {
  const photos = galleryPhotos(record);
  const stack = album.querySelector(".album-stack");
  const cards = new Map([...stack.children].map(card => [Number(card.dataset.index), card]));
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  let direction = 1, front = cards.get(albumIndex), outgoing, flight, spring, releaseGestures;
  function arrange() {
    const order = stackIndices(albumIndex, photos.length, direction);
    for (const [index, card] of cards) {
      if (!order.includes(index)) {
        card.remove();
        cards.delete(index);
      }
    }
    order.forEach((index, depth) => {
      if (!cards.has(index)) {
        stack.insertAdjacentHTML("beforeend", printCard(photos[index], index, depth, photos.length));
        cards.set(index, stack.lastElementChild);
      }
      const card = cards.get(index);
      card.dataset.depth = depth;
      card.inert = depth !== 0;
      if (depth) card.setAttribute("aria-hidden", "true");
      else card.removeAttribute("aria-hidden");
    });
    front = cards.get(albumIndex);
    if (stack.firstElementChild !== front) stack.prepend(front);
  }
  function prepareBacks(nextDirection) {
    if (direction === nextDirection) return;
    direction = nextDirection;
    arrange();
  }
  function clearFlight() {
    flight?.cancel();
    outgoing?.remove();
    outgoing = flight = null;
  }
  function springToRest(from) {
    spring?.cancel();
    front.style.removeProperty("transform");
    delete front.dataset.dragging;
    if (motion.matches && from) {
      spring = front.animate([{ transform: from }, { transform: getComputedStyle(front).transform }],
        { duration: 400, easing: "cubic-bezier(.2,1.35,.32,1)" });
    }
  }
  function drag(dx) {
    if (!dx) {
      if (front.hasAttribute("data-dragging")) springToRest(getComputedStyle(front).transform);
      return;
    }
    if (!motion.matches) return;
    prepareBacks(dx < 0 ? 1 : -1);
    spring?.cancel();
    front.dataset.dragging = "";
    const angle = Math.max(-16, Math.min(16, dx / front.offsetWidth * 20));
    front.style.transform = `translate3d(${dx}px,0,0) rotate(${angle}deg)`;
  }
  function attachGestures() {
    releaseGestures = enablePhotoGestures(front, photos.length > 1 ? step : null, {
      surface: front, threshold: () => Math.max(52, Math.min(115, front.offsetWidth * .23)),
      tap: () => front.querySelector(".album-expand").click(), drag
    });
  }
  function go(index, turn = 0) {
    const next = (index + photos.length) % photos.length;
    if (next === albumIndex) return;
    clearFlight();
    if (turn) prepareBacks(turn);
    const old = front;
    const animate = !!turn && motion.matches;
    const from = animate && getComputedStyle(old).transform;
    const promoted = animate && cards.get(next);
    const underPose = promoted && getComputedStyle(promoted).transform;
    const keepFocus = old.contains(document.activeElement);
    const height = old.offsetHeight;
    spring?.cancel();
    releaseGestures();
    cards.delete(albumIndex);
    old.inert = true;
    old.setAttribute("aria-hidden", "true");
    old.removeAttribute("data-depth");
    old.classList.add("is-flying");
    old.style.height = height + "px";
    albumIndex = next;
    arrange();
    attachGestures();
    if (animate) {
      outgoing = old;
      const distance = (album.clientWidth + old.offsetWidth) * .58 + 50;
      flight = old.animate([{ transform: from, opacity: 1 },
        { transform: `translate3d(${-turn * distance}px,-18px,0) rotate(${-turn * 19}deg)`, opacity: .35 }],
        { duration: 275, easing: "cubic-bezier(.28,.08,.7,.45)", fill: "forwards" });
      flight.onfinish = () => old.remove();
      springToRest(underPose || "scale(.96)");
    } else old.remove();
    const progress = album.querySelector("progress");
    if (progress) progress.value = next + 1;
    album.querySelector(".album-announcement").textContent =
      `${tr(photos[next].title)} · ${next + 1} / ${photos.length}`;
    if (keepFocus) front.querySelector(".album-expand").focus({ preventScroll: true });
  }
  function step(offset) { go(albumIndex + offset, offset); }
  album.addEventListener("click", event => {
    const control = event.target.closest("[data-album-step]");
    if (control) step(Number(control.dataset.albumStep));
  });
  album.addEventListener("keydown", event => {
    if (photos.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  });
  attachGestures();
  return { go, dispose() { releaseGestures(); clearFlight(); spring?.cancel(); } };
}
function photoWall(photos) {
  return `<div class="photo-wall">${photos.map((photo, i) =>
    `<button type="button" class="wall-print" data-photo="${i}" aria-haspopup="dialog"${i === albumIndex ? ' aria-current="true"' : ""}>
      <span class="wall-window">${galleryImage(photo, { deferred: true })}</span><span class="wall-caption">${t(photo.title) || label("image")}</span>
    </button>`).join("")}</div>`;
}
function mountPhotoWall(wall) {
  const pending = new Set();
  let busy = 0, observer;
  function loadVisible() {
    while (busy < 2 && pending.size && wall.isConnected) {
      const image = pending.values().next().value;
      pending.delete(image);
      observer?.unobserve(image);
      busy++;
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
      image.decode().catch(() => {}).finally(() => { busy--; loadVisible(); });
    }
  }
  const images = wall.querySelectorAll("img[data-src]");
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting && target.hasAttribute("data-src")) pending.add(target);
        else pending.delete(target);
      }
      loadVisible();
    }, { rootMargin: "150px" });
    images.forEach(image => observer.observe(image));
  } else {
    images.forEach(image => { image.loading = "lazy"; image.src = image.dataset.src; });
  }
  return {
    go(index) {
      wall.querySelector('[aria-current]')?.removeAttribute("aria-current");
      albumIndex = index;
      const card = wall.querySelector(`[data-photo="${index}"]`);
      card?.setAttribute("aria-current", "true");
      if (wall.contains(document.activeElement)) card?.focus();
    },
    dispose() { observer?.disconnect(); pending.clear(); }
  };
}
function mountGalleryView() {
  const album = main.querySelector(".pocket-album"), wall = main.querySelector(".photo-wall");
  if (album) albumController = mountPocketAlbum(album);
  else if (wall) albumController = mountPhotoWall(wall);
}
function galleryPage(p) {
  return `<header class="album-heading"><h1>${t(p.title)}</h1>${art(p.image, "", "album-emblem")}</header>` +
    galleryView(p) + `<div class="album-intro">${paragraphs(tr(p.lead))}</div>`;
}
function galleryView(p) {
  const options = [["", t(p.allPhotos) || pageName("gallery")],
    ...Object.entries(galleryAlbums).map(([id, album]) => [id, esc(galleryText(album.label))]),
    ...content.items.groups.map(group => [group.id, t(group.title)])];
  const oldLabel = !p.placesAlbum && ["Выберите группу", "Топты таңдаңыз"].includes(tr(p.filterLabel));
  const filterLabel = (!oldLabel && t(p.filterLabel)) || esc(galleryText("albumsLabel"));
  const filters = options.map(([id, title]) =>
    `<a href="${link("gallery", id)}"${id === record ? ' aria-current="page"' : ""}>${title}</a>`).join("");
  const photos = galleryPhotos(record);
  const modes = photos.length ? `<div class="gallery-modes" role="group" aria-label="${esc(galleryText("viewLabel"))}">
    ${["wall", "stack"].map(mode => `<button type="button" data-gallery-mode="${mode}" aria-pressed="${albumMode === mode}">
    ${icon(mode)}${esc(galleryText(mode + "Mode"))}</button>`).join("")}</div>` : "";
  const empty = `<div class="album-empty"><p>${t(p.emptyAlbum) || label("empty")}</p>
    ${record ? profileLink("gallery", t(p.allPhotos) || pageName("gallery")) : ""}</div>`;
  return `<div class="gallery-toolbar"><nav class="gallery-filter" aria-label="${filterLabel}">
    <strong>${filterLabel}</strong><div>${filters}</div></nav>${modes}</div>
    <div id="gallery-view">${!photos.length ? empty : albumMode === "stack" ? pocketAlbum(photos, p) : photoWall(photos)}</div>`;
}
function photoAlbum(title, photos) {
  return photos?.length
    ? `<section class="group-album"><h2>${t(title) || pageName("gallery")}</h2>${photoGrid(photos)}</section>`
    : "";
}
function profileIntro(title, lead, picture, extra = "") {
  return `<section class="profile-intro${picture ? " illustrated" : ""}">
    <div class="profile-copy"><h1>${t(title)}</h1>${paragraphs(tr(lead))}${extra}</div>
    ${picture ? `<div class="hero-art">${picture}</div>` : ""}</section>`;
}
function profileLink(target, caption) {
  return `<a class="profile-link" href="${link(target)}">${caption}${icon("arrow")}</a>`;
}
function aboutPage(p) {
  const image = p.image === undefined ? content.home.heroImage : p.image;
  const intro = profileIntro(
    p.title,
    p.lead,
    art(image, tr(p.alt ?? content.home.heroAlt)),
    content.items.groups.length ? profileLink("groups", t(content.pages.groups.title)) : ""
  );
  const stories = content.items.about
    .map((row) => `<article><h2>${t(row.title)}</h2>${paragraphs(tr(row.body))}</article>`)
    .join("");
  return (
    intro + schoolFacts(false) + (stories ? `<div class="about-stories">${stories}</div>` : "")
  );
}
function groupPage(group, p) {
  const intro = profileIntro(group.title, group.summary, albumCover(group), groupFacts(group));
  const story = tr(group.body)
    ? `<article class="group-story">${tr(group.storyTitle) ? `<h2>${t(group.storyTitle)}</h2>` : ""}<div>${paragraphs(tr(group.body))}</div></article>`
    : "";
  return (
    intro +
    story +
    photoAlbum(p.albumTitle, galleryPhotos(group.id)) +
    `<div class="group-links">${profileLink("groups", t(p.title))}${profileLink("contacts", pageName("contacts"))}</div>`
  );
}
function clubPage(club, p) {
  const intro = profileIntro(club.title, club.body, albumCover(club) || art(p.image));
  const story = tr(club.description)
    ? `<section class="group-story"><h2>${t(p.aboutTitle)}</h2><div>${paragraphs(tr(club.description))}</div></section>`
    : "";
  const activity = tr(club.activityText)
    ? `<section class="club-game"><div>${icon("book")}
    <span>${t(p.activityLabel) || label("open")}</span></div><h2>${t(club.activityTitle) || t(club.title)}</h2>${paragraphs(tr(club.activityText))}</section>`
    : "";
  return (
    intro +
    story +
    photoAlbum(p.albumTitle, club.photos) +
    activity +
    `<div class="group-links">${profileLink("clubs", pageName("clubs"))}${profileLink("contacts", pageName("contacts"))}</div>`
  );
}
function documentBuckets() {
  const buckets = new Map(
    (content.items.documentSections || []).map((section) => [
      section.id,
      { id: section.id, title: section.title, rows: [] },
    ])
  );
  const other = {
    id: "_",
    title: content.pages.documents.otherSection || content.pages.documents.nav,
    rows: [],
  };
  for (const row of content.items.documents) (buckets.get(row.sectionId) || other).rows.push(row);
  return [...buckets.values(), other].filter((bucket) => bucket.rows.length);
}
function searchWords(value) {
  return value.normalize("NFC").toLocaleLowerCase(lang).replace(/ё/g, "е");
}
function documentResults(buckets) {
  const p = content.pages.documents;
  const tokens = searchWords(documentFilter.query.trim()).split(/\s+/).filter(Boolean);
  let count = 0;
  const groups = buckets
    .filter((bucket) => !documentFilter.section || bucket.id === documentFilter.section)
    .map((bucket) => {
      const matches = bucket.rows.filter((row) => {
        const text = searchWords(
          [bucket.title, row.title, row.body].flatMap((pair) => [pair?.ru, pair?.kk]).join(" ")
        );
        return tokens.every((token) => text.includes(token));
      });
      count += matches.length;
      if (!matches.length) return "";
      return `<section class="doc-section"><h2>${t(bucket.title)}</h2><ul>${matches
        .map((row) => {
          const excerpt = tr(row.body).trim().split(/\r?\n/, 1)[0];
          return `<li><span class="doc-symbol">${icon("file")}</span><div class="doc-copy">
            <a class="doc-title" href="${link("documents", row.id)}">${t(row.title)}</a>${excerpt ? `<p>${esc(excerpt)}</p>` : ""}</div>${documentDownload(row, "dark")}</li>`;
        })
        .join("")}</ul></section>`;
    })
    .join("");
  const summary = count
    ? `${tr(p.resultLabel) || tr(p.nav)} · ${count}`
    : tr(p.noMatches) || tr(content.labels.empty);
  return { summary, groups };
}
function documentSectionFilter(p, buckets) {
  const name = t(p.sectionLabel) || pageName("documents");
  const sections = [{ id: "", title: p.allSections || p.nav }, ...buckets];
  if (buckets.length > 4) {
    const options = sections.map(({ id, title }) =>
      `<option value="${esc(id)}"${id === documentFilter.section ? " selected" : ""}>${t(title)}</option>`).join("");
    return `<label class="doc-field">${name}<select name="doc-section">${options}</select></label>`;
  }
  const choices = sections.map(({ id, title }) =>
    `<label class="doc-choice"><input type="radio" name="doc-section" value="${esc(id)}"${id === documentFilter.section ? " checked" : ""}><span>${t(title)}</span></label>`).join("");
  return `<fieldset class="doc-sections"><legend>${name}</legend><div>${choices}</div></fieldset>`;
}
function documentCatalog() {
  const p = content.pages.documents;
  const buckets = documentBuckets();
  if (!buckets.length) return `<p class="empty">${label("empty")}</p>`;
  if (!buckets.some((bucket) => bucket.id === documentFilter.section)) documentFilter.section = "";
  const results = documentResults(buckets);
  const hint = t(p.searchHint);
  return `<form class="doc-tools" role="search"><div class="doc-field"><label for="doc-search">${t(p.searchLabel) || pageName("documents")}</label>
    <span class="doc-search">${icon("search")}<input id="doc-search" type="search" enterkeyhint="search" value="${esc(documentFilter.query)}"${hint ? ' aria-describedby="doc-hint"' : ""}></span>
    ${hint ? `<small id="doc-hint">${hint}</small>` : ""}</div>
    ${documentSectionFilter(p, buckets)}</form>
    <div class="doc-feedback"><p id="doc-status" tabindex="-1" role="status">${esc(results.summary)}</p>
    <button type="button" class="doc-reset" data-action="reset-documents"${!documentFilter.query && !documentFilter.section ? " hidden" : ""}>${t(p.clearFilters) || label("close")}</button></div>
    <div id="doc-results">${results.groups}</div>`;
}
function refreshDocuments() {
  main.classList.remove("page-arrival");
  const results = documentResults(documentBuckets());
  document.querySelector("#doc-status").textContent = results.summary;
  document.querySelector("#doc-results").innerHTML = results.groups;
  document.querySelector('[data-action="reset-documents"]').hidden =
    !documentFilter.query && !documentFilter.section;
}
function documentArticle(row, p) {
  const section = content.items.documentSections?.find((item) => item.id === row.sectionId);
  const name = t(section?.title) || t(p.otherSection);
  return `<article class="doc-article"><header class="directory-heading documents">
    ${name ? `<span class="doc-category">${icon("file")}${name}</span>` : ""}<h1>${t(row.title)}</h1>
    ${documentDownload(row, "dark")}</header><div class="reading">${paragraphs(tr(row.body))}</div></article>
    <div class="group-links">${profileLink("documents", t(p.title))}</div>`;
}
function newsTime(row) {
  return row.date ? `<time datetime="${esc(row.date)}">${formatDate(row.date)}</time>` : "";
}
function newsList(rows) {
  return `<div class="news-list">${rows
    .map((row, index) => {
      const first = row.photos?.[0];
      const summary = tr(row.summary) || tr(row.body).split(/\n\s*\n/)[0];
      return `<article><a class="news-card${first ? " with-photo" : ""}" href="${link("news", row.id)}" aria-labelledby="story-${esc(row.id)}">
      ${first ? art(first.image, tr(first.alt), "news-thumb", index > 1) : ""}
      <div class="news-card-copy">${newsTime(row)}<h2 id="story-${esc(row.id)}">${t(row.title)}</h2>${summary ? `<p>${esc(summary)}</p>` : ""}
      <span class="news-read">${label("read")}${icon("arrow")}</span></div></a></article>`;
    })
    .join("")}</div>`;
}
function newsArticle(row, p) {
  const [first, ...rest] = row.photos || [];
  const figure = first
    ? `<figure class="news-figure hero-art"><button type="button" data-photo="0" aria-label="${t(first.title) || label("image")}">${art(first.image, tr(first.alt))}<span>${icon("expand")}</span></button>
    <figcaption>${t(first.title)}</figcaption></figure>`
    : "";
  return `<article class="news-article"><header class="profile-intro${first ? " illustrated" : ""}"><div class="profile-copy">${newsTime(row)}<h1>${t(row.title)}</h1>${paragraphs(tr(row.summary))}</div>
    ${figure}</header><div class="news-prose">${paragraphs(tr(row.body))}</div>
    ${rest.length ? `<section class="group-album"><h2>${t(p.albumTitle) || pageName("gallery")}</h2>${photoGrid(rest, 1)}</section>` : ""}</article>
    <div class="group-links">${profileLink("news", t(p.title))}</div>`;
}
function list(p) {
  const rows = content.items[p];
  if (!rows.length) return '<p class="empty">' + label("empty") + "</p>";
  if (p === "clubs")
    return `<div class="club-list">${rows
      .map(
        (club) =>
          `<a class="club-card" aria-labelledby="club-${esc(club.id)}" href="${link("clubs", club.id)}">${albumCover(club) || art(content.pages.clubs.image)}
      <div class="group-card-title"><h2 id="club-${esc(club.id)}">${t(club.title)}</h2><span>${icon("arrow")}</span></div>${paragraphs(tr(club.body))}</a>`
      )
      .join("")}</div>`;
  if (p === "documents") return documentCatalog();
  if (p === "news") return newsList(rows);
  return (
    '<div class="text-list">' +
    rows
      .map((r) => "<article><h2>" + t(r.title) + "</h2>" + paragraphs(tr(r.body)) + "</article>")
      .join("") +
    "</div>"
  );
}
function formatDate(d) {
  return esc(
    new Intl.DateTimeFormat(lang === "kk" ? "kk-KZ" : "ru-RU", {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(new Date(d + "T12:00:00Z"))
  );
}
function pageFrame(crumb, body) {
  const schoolPage = ["about", "groups", "clubs", "gallery", "news", "documents"].includes(page);
  const parent = record && page !== "gallery" ? page : "home";
  return `<div class="inside wrap${schoolPage ? " school-page" : ""}"><div class="crumb">
    <span class="crumb-trail"><a href="${link("home")}">${label("home")}</a><b> / </b>${crumb}</span>
    <a class="crumb-back" href="${link(parent)}">${icon("arrow")}${pageName(parent)}</a>
    </div>${body}</div>`;
}
function inside() {
  const p = content.pages[page];
  if (!p) return missing();
  let title = t(p.title),
    lead = t(p.lead),
    body = "",
    crumb = pageName(page);
  if (page === "gallery") {
    if (record && !Object.hasOwn(galleryAlbums, record) &&
        !content.items.groups.some((group) => group.id === record)) return missing();
    return pageFrame(crumb, `<div id="gallery-body">${galleryPage(p)}</div>`);
  } else if (record) {
    const row = content.items[page]?.find((r) => r.id === record);
    if (!row || !["news", "documents", "clubs", "groups"].includes(page)) return missing();
    title = t(row.title);
    lead = "";
    crumb = '<a href="' + link(page) + '">' + crumb + "</a><b> / </b>" + title;
    if (page === "groups") return pageFrame(crumb, groupPage(row, p));
    if (page === "clubs") return pageFrame(crumb, clubPage(row, p));
    if (page === "news") return pageFrame(crumb, newsArticle(row, p));
    return pageFrame(crumb, documentArticle(row, p));
  } else if (page === "about") {
    return pageFrame(crumb, aboutPage(p));
  } else if (page === "groups") {
    return pageFrame(crumb, groupDirectory(p));
  } else if (["clubs", "documents", "news"].includes(page)) {
    return pageFrame(crumb, directoryHeading(p) + list(page));
  } else if (page === "contacts") {
    return pageFrame(crumb, contactPage());
  } else {
    body = list(page);
  }
  const img = record ? "" : p.image;
  return pageFrame(
    crumb,
    '<section class="page-heading' +
      (img ? " with-art" : "") +
      '"><div><h1>' +
      title +
      "</h1>" +
      (lead ? "<p>" + lead + "</p>" : "") +
      "</div>" +
      (img ? art(img, "", "heading-art") : "") +
      "</section>" +
      body
  );
}
function missing() {
  return (
    '<div class="inside wrap"><h1>' +
    label("notFound") +
    '</h1><a href="' +
    link("home") +
    '">' +
    label("backHome") +
    "</a></div>"
  );
}
function footer() {
  const editorLink = document.documentElement.dataset.staticOnly
    ? ""
    : '<a class="staff" href="admin/">' + label("staff") + "</a>";
  return (
    '<div class="wrap foot">' +
    brand() +
    "<nav>" +
    ["about", "documents", "news", "contacts"].map(key => navLink(key)).join("") +
    "</nav>" +
    editorLink +
    "</div>"
  );
}
function render() {
  let preferred = "ru";
  try {
    preferred = localStorage.getItem("aqb-language") || "ru";
  } catch {}
  const segments = location.hash.replace(/^#\/?/, "").split("/");
  lang = ["ru", "kk"].includes(segments[0]) ? segments[0] : preferred === "kk" ? "kk" : "ru";
  page = segments[1] || "home";
  record = segments[2] || "";
  if (!Object.hasOwn(content.pages, page) && page !== "home") page = "404";
  try {
    localStorage.setItem("aqb-language", lang);
  } catch {}
  document.documentElement.lang = lang;
  const profile =
    record && ["groups", "clubs", "gallery", "news", "documents"].includes(page)
      ? content.items[page === "gallery" ? "groups" : page].find((row) => row.id === record)
      : null;
  const galleryAlbumTitle = page === "gallery" && Object.hasOwn(galleryAlbums, record)
    ? galleryText(galleryAlbums[record].label)
    : "";
  const sectionTitle = galleryAlbumTitle || tr(content.pages[page]?.nav);
  document.title =
    (profile
      ? (page === "gallery" ? tr(content.pages.gallery.nav) + " · " : "") +
        tr(profile.title) +
        " · "
      : sectionTitle
        ? sectionTitle + " · "
        : "") +
    tr(content.brand.name) +
    " · " +
    tr(content.brand.subtitle);
  document.querySelector('meta[name="description"]').content =
    (page === "clubs" ? tr(profile?.body) : tr(profile?.summary)) ||
    tr(content.pages[page]?.lead || content.home.summary);
  const brandIcon = brandLogo();
  if (brandIcon) {
    const favicon = document.querySelector('link[rel="icon"]');
    favicon.removeAttribute("type");
    favicon.href = brandIcon;
  }
  if (dialog.open) dialog.close();
  renderHeader();
  document.querySelector("#footer").innerHTML = footer();
  updateFloatingWhatsApp();
  document.querySelector("#skip").textContent = tr(content.labels.skip);
  const route = page + "/" + record;
  const changedRoute = lastRoute !== route;
  const changedFilter = page === "gallery" && changedRoute && lastRoute?.startsWith("gallery/");
  albumController?.dispose();
  albumController = null;
  disposeHomeScroll?.();
  disposeHomeScroll = null;
  if (changedRoute) albumIndex = 0;
  clearTimeout(arrivalTimer);
  const animate = changedRoute && !changedFilter && matchMedia("(prefers-reduced-motion: no-preference)").matches;
  main.classList.toggle("page-arrival", animate);
  main.innerHTML = page === "home" ? (record ? missing() : home()) : inside();
  if (animate) arrivalTimer = setTimeout(() => main.classList.remove("page-arrival"), 720);
  if (page === "gallery" || page === "home") mountGalleryView();
  const mapFrame = main.querySelector("#contact-map");
  if (mapFrame)
    loadContactMap(mapFrame, content.contacts).catch(() => {
      const section = mapFrame.closest(".contact-location");
      mapFrame.closest(".contact-map")?.remove();
      if (section && !section.querySelector(".arrival-guide")) section.remove();
    });
  const activeFilter = changedFilter && main.querySelector(".gallery-filter a[aria-current]");
  if (activeFilter) {
    activeFilter.focus({ preventScroll: true });
  } else if (lastRoute !== undefined) {
    main.focus({ preventScroll: true });
    if (changedRoute) window.scrollTo(0, 0);
  }
  if (page === "home" && !record) disposeHomeScroll = mountHomeScroll();
  lastRoute = route;
}
function modal(html) {
  document.querySelector("#modal-body").innerHTML =
    '<button class="icon-btn modal-close" data-action="close" aria-label="' +
    label("close") +
    '">' +
    icon("close") +
    "</button>" +
    html;
  dialog.setAttribute("aria-labelledby", "modal-title");
  if (!dialog.open) dialog.showModal();
}
function enablePhotoGestures(viewer, step, { tap, drag, surface, threshold } = {}) {
  const stage = viewer.querySelector(".lightbox-stage");
  const input = surface || stage;
  const button = viewer.querySelector(".photo-zoom");
  const gallery = content.pages.gallery;
  const pointers = new Map();
  let scale = 1, x = 0, y = 0;
  let pinch = null, swipe = null;

  function setView(newScale, newX, newY) {
    const image = stage.querySelector("img:not(.outgoing-photo)");
    if (!image?.naturalWidth) return;
    scale = Math.min(4, Math.max(1, newScale));
    // Bound the visible photo, excluding any empty space added by object-fit: contain.
    const fit = Math.min(image.clientWidth / image.naturalWidth, image.clientHeight / image.naturalHeight);
    const limitX = Math.max(0, (image.naturalWidth * fit * scale - stage.clientWidth) / 2);
    const limitY = Math.max(0, (image.naturalHeight * fit * scale - stage.clientHeight) / 2);
    x = scale === 1 ? 0 : Math.max(-limitX, Math.min(limitX, newX));
    y = scale === 1 ? 0 : Math.max(-limitY, Math.min(limitY, newY));
    image.style.transform = scale === 1 ? "" : `translate(${x}px, ${y}px) scale(${scale})`;
    if (viewer.hasAttribute("data-zoomed") !== (scale > 1)) {
      viewer.toggleAttribute("data-zoomed", scale > 1);
      if (button) {
        button.title = tr(scale > 1 ? gallery.zoomReset : gallery.zoomIn);
        button.setAttribute("aria-label", button.title);
      }
    }
  }
  function fingers() {
    const [a, b] = pointers.values();
    const bounds = stage.getBoundingClientRect();
    return {
      x: (a.x + b.x - bounds.left - bounds.right) / 2,
      y: (a.y + b.y - bounds.top - bounds.bottom) / 2,
      distance: Math.hypot(a.x - b.x, a.y - b.y)
    };
  }
  function startPinch() {
    const middle = fingers();
    pinch = { scale, distance: Math.max(1, middle.distance),
      anchorX: (middle.x - x) / scale, anchorY: (middle.y - y) / scale };
  }
  function reset() {
    pointers.clear();
    pinch = swipe = null;
    drag?.(0);
    setView(1, 0, 0);
  }
  input.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    input.setPointerCapture(event.pointerId);
    swipe = pointers.size === 1 && scale === 1 && (step || tap) && !(window.visualViewport?.scale > 1.01)
      ? { ...point, time: event.timeStamp, isTap: true } : null;
    if (pointers.size === 2) {
      drag?.(0);
      startPinch();
    }
  });
  input.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    if (pointers.size === 2) {
      const middle = fingers();
      const next = Math.min(4, Math.max(1, pinch.scale * middle.distance / pinch.distance));
      setView(next, middle.x - pinch.anchorX * next, middle.y - pinch.anchorY * next);
    } else if (pointers.size === 1 && scale > 1) {
      setView(scale, x + point.x - previous.x, y + point.y - previous.y);
    } else if (swipe) {
      const dx = point.x - swipe.x;
      const vertical = Math.abs(point.y - swipe.y);
      if (Math.abs(dx) >= 7 || vertical >= 7) swipe.isTap = false;
      if (vertical > 12 && vertical > Math.abs(dx)) {
        swipe = null;
        drag?.(0);
      } else if (step && Math.abs(dx) > Math.max(7, vertical * 1.5)) drag?.(dx);
    }
  });
  function finish(event) {
    if (!pointers.delete(event.pointerId)) return;
    const start = swipe;
    swipe = pinch = null;
    if (pointers.size === 2) startPinch();
    if (!pointers.size && scale > 1 && scale < 1.035) setView(1, 0, 0);
    if (event.type !== "pointerup" || !start) { drag?.(0); return; }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.abs(dx);
    const elapsed = event.timeStamp - start.time;
    const flick = event.pointerType === "touch" && distance >= 28 && distance >= elapsed * 0.3;
    if (step && (distance >= (threshold?.() ?? 44) || flick) && distance > 1.5 * Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    } else {
      drag?.(0);
      if (start.isTap && distance < 7 && Math.abs(dy) < 7) tap?.();
    }
  }
  input.addEventListener("pointerup", finish);
  input.addEventListener("pointercancel", finish);
  input.addEventListener("lostpointercapture", (event) => {
    if (event.target === input) finish(event);
  });
  stage.addEventListener("dragstart", (event) => event.preventDefault());
  stage.addEventListener("photochange", reset);
  button?.addEventListener("click", () => {
    const next = scale > 1 ? 1 : 2;
    reset();
    if (next > 1) setView(next, 0, 0);
  });
  const observer = new ResizeObserver(() => {
    if (scale > 1) setView(scale, x, y);
    if (pointers.size === 2) startPinch();
  });
  observer.observe(stage);
  return () => observer.disconnect();
}
async function replaceViewerPhoto(viewer, photo, isCurrent) {
  const stage = viewer.querySelector(".lightbox-stage");
  stage.dispatchEvent(new Event("photochange"));
  const next = new Image();
  next.alt = tr(photo.alt) || tr(photo.title);
  next.src = asset(photo.image);
  // Keep the current photo in place while the next file is loading.
  try { await next.decode(); } catch { /* The image's alternative text remains available. */ }
  if (!viewer.isConnected || !isCurrent()) return false;
  const previous = stage.querySelector("img:not(.outgoing-photo)");
  const fade = previous && previous.src !== next.src && previous.naturalWidth && next.naturalWidth &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  // A later decode must not cancel a swipe already in progress on the next photo.
  if (viewer.hasAttribute("data-zoomed")) stage.dispatchEvent(new Event("photochange"));
  if (!next.naturalWidth && viewer.classList.contains("gallery-lightbox")) stage.innerHTML = unavailablePhoto();
  else stage.replaceChildren(next);
  if (fade) {
    previous.className = "outgoing-photo";
    previous.alt = "";
    previous.setAttribute("aria-hidden", "true");
    previous.addEventListener("animationend", () => previous.remove(), { once: true });
    previous.addEventListener("animationcancel", () => previous.remove(), { once: true });
    stage.append(previous);
  }
  return true;
}
async function showPhoto(i) {
  let rows;
  if (page === "contacts") {
    const c = content.contacts;
    const image = entranceImage(c);
    rows = image ? [{ image, title: c.entrancePhotoLabel || c.mapCaption, alt: c.entrancePhotoAlt }] : [];
  } else if (page === "clubs" || page === "news") {
    rows = content.items[page].find((row) => row.id === record)?.photos;
  } else {
    rows = galleryPhotos(page === "groups" || page === "gallery" ? record : "");
  }
  if (!rows?.length) return;
  activePhoto = (i + rows.length) % rows.length;
  const photo = rows[activePhoto];
  const title = tr(photo.title) || tr(content.labels.image);
  const position = `${activePhoto + 1} / ${rows.length}`;
  const viewer = dialog.open && dialog.querySelector(".lightbox");
  if (viewer) {
    const index = activePhoto;
    if (await replaceViewerPhoto(viewer, photo, () => dialog.open && activePhoto === index)) {
      viewer.querySelector("#modal-title").textContent = title;
      viewer.querySelector(".photo-position").textContent = position;
    }
    return;
  }
  const g = content.pages.gallery;
  const fullAlbum = page === "gallery" || page === "home";
  const canSwipe = rows.length > 1;
  const swipeHint = canSwipe && t(g.swipeHint);
  const zoomButton = tr(g.zoomIn) && tr(g.zoomReset)
    ? `<button type="button" class="icon-btn photo-zoom" aria-label="${t(g.zoomIn)}" title="${t(g.zoomIn)}">${icon("zoom")}</button>` : "";
  const controls = canSwipe
    ? `<button type="button" class="button light" data-action="prev">${icon("arrow")}${label("previous")}</button>
       ${zoomButton}<button type="button" class="button dark" data-action="next">${label("next")}${icon("arrow")}</button>` : zoomButton;
  modal(`<div class="lightbox${fullAlbum ? " gallery-lightbox" : ""}"><div class="lightbox-bar" aria-live="polite" aria-atomic="true">
      <h2 id="modal-title">${esc(title)}</h2><span class="photo-position">${position}</span></div>
      <div class="lightbox-stage">${fullAlbum ? galleryImage(photo) : art(photo.image, tr(photo.alt))}</div>
      ${swipeHint || tr(g.pinchHint) || tr(g.panHint) ? `<div class="photo-hints">
        <p class="photo-fit-hint">${swipeHint ? `<span class="photo-swipe-hint">${swipeHint}</span>` : ""}${t(g.pinchHint)}</p>
        <p class="photo-pan-hint">${t(g.panHint)}</p></div>` : ""}
      ${controls ? `<div class="actions">${controls}</div>` : ""}</div>`);
  const dispose = enablePhotoGestures(dialog.querySelector(".lightbox"), canSwipe ? d => showPhoto(activePhoto + d) : null);
  const openedAlbum = fullAlbum && albumController;
  dialog.addEventListener("close", () => {
    dispose();
    if (!dialog.open && openedAlbum && openedAlbum === albumController) openedAlbum.go(activePhoto, 0);
  }, { once: true });
}
document.addEventListener("error", event => {
  if (event.target.matches?.("img[data-album-image]")) event.target.outerHTML = unavailablePhoto();
}, true);
const pressableControls = [
  ".button", ".icon-btn", ".guide-card", ".group-card", ".club-card", ".news-card", ".wall-print",
  ".club-tabs button", ".gallery-toolbar :is(a, button)", ".album-controls button", ".album-mount > button",
  ".home-jumps button", ".mobile-nav > a"
].join(", ");
let touchPress;
function clearTouchPress() {
  touchPress?.control.removeAttribute("data-pressed");
  touchPress = null;
}
document.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.pointerType === "mouse") return;
  clearTouchPress();
  const control = event.target.closest(pressableControls);
  if (!control || control.matches(":disabled") || control.closest("[inert]")) return;
  touchPress = { control, pointerId: event.pointerId };
  control.setAttribute("data-pressed", "");
}, { passive: true });
for (const type of ["pointerup", "pointercancel"]) {
  window.addEventListener(type, event => {
    if (event.pointerId === touchPress?.pointerId) clearTouchPress();
  }, { passive: true });
}
window.addEventListener("blur", clearTouchPress);
document.addEventListener("click", (event) => {
  const target = event.target.closest("button,a");
  const mobileNav = document.getElementById("mobile-nav");
  if (mobileNav && !mobileNav.hidden && !event.target.closest(".mobile-toggle") &&
      (!mobileNav.contains(event.target) || target?.matches("a"))) {
    const samePage = mobileNav.contains(target) && target.hash === location.hash;
    setMobileMenu(false);
    if (samePage) main.focus({ preventScroll: true });
  }
  const drop = document.querySelector(".dropdown");
  if (drop && !drop.contains(event.target)) drop.open = false;
  if (event.target === dialog) {
    dialog.close();
    return;
  }
  if (!target) return;
  if (target.hasAttribute("data-gallery-mode")) {
    const mode = target.dataset.galleryMode;
    if (mode === albumMode) return;
    main.classList.remove("page-arrival");
    albumMode = mode;
    target.parentElement.querySelectorAll("button").forEach(b =>
      b.setAttribute("aria-pressed", String(b === target)));
    albumController?.dispose();
    const photos = galleryPhotos(record);
    document.getElementById("gallery-view").innerHTML = mode === "stack"
      ? pocketAlbum(photos, content.pages.gallery) : photoWall(photos);
    mountGalleryView();
    return;
  }
  if (target.matches("[data-club]")) {
    selectClub(target);
    return;
  }
  const a = target.dataset.action;
  if (a === "contact-map") {
    const plan = document.getElementById("contact-plan");
    if (plan) {
      plan.focus({ preventScroll: true });
      plan.scrollIntoView({ block: "start" });
    }
    return;
  }
  if (a === "reset-documents") {
    documentFilter.query = "";
    documentFilter.section = "";
    const input = document.querySelector("#doc-search");
    input.value = "";
    const section = document.querySelector(".doc-tools").elements.namedItem("doc-section");
    if (section instanceof RadioNodeList) section[0].checked = true;
    else section.value = "";
    refreshDocuments();
    input.focus();
    return;
  }
  if (target.id === "skip") {
    event.preventDefault();
    main.focus();
    return;
  }
  if (target.matches(".mobile-toggle")) {
    setMobileMenu(mobileNav.hidden);
    return;
  }
  if (target.dataset.photo !== undefined) {
    showPhoto(Number(target.dataset.photo));
    return;
  }
  if (a === "wa")
    modal(
      '<div class="message"><span class="message-icon">' +
        icon("wa") +
        '</span><h2 id="modal-title">' +
        label("waPending") +
        "</h2><p>" +
        label("waEmpty") +
        '</p><a class="button dark" href="' +
        link("contacts") +
        '">' +
        label("toContacts") +
        "</a></div>"
    );
  if (a === "close") dialog.close();
  if (a === "prev" || a === "next") showPhoto(activePhoto + (a === "prev" ? -1 : 1));
  if (target.dataset.download) {
    const r = content.items.documents.find((x) => x.id === target.dataset.download);
    if (!r) return;
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + tr(r.title) + "\r\n\r\n" + tr(r.body)], {
        type: "text/plain;charset=utf-8",
      })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = r.id + "-" + lang + ".txt";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
document.addEventListener("submit", (event) => {
  if (!event.target.matches(".doc-tools")) return;
  event.preventDefault();
  document.querySelector("#doc-status").focus();
});
document.addEventListener("input", (event) => {
  if (event.target.id !== "doc-search") return;
  documentFilter.query = event.target.value;
  refreshDocuments();
});
document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.name !== "doc-section") return;
  documentFilter.section = input.value;
  refreshDocuments();
});
document.addEventListener("keydown", (event) => {
  if (
    event.target.matches('[role="tab"][data-club]') &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  ) {
    event.preventDefault();
    const tabs = Array.from(event.target.parentElement.querySelectorAll('[role="tab"]'));
    const index = tabs.indexOf(event.target);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    selectClub(tabs[next]);
    tabs[next].focus();
    return;
  }
  if (event.key === "Escape") {
    const mobileNav = document.getElementById("mobile-nav");
    if (mobileNav && !mobileNav.hidden) {
      setMobileMenu(false);
      document.querySelector(".mobile-toggle").focus();
      return;
    }
    const d = document.querySelector(".dropdown");
    if (d?.open) {
      d.open = false;
      d.querySelector("summary").focus();
    }
  }
  if (
    dialog.open &&
    dialog.querySelector(".lightbox [data-action=next]") &&
    ["ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    event.preventDefault();
    showPhoto(activePhoto + (event.key === "ArrowLeft" ? -1 : 1));
  }
});
fetch("data/content.json", { cache: "no-store" })
  .then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  })
  .then((data) => {
    content = data;
    render();
    window.addEventListener("hashchange", render);
  })
  .catch(() => {
    main.innerHTML =
      '<div class="wrap inside"><h1>Ақ-Бота</h1><p>Не удалось загрузить материалы. Откройте сайт через локальный сервер и обновите страницу.</p><p lang="kk">Материалдарды жүктеу мүмкін болмады. Сайтты жергілікті сервер арқылы ашып, бетті жаңартыңыз.</p></div>';
  });
