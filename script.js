"use strict";

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionAnimations = new Map();
function playMotion(element, keyframes, options) {
  if (motionPreference.matches || !element.animate) return;
  motionAnimations.get(element)?.cancel();
  const animation = element.animate(keyframes, options);
  motionAnimations.set(element, animation);
  const cleanup = () => {
    if (motionAnimations.get(element) === animation) motionAnimations.delete(element);
  };
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}

const header = document.querySelector(".header");
const hero = document.querySelector(".hero");
const heroStage = document.querySelector(".hero-stage");
const scrollGuide = document.querySelector(".scroll-link");
const slides = [...document.querySelectorAll(".hero-image")];
const slideButtons = [...document.querySelectorAll("[data-go-slide]")];
const heroPagination = document.querySelector(".hero-pagination");
const heroPlayback = document.querySelector(".hero-playback");
const heroHover = window.matchMedia("(hover: hover)");
const heroSlideDelay = 6000;
let activeSlide = 0;
let heroSlideTimer = 0;
let heroUserPaused = false;
let heroPhotosReady = false;

const stay = document.querySelector(".stay");
const stayPanel = stay.querySelector(".stay-panel");
const stayDetails = stay.querySelector(".stay-details");
const stayPhotos = [...stay.querySelectorAll(".stay-photo")];
const stayDesktop = window.matchMedia("(min-width: 851px) and (min-height: 700px)");
// Keep a single source for each description and link. The original stays with
// its photograph on small screens and when JavaScript is unavailable.
const stayCopies = [...stay.querySelectorAll(".stay-service > .stay-copy")].map((copy, index) => {
  const clone = copy.cloneNode(true);
  clone.classList.toggle("is-active", index === 0);
  clone.inert = index !== 0;
  clone.setAttribute("aria-hidden", String(index !== 0));
  stayDetails.append(clone);
  return clone;
});
let activeStay = 0;
stay.classList.add("is-enhanced");

function updateStayViewport() {
  stayDetails.setAttribute("aria-hidden", String(!stayDesktop.matches));
  if (!stayDesktop.matches) return;
  stay.style.setProperty("--stay-panel-height", `${stayPanel.offsetHeight}px`);
  // Preserve a link while someone is using it with the keyboard.
  if (stayDetails.contains(document.activeElement)) return;
  let next = 0;
  // Change the description as the next photograph enters the lower third,
  // rather than waiting for its center to reach the middle of the screen.
  const switchLine = window.innerHeight * .65;
  stayPhotos.forEach((photo, index) => {
    const bounds = photo.getBoundingClientRect();
    if (bounds.top <= switchLine) next = index;
  });
  if (next === activeStay) return;
  activeStay = next;
  stayCopies.forEach((copy, index) => {
    const active = index === next;
    copy.classList.toggle("is-active", active);
    copy.inert = !active;
    copy.setAttribute("aria-hidden", String(!active));
  });
}
stayDesktop.addEventListener("change", scheduleViewportUpdate);
stayDetails.addEventListener("focusout", scheduleViewportUpdate);
const stayPanelObserver = new ResizeObserver(scheduleViewportUpdate);
stayPanelObserver.observe(stayPanel);

// A full-height background stays behind the naturally scrolling introduction.
function updateViewport() {
  const scrollIntoHero = Math.max(0, window.scrollY - hero.offsetTop);
  const pastOpening = scrollIntoHero > 100;
  hero.classList.toggle("is-past-opening", pastOpening);
  scrollGuide.inert = pastOpening;
  const dimProgress = Math.min(1, scrollIntoHero / heroStage.offsetHeight);
  hero.style.setProperty("--hero-dim", (dimProgress * .3).toFixed(3));
  const threshold = parseFloat(getComputedStyle(header).getPropertyValue("--scrolled-height"));
  header.classList.toggle("is-scrolled", heroStage.getBoundingClientRect().bottom <= threshold);
  updateStayViewport();
  updateHeroPlayback();
}

let viewportFrame = 0;
function scheduleViewportUpdate() {
  if (viewportFrame) return;
  viewportFrame = requestAnimationFrame(() => {
    viewportFrame = 0;
    updateViewport();
  });
}
window.addEventListener("scroll", scheduleViewportUpdate, { passive: true });
window.addEventListener("resize", scheduleViewportUpdate);
updateViewport();
document.fonts.ready.then(scheduleViewportUpdate);

// Show the current photograph and the next two choices; wrap after the last.
function showSlide(index, { announce = false } = {}) {
  const changed = !slides[index].classList.contains("is-active");
  activeSlide = index;
  slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
  slideButtons.forEach((button, offset) => {
    const target = (index + offset) % slides.length;
    button.dataset.goSlide = String(target);
    button.textContent = String(target + 1).padStart(2, "0");
    button.setAttribute("aria-label", slides[target].dataset.label);
    button.classList.toggle("is-active", offset === 0);
    button.setAttribute("aria-pressed", String(offset === 0));
    if (changed) playMotion(button, [{ opacity: .55 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
  });
  const caption = document.querySelector("#slide-caption");
  // Manual choices are announced; automatic changes do not interrupt reading.
  caption.setAttribute("aria-live", announce ? "polite" : "off");
  const detail = document.createElement("span");
  detail.textContent = slides[index].dataset.detail;
  caption.replaceChildren(document.createTextNode(slides[index].dataset.caption + " "), detail);
  if (changed) playMotion(caption, [{ opacity: .35, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 250, easing: "ease-out" });
}
slideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.goSlide);
    const keepFocus = document.activeElement === button;
    showSlide(index, { announce: true });
    // The selected number moves to the first slot. Keep keyboard focus on it.
    if (keepFocus) slideButtons[0].focus({ preventScroll: true });
    updateHeroPlayback({ reset: true });
  });
});

function canPlayHero() {
  const bounds = heroStage.getBoundingClientRect();
  const choosingWithKeyboard = slideButtons.some((button) => button === document.activeElement && button.matches(":focus-visible"));
  return heroPhotosReady && !heroUserPaused && !motionPreference.matches &&
    !document.hidden && !document.body.classList.contains("has-dialog") &&
    bounds.bottom > header.offsetHeight && bounds.top < innerHeight &&
    !(heroHover.matches && heroPagination.matches(":hover") && !heroPlayback.matches(":hover")) && !choosingWithKeyboard;
}

function updateHeroPlayback({ reset = false } = {}) {
  heroPlayback.hidden = motionPreference.matches;
  const label = heroUserPaused ? "写真の自動切り替えを再開" : "写真の自動切り替えを一時停止";
  heroPlayback.setAttribute("aria-label", label);
  heroPlayback.title = label;
  heroPlayback.querySelector("path").setAttribute("d", heroUserPaused ? "M8 5l11 7-11 7z" : "M9 5v14M15 5v14");
  const playing = canPlayHero();
  if (reset || !playing) {
    window.clearTimeout(heroSlideTimer);
    heroSlideTimer = 0;
  }
  if (!playing || heroSlideTimer) return;
  heroSlideTimer = window.setTimeout(() => {
    heroSlideTimer = 0;
    if (canPlayHero()) showSlide((activeSlide + 1) % slides.length);
    updateHeroPlayback();
  }, heroSlideDelay);
}

heroPlayback.addEventListener("click", () => {
  heroUserPaused = !heroUserPaused;
  updateHeroPlayback({ reset: true });
});
heroPlayback.addEventListener("mouseenter", () => updateHeroPlayback());
heroPlayback.addEventListener("mouseleave", () => updateHeroPlayback());
heroPagination.addEventListener("mouseenter", () => updateHeroPlayback());
heroPagination.addEventListener("mouseleave", () => updateHeroPlayback());
heroPagination.addEventListener("focusin", () => updateHeroPlayback());
heroPagination.addEventListener("focusout", scheduleViewportUpdate);
document.addEventListener("visibilitychange", () => updateHeroPlayback());
motionPreference.addEventListener("change", () => updateHeroPlayback());
Promise.all(slides.map((slide) => slide.decode().catch(() => {}))).then(() => {
  heroPhotosReady = true;
  updateHeroPlayback();
});

// Add reveals only when the browser can observe them. Without JavaScript or
// with reduced motion, the HTML stays visible and usable from the first paint.
if ("IntersectionObserver" in window && !motionPreference.matches) {
  const revealTargets = new Set();
  const pendingPhotoReveals = new WeakSet();
  const reveal = (element, immediately = false) => {
    if (element.classList.contains("is-revealed") && !immediately) return;
    element.classList.add("is-revealed");
    if (immediately) element.classList.add("motion-complete");
    revealObserver.unobserve(element);
  };
  const revealPhotoWhenReady = (element) => {
    const image = element.querySelector("img");
    if (!image || (image.complete && image.naturalWidth > 0)) {
      reveal(element);
      return;
    }
    if (pendingPhotoReveals.has(element)) return;
    pendingPhotoReveals.add(element);
    const finish = () => {
      pendingPhotoReveals.delete(element);
      reveal(element);
    };
    if (image.decode) image.decode().then(finish, finish);
    else {
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
    }
  };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target.classList.contains("motion-reveal-photo")) revealPhotoWhenReady(entry.target);
      else reveal(entry.target);
    });
  }, { threshold: .08, rootMargin: "0px 0px -6% 0px" });

  function prepareReveal(selector, { step = 0, delay = 0, kind = "" } = {}) {
    const elements = typeof selector === "string" ? document.querySelectorAll(selector) : selector;
    elements.forEach((element, index) => {
      element.classList.add("motion-reveal");
      if (kind) element.classList.add(`motion-reveal-${kind}`);
      element.style.setProperty("--reveal-delay", `${delay + index * step}ms`);
      revealTargets.add(element);
      revealObserver.observe(element);
      element.addEventListener("animationend", (event) => {
        if (event.target === element) element.classList.add("motion-complete");
      });
    });
  }

  prepareReveal(".hero-eyebrow", { delay: 60 });
  prepareReveal(".hero h1", { delay: 160 });
  prepareReveal(".hero-introduction-copy > *", { step: 50 });
  prepareReveal(".news-heading");
  prepareReveal(".news-item", { step: 70, delay: 60 });
  prepareReveal(".news-more", { delay: 160 });
  // Animate the contents of sticky headings, rather than the sticky wrapper.
  prepareReveal(".hotels-heading > *", { step: 60 });
  document.querySelectorAll(".hotel").forEach((hotel) => {
    prepareReveal(hotel.querySelectorAll(".hotel-gallery figure"), { kind: "photo", step: 100 });
  });
  prepareReveal(".hotel-info", { delay: 120 });
  prepareReveal(".stay-panel > .eyebrow, .stay-panel > h2", { step: 70 });
  // Keep photo geometry unchanged so the existing text-switch timing holds.
  prepareReveal(".stay-photo", { kind: "still" });
  prepareReveal(".stay-service > .stay-copy", { delay: 80 });
  prepareReveal(".contact-copy > *", { step: 80 });
  prepareReveal(".contact > .contact-reserve", { delay: 220 });
  prepareReveal(".footer-identity", { kind: "still" });
  prepareReveal(".footer-column-hotels > h2");
  prepareReveal(".footer-hotels-grid > li", { step: 60, kind: "still" });
  prepareReveal(".footer-secondary > *, .footer-bottom", { kind: "still" });

  // Keyboard and anchor navigation must never land on invisible content.
  document.addEventListener("focusin", (event) => {
    let element = event.target.closest(".motion-reveal");
    while (element) {
      reveal(element, true);
      element = element.parentElement?.closest(".motion-reveal");
    }
  });
  motionPreference.addEventListener("change", () => {
    if (!motionPreference.matches) return;
    revealTargets.forEach((element) => reveal(element, true));
    revealObserver.disconnect();
  });
  const heroBounds = hero.getBoundingClientRect();
  if (heroBounds.top <= innerHeight && heroBounds.bottom > 0 && !hero.classList.contains("is-past-opening")) {
    playMotion(document.querySelector(".hero-images"), [{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: "ease-out" });
  }
}

motionPreference.addEventListener("change", () => {
  if (!motionPreference.matches) return;
  motionAnimations.forEach((animation) => animation.cancel());
  motionAnimations.clear();
});

const reservationDialog = document.querySelector("#reservation-dialog");
const menuDialog = document.querySelector("#menu-dialog");
const dialogs = [reservationDialog, menuDialog];
const dialogCloseTimers = new WeakMap();

function finishDialogClose(dialog) {
  window.clearTimeout(dialogCloseTimers.get(dialog));
  dialogCloseTimers.delete(dialog);
  dialog.classList.remove("is-opening", "is-closing");
  if (dialog.open) dialog.close();
}

function closeDialog(dialog, { immediately = false } = {}) {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  if (immediately || motionPreference.matches) {
    finishDialogClose(dialog);
    return;
  }
  dialog.classList.remove("is-opening");
  dialog.classList.add("is-closing");
  const finish = (event) => {
    if (event && (event.target !== dialog || event.animationName !== "dialog-close")) return;
    dialog.removeEventListener("animationend", finish);
    finishDialogClose(dialog);
  };
  dialog.addEventListener("animationend", finish);
  dialogCloseTimers.set(dialog, window.setTimeout(() => finish(), 350));
}

function openDialog(dialog) {
  dialogs.forEach((other) => { if (other.open && other !== dialog) closeDialog(other, { immediately: true }); });
  if (dialog.open) return;
  dialog.classList.remove("is-closing");
  dialog.showModal();
  // Keep the class until close so the staggered child animations can finish.
  if (!motionPreference.matches) dialog.classList.add("is-opening");
  document.body.classList.add("has-dialog");
  updateHeroPlayback();
}
document.querySelectorAll("[data-reserve]").forEach((button) => {
  button.addEventListener("click", () => openDialog(reservationDialog));
});
document.querySelector(".menu-button").addEventListener("click", () => openDialog(menuDialog));
dialogs.forEach((dialog) => {
  dialog.querySelector("[data-close-dialog]").addEventListener("click", () => closeDialog(dialog));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener("close", () => {
    dialog.classList.remove("is-opening", "is-closing");
    if (!dialogs.some((item) => item.open)) document.body.classList.remove("has-dialog");
    updateHeroPlayback();
  });
  // Only backdrop clicks close the modal; empty space inside remains interactive.
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
  });
});
menuDialog.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", () => {
    menuDialog.close();
    // Move focus to the destination after the native dialog restores its trigger.
    const destination = document.querySelector(link.hash);
    if (destination) requestAnimationFrame(() => {
      destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
    });
  });
});
