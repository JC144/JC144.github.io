(() => {
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const mobilePortrait = matchMedia("(max-width: 42rem) and (orientation: portrait)");

  for (const card of document.querySelectorAll(".tilt-link")) {
    function tilt(event) {
      if (!event.isPrimary) return;
      const mouse = event.pointerType === "mouse" && !card.matches(".article-row");
      const touch = event.pointerType === "touch" && event.buttons && mobilePortrait.matches;
      if (!mouse && !touch) return;

      card.dataset.tilt = event.pointerType;
      if (!motion.matches) return;

      // Le lien garde une zone cliquable fixe pendant que la tuile pivote.
      const bounds = card.getBoundingClientRect();
      const x = 2 * (event.clientX - bounds.left) / bounds.width - 1;
      const y = 1 - 2 * (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-x", Math.max(-1, Math.min(1, x)));
      card.style.setProperty("--tilt-y", Math.max(-1, Math.min(1, y)));
    }

    function reset(event) {
      if (!event.isPrimary) return;
      delete card.dataset.tilt;
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    }

    card.addEventListener("pointerenter", tilt);
    card.addEventListener("pointerdown", tilt);
    card.addEventListener("pointermove", tilt);
    card.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") reset(event);
    });
    card.addEventListener("pointerleave", reset);
    card.addEventListener("pointercancel", reset);
  }
})();
