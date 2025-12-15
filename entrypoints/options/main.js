document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkMode");

  browser.storage.sync.get(["darkMode"]).then((result) => {
    darkModeToggle.checked = result.darkMode || false;
  });

  darkModeToggle.addEventListener("change", () => {
    browser.storage.sync.set({ darkMode: darkModeToggle.checked });
  });
});
