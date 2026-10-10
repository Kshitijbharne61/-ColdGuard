/* ColdGuard Design System: presentation-only interactions.
 * This module never reads or mutates shipment data, API clients, or app routes.
 */
(function () {
  "use strict";

  const THEME_KEY = "coldguard-theme";
  const root = document.documentElement;
  const validTheme = (value) => value === "light" || value === "dark";

  function readStoredTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (validTheme(saved)) return saved;
    } catch (_) { /* Storage may be unavailable in restricted browsers. */ }
    return null;
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme, persist) {
    const next = validTheme(theme) ? theme : "light";
    root.setAttribute("data-theme", next);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* Keep the in-memory theme. */ }
    }
    document.querySelectorAll("[data-cg-theme-toggle]").forEach((button) => {
      const label = next === "dark" ? "Switch to light theme" : "Switch to dark theme";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(next === "dark"));
    });
  }

  // Apply the saved preference before first paint; fall back to the OS preference.
  setTheme(readStoredTheme() || systemTheme(), false);

  function closeSidebar() {
    document.body.classList.remove("cg-sidebar-open");
    const toggle = document.querySelector("[data-cg-sidebar-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      toggle.setAttribute("title", "Open navigation menu");
    }
  }

  function openSidebar() {
    document.body.classList.add("cg-sidebar-open");
    const toggle = document.querySelector("[data-cg-sidebar-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      toggle.setAttribute("title", "Close navigation menu");
    }
  }

  let activeModalTrigger = null;
  function closeDemoModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    if (activeModalTrigger && typeof activeModalTrigger.focus === "function") activeModalTrigger.focus();
    activeModalTrigger = null;
  }

  function init() {
    // Handles dashboard and design-system controls via delegation, including injected UI.
    document.addEventListener("click", function (event) {
      const themeToggle = event.target.closest("[data-cg-theme-toggle]");
      if (themeToggle) {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        setTheme(next, true);
        return;
      }

      const navToggle = event.target.closest("[data-cg-sidebar-toggle]");
      if (navToggle) {
        if (document.body.classList.contains("cg-sidebar-open")) closeSidebar();
        else openSidebar();
        return;
      }
      if (event.target.closest("[data-cg-sidebar-close]") || event.target.closest("#cg-sidebar [data-view]")) {
        closeSidebar();
      }

      const modalOpen = event.target.closest("[data-cg-demo-modal-open]");
      if (modalOpen) {
        const modal = document.querySelector(modalOpen.getAttribute("data-cg-demo-modal-open"));
        if (modal) {
          activeModalTrigger = modalOpen;
          modal.hidden = false;
          modal.setAttribute("aria-hidden", "false");
          const firstFocusable = modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
          if (firstFocusable) firstFocusable.focus();
        }
        return;
      }
      const modalClose = event.target.closest("[data-cg-demo-modal-close]");
      if (modalClose) {
        closeDemoModal(modalClose.closest(".cg-modal-backdrop"));
        return;
      }
      if (event.target.classList.contains("cg-modal-backdrop") && event.target.hasAttribute("data-cg-demo-modal")) {
        closeDemoModal(event.target);
        return;
      }

      const toastTrigger = event.target.closest("[data-cg-demo-toast]");
      if (toastTrigger) {
        const toast = document.querySelector("#cg-demo-toast");
        if (toast) {
          toast.hidden = false;
          window.clearTimeout(toast.__cgHideTimer);
          toast.__cgHideTimer = window.setTimeout(function () { toast.hidden = true; }, 3600);
        }
        return;
      }

      const tab = event.target.closest("[data-cg-demo-tab]");
      if (tab) {
        const group = tab.closest("[data-cg-demo-tabgroup]");
        if (!group) return;
        const selected = tab.getAttribute("data-cg-demo-tab");
        group.querySelectorAll("[data-cg-demo-tab]").forEach((item) => {
          const isSelected = item === tab;
          item.setAttribute("aria-selected", String(isSelected));
          item.tabIndex = isSelected ? 0 : -1;
        });
        group.querySelectorAll("[data-cg-demo-panel]").forEach((panel) => {
          panel.hidden = panel.getAttribute("data-cg-demo-panel") !== selected;
        });
      }

      const segment = event.target.closest("[data-cg-demo-segment]");
      if (segment) {
        const group = segment.closest("[data-cg-demo-segment-group]");
        if (!group) return;
        group.querySelectorAll("[data-cg-demo-segment]").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === segment));
        });
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSidebar();
        const modal = document.querySelector("[data-cg-demo-modal][aria-hidden='false']");
        if (modal) closeDemoModal(modal);
      }
    });

    // The OS preference remains live only until the user picks a persisted theme.
    if (window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onPreferenceChange = function () {
        if (!readStoredTheme()) setTheme(media.matches ? "dark" : "light", false);
      };
      if (typeof media.addEventListener === "function") media.addEventListener("change", onPreferenceChange);
      else if (typeof media.addListener === "function") media.addListener(onPreferenceChange);
    }

    setTheme(root.getAttribute("data-theme") || systemTheme(), false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();