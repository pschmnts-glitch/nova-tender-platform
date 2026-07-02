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

    link.classList.toggle("active", isHome || isSection);
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

  if (window.location.hash && window.scrollY < 120) {
    setActiveNavLink(window.location.hash);
    return;
  }

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
  const marker = window.scrollY + topbarHeight + Math.min(window.innerHeight * 0.72, 680);
  const firstSectionTop = sectionPairs.length ? sectionTop(sectionPairs[0].section) : Infinity;
  const nearPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;

  if (window.scrollY < 180 || marker < firstSectionTop) {
    setActiveNavLink("");
    return;
  }

  if (nearPageBottom && sectionPairs.length) {
    setActiveNavLink(sectionPairs[sectionPairs.length - 1].hash);
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
function addScrollButton(parent, className, label, onClick) {
  const button = document.createElement("button");
  button.className = `scrollControl ${className}`;
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  parent.appendChild(button);
}

function setupHorizontalWheelScroll() {
  const tenderGrid = document.querySelector(".tenderGrid");
  if (!tenderGrid || tenderGrid.dataset.wheelScroll) return;
  tenderGrid.dataset.wheelScroll = "true";

  const getWheelArea = () => tenderGrid.closest(".tenderRail") || tenderGrid;
  const getDelta = (event) => {
    const primary = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!primary) return 0;
    const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? tenderGrid.clientWidth : 1;
    return primary * unit;
  };

  const handleWheel = (event) => {
    const wheelArea = getWheelArea();
    const rect = wheelArea.getBoundingClientRect();
    const isInside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!isInside) return;

    const delta = getDelta(event);
    if (!delta) return;

    const maxScrollLeft = tenderGrid.scrollWidth - tenderGrid.clientWidth;
    if (maxScrollLeft <= 1) return;

    const edgeTolerance = 12;
    const atLeftEdge = tenderGrid.scrollLeft <= edgeTolerance;
    const atRightEdge = tenderGrid.scrollLeft >= maxScrollLeft - edgeTolerance;
    const wantsLeft = delta < 0;
    const wantsRight = delta > 0;

    event.preventDefault();
    event.stopPropagation();

    if ((atLeftEdge && wantsLeft) || (atRightEdge && wantsRight)) {
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      return;
    }

    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, tenderGrid.scrollLeft + delta));
    tenderGrid.scrollLeft = nextScrollLeft;

    const landedAtRightEdge = wantsRight && nextScrollLeft >= maxScrollLeft - edgeTolerance;
    const landedAtLeftEdge = wantsLeft && nextScrollLeft <= edgeTolerance;
    if (landedAtRightEdge || landedAtLeftEdge) {
      setTimeout(() => {
        if (landedAtRightEdge) tenderGrid.scrollLeft = maxScrollLeft;
        if (landedAtLeftEdge) tenderGrid.scrollLeft = 0;
      }, 0);
    }
  };

  const wheelArea = getWheelArea();
  wheelArea.addEventListener("wheel", handleWheel, { passive: false });
  tenderGrid.addEventListener("wheel", handleWheel, { passive: false });
  document.addEventListener("wheel", handleWheel, { passive: false, capture: true });
}

function setupScrollControls() {
  const consoleBlock = document.querySelector(".tenderConsole");
  const consoleList = document.querySelector(".consoleList") || consoleBlock;
  if (consoleBlock && consoleList && !consoleBlock.dataset.scrollControls) {
    consoleBlock.dataset.scrollControls = "true";
    addScrollButton(consoleBlock, "up", "Прокрутить live-ленту вверх", () => {
      consoleList.scrollBy({ top: -180, behavior: "smooth" });
    });
    addScrollButton(consoleBlock, "down", "Прокрутить live-ленту вниз", () => {
      consoleList.scrollBy({ top: 180, behavior: "smooth" });
    });
  }

  const tenderGrid = document.querySelector(".tenderGrid");
  if (tenderGrid && !tenderGrid.closest(".tenderRail")) {
    const rail = document.createElement("div");
    rail.className = "tenderRail";
    tenderGrid.parentNode.insertBefore(rail, tenderGrid);
    rail.appendChild(tenderGrid);
    addScrollButton(rail, "left", "Прокрутить тендеры влево", () => {
      tenderGrid.scrollBy({ left: -Math.max(320, tenderGrid.clientWidth * 0.75), behavior: "smooth" });
    });
    addScrollButton(rail, "right", "Прокрутить тендеры вправо", () => {
      tenderGrid.scrollBy({ left: Math.max(320, tenderGrid.clientWidth * 0.75), behavior: "smooth" });
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setupScrollSpy();
  setupRevealAnimations();
  setupScrollControls();
  setupHorizontalWheelScroll();
});
setActiveNavLink();
