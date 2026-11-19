(() => {
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");

  for (const card of document.querySelectorAll(".tilt-link")) {
    function tilt(event) {
      if (event.pointerType !== "mouse" || !motion.matches) return;

      // Le lien garde une zone cliquable fixe pendant que la tuile pivote.
      const bounds = card.getBoundingClientRect();
      const x = 2 * (event.clientX - bounds.left) / bounds.width - 1;
      const y = 1 - 2 * (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-x", x);
      card.style.setProperty("--tilt-y", y);
    }

    function reset() {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    }

    card.addEventListener("pointerenter", tilt);
    card.addEventListener("pointermove", tilt);
    card.addEventListener("pointerleave", reset);
    card.addEventListener("pointercancel", reset);
  }
})();
