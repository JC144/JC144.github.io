(() => {
  if (!("IntersectionObserver" in window) || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

  const footer = document.querySelector(".site-footer");
  const list = footer.querySelector(".social-list");
  Array.from(list.children).forEach((item, index) => item.style.setProperty("--social-index", index));
  list.dataset.socialReveal = "pending";

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    // Sur une page courte, attendre la fin de l’entrée du pied de page.
    const arrival = footer.getAnimations?.().find((animation) => ["page-slide-in", "page-fade-in"].includes(animation.animationName));
    if (arrival) await arrival.finished.catch(() => {});
    list.dataset.socialReveal = "visible";
  });
  observer.observe(list);
})();
