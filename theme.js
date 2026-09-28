// Applies the saved theme before the page paints to avoid a flash of the wrong colors.
(() => {
  let theme = "system";
  try { theme = localStorage.getItem("fauwx:theme") || "system"; } catch { /* ignore */ }
  document.documentElement.dataset.theme = theme;
})();
