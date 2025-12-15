import { fetchWordInfo } from "../src/api/datamuse.js";
import { config } from "../src/config.js";
import { displayPopup, removeExistingPopup } from "../src/ui/popup.js";
import { handleWindowResize } from "../src/ui/resizable.js";
import { getSelectedText } from "../src/utils/selection.js";
import "./style.css";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*", "http://localhost/*"],
  runAt: "document_start",
  allFrames: true,

  main() {
    document.addEventListener("DOMContentLoaded", () => {
      document.addEventListener("dblclick", handleDoubleClick);
      document.addEventListener("mouseup", handleClosePopup);
      document.addEventListener("keydown", handleKeydownPopupClose);
      window.addEventListener("resize", handleWindowResize);
    });
  },
});

async function handleDoubleClick() {
  const selectedWord = getSelectedText().trim();

  if (
    selectedWord?.length >= config.wordMinimumLength &&
    selectedWord.length <= config.wordMaximumLength
  ) {
    const wordInfo = await fetchWordInfo(selectedWord);
    displayPopup(selectedWord, wordInfo);
  }
}

function handleClosePopup(event) {
  if (!event.target.closest("#RhymeContainer")) {
    removeExistingPopup();
  }
}

function handleKeydownPopupClose(event) {
  if (event.key === "Escape") {
    removeExistingPopup();
  }
}
