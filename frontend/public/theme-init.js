(() => {
  const storageKey = "parkventory:ui-theme:v1";
  let theme = "dark";
  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === "light" || storedTheme === "dark") theme = storedTheme;
  } catch {
    // Keep the dark default when storage is unavailable.
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "light" ? "#f4f6f1" : "#030504",
  );
})();
