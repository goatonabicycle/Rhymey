document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkMode");

  chrome.storage.sync.get(["darkMode"], (result) => {
    darkModeToggle.checked = result.darkMode || false;
  });

  darkModeToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ darkMode: darkModeToggle.checked });
  });
});
