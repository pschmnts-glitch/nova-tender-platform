const navLinks = Array.from(document.querySelectorAll(".links a"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let scrollSpyTicking = false;

function normalizePath(pathname) {
  const file = pathname.split("/").pop() || "nova-tender-platform.html";
  return file === "index.html" ? "nova-tender-platform.html" : file;
}

function currentPageKey() {
  return normalizePath(window.location.pathname);
}

function setActiveNavLink(targetHash = window.location.hash) {
  const currentFile = currentPageKey();

  navLinks.forEach((link) => {
    const url = new URL(link.getAttribute("href"), window.location.href);
    const linkFile = normalizePath(url.pathname);
    const samePage = linkFile === currentFile;
    const isHome = samePage && !url.hash && !targetHash && currentFile === "nova-tender-platform.html";
    const isSection = samePage && url.hash && url.hash === targetHash;
    const isCatalog = currentFile === "tenders.html" && linkFile === "tenders.html";
    const isTenderPage = currentFile.startsWith("tender-") && linkFile === "tenders.html";

    link.classList.toggle("active", isHome || isSection || isCatalog || isTenderPage);
  });
}

function sectionForLink(link) {
  const url = new URL(link.getAttribute("href"), window.location.href);
  if (normalizePath(url.pathname) !== currentPageKey() || !url.hash) return null;
  return document.querySelector(url.hash);
}

function sectionTop(section) {
  return section.getBoundingClientRect().top + window.scrollY;
}

function updateActiveByScroll() {
  scrollSpyTicking = false;

  if (currentPageKey() !== "nova-tender-platform.html") {
    setActiveNavLink();
    return;
  }

  const sectionPairs = navLinks
    .map((link) => {
      const url = new URL(link.getAttribute("href"), window.location.href);
      return { hash: url.hash, section: sectionForLink(link) };
    })
    .filter((item) => item.hash && item.section);

  const topbar = document.querySelector(".topbar");
  const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
  const marker = window.scrollY + topbarHeight + Math.min(window.innerHeight * 0.34, 260);
  const firstSectionTop = sectionPairs.length ? sectionTop(sectionPairs[0].section) : Infinity;

  if (window.scrollY < 180 || marker < firstSectionTop) {
    setActiveNavLink("");
    return;
  }

  const active = sectionPairs
    .filter((item) => marker >= sectionTop(item.section))
    .sort((a, b) => sectionTop(b.section) - sectionTop(a.section))[0];

  setActiveNavLink(active ? active.hash : "");
}

function requestScrollSpyUpdate() {
  if (scrollSpyTicking) return;
  scrollSpyTicking = true;
  window.requestAnimationFrame(updateActiveByScroll);
}

function setupScrollSpy() {
  updateActiveByScroll();
  window.addEventListener("scroll", requestScrollSpyUpdate, { passive: true });
  window.addEventListener("resize", requestScrollSpyUpdate);
}

function setupRevealAnimations() {
  const revealTargets = document.querySelectorAll([
    ".sectionHead",
    ".stat",
    ".aboutCard",
    ".project",
    ".tender",
    ".row",
    ".content",
    ".offer",
    ".contactHeroCard",
    ".contactCard",
    ".contactForm",
    ".cta",
    ".tenderConsole",
    ".consoleItem"
  ].join(","));

  revealTargets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-index", String(Math.min(index % 4, 3)));
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.12
  });

  revealTargets.forEach((element) => observer.observe(element));
}

window.addEventListener("hashchange", () => {
  setActiveNavLink();
  requestScrollSpyUpdate();
});
window.addEventListener("DOMContentLoaded", () => {
  setupScrollSpy();
  setupRevealAnimations();
});
setActiveNavLink();
