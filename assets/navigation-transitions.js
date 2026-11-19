(() => {
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const canShareTitle = "onpageswap" in window && "onpagereveal" in window &&
    "activation" in (window.navigation ?? {}) && CSS.supports("selector(:active-view-transition-type(detail))");
  const storageKey = "jcvasselon:page-arrival";
  let departure;

  try {
    const arrival = JSON.parse(sessionStorage.getItem(storageKey));
    sessionStorage.removeItem(storageKey);
    if (motion.matches && arrival?.href === location.href && ["forward", "backward", "fade"].includes(arrival.direction)) {
      root.dataset.pageEnter = arrival.direction;
    }
  } catch {
    // Une navigation reste possible si le stockage est indisponible.
  }

  function clearDeparture() {
    departure = undefined;
    delete root.dataset.pageExit;
  }

  function clearArrival(event) {
    if (["page-slide-in", "page-fade-in"].includes(event.animationName) && event.target.matches(".site-footer")) {
      delete root.dataset.pageEnter;
    }
  }

  document.addEventListener("animationend", clearArrival);
  document.addEventListener("animationcancel", clearArrival);

  function pagePath(url) {
    return url.pathname.replace(/\/(?:index\.html)?$/, "");
  }

  // Seules une liste et ses propres fiches partagent un titre.
  function hierarchyTitle(otherHref) {
    if (!otherHref) return;
    const other = new URL(otherHref);
    if (other.origin !== location.origin) return;
    const path = pagePath(other);
    const parentTab = document.querySelector('.pivot a[aria-current="location"]');
    if (parentTab && pagePath(parentTab) === path) return document.querySelector(".detail-heading h1");

    const links = document.querySelectorAll(".landing-page :is(.project-card, .article-row)");
    const item = Array.from(links).find((link) => pagePath(link) === path);
    return item?.querySelector("h3, .article-title");
  }

  function shareTitle(viewTransition, title) {
    delete root.dataset.pageEnter;
    viewTransition.types.add("detail");
    // Une fiche longue peut être quittée ou restaurée loin de son titre.
    const bounds = title.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= root.clientHeight) return;
    title.style.viewTransitionName = "detail-title";
    viewTransition.finished.then(() => title.style.removeProperty("view-transition-name"));
  }

  function skipNativeTransition(viewTransition) {
    // La promesse ready est rejetée quand la transition native est annulée.
    viewTransition.ready.catch(() => {});
    viewTransition.skipTransition();
  }

  window.addEventListener("pageswap", ({ viewTransition, activation }) => {
    if (!viewTransition) return;
    if (departure) return skipNativeTransition(viewTransition);
    const title = canShareTitle && motion.matches && hierarchyTitle(activation?.entry?.url);
    if (title) shareTitle(viewTransition, title);
  });

  window.addEventListener("pagereveal", ({ viewTransition }) => {
    const activation = window.navigation?.activation;
    if (!motion.matches || !activation?.from) return;
    const title = hierarchyTitle(activation.from.url);
    if (title && canShareTitle && viewTransition) return shareTitle(viewTransition, title);
    if (title) {
      root.dataset.pageEnter = "fade";
    } else if (viewTransition && activation.navigationType === "traverse") {
      root.dataset.pageEnter = activation.entry.index < activation.from.index ? "backward" : "forward";
    } else {
      return;
    }

    if (viewTransition) skipNativeTransition(viewTransition);
  });

  window.addEventListener("pagehide", () => {
    clearDeparture();
    delete root.dataset.pageEnter;
  });

  document.addEventListener("click", async (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

    const movesToAnotherPage = link.pathname !== location.pathname || link.search !== location.search;
    if (!motion.matches || link.origin !== location.origin || !["http:", "https:"].includes(link.protocol) || !movesToAnotherPage) {
      clearDeparture();
      return;
    }

    const title = hierarchyTitle(link.href);
    if (title && canShareTitle) {
      clearDeparture();
      delete root.dataset.pageEnter;
      return;
    }

    const pivotLinks = Array.from(document.querySelectorAll(".pivot a[href]"));
    const currentIndex = pivotLinks.findIndex((item) => item.hasAttribute("aria-current"));
    // Les fiches reprennent l’onglet de leur rubrique.
    const nextTab = pivotLinks.filter((item) => link.pathname.startsWith(item.pathname))
      .sort((a, b) => b.pathname.length - a.pathname.length)[0];
    const nextIndex = pivotLinks.indexOf(nextTab);
    const movesBackward = link.relList.contains("prev") || (nextIndex >= 0 && nextIndex < currentIndex);

    event.preventDefault();
    const currentTab = pivotLinks[currentIndex];
    if (currentTab && nextTab) {
      const from = currentTab.getBoundingClientRect();
      const to = nextTab.getBoundingClientRect();
      currentTab.style.setProperty("--tab-x", `${to.left - from.left}px`);
      currentTab.style.setProperty("--tab-y", `${to.bottom - from.bottom}px`);
      currentTab.style.setProperty("--tab-scale", to.width / from.width);
    }
    const direction = title ? "fade" : (movesBackward ? "backward" : "forward");
    const next = { href: link.href, direction };
    departure = next;
    delete root.dataset.pageEnter;
    root.dataset.pageExit = next.direction;

    const main = document.getElementById("contenu");
    const animation = main?.getAnimations?.().find((item) => ["page-slide-out", "page-fade-out"].includes(item.animationName));
    await animation?.finished.catch(() => {});
    if (departure !== next) return;

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Le lien reste utilisable si le stockage est indisponible.
    }
    location.assign(next.href);
  });
})();
