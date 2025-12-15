import { config } from "../config.js";
import { getLocalStorage, getSyncStorage } from "../utils/storage.js";
import { makeDraggable } from "./draggable.js";
import { makeResizable } from "./resizable.js";

export async function displayPopup(word, results) {
  removeExistingPopup();
  highlightSelection();
  const popup = createPopupElement(word, results);
  document.body.appendChild(popup);
  await checkDarkMode();
  makeDraggable(popup);
  makeResizable(popup);
  setupDefinitionToggle(popup);
}

export function createPopupElement(word, results) {
  const container = document.createElement("div");
  container.id = "RhymeContainer";
  container.className = "rhymey-popup";

  const popupTop = getLocalStorage("popupTop", config.popup.top);
  const popupRight = getLocalStorage("popupRight", config.popup.right);
  const popupWidth = getLocalStorage("popupWidth", config.popup.width);

  container.style.cssText = `position: fixed; top: ${popupTop}; right: ${popupRight}; width: ${popupWidth}; max-height: ${config.popup.maxHeight};`;

  const { rhymes, nearRhymes, similar, related, definitions } = results;

  // Combine rhymes, mark near rhymes
  const allRhymes = [
    ...rhymes.map((r) => ({ word: r.word, near: false })),
    ...nearRhymes.map((r) => ({ word: r.word, near: true })),
  ];

  // Remove duplicates
  const seen = new Set();
  const uniqueRhymes = allRhymes.filter((r) => {
    if (seen.has(r.word)) return false;
    seen.add(r.word);
    return true;
  });

  const rhymesList = uniqueRhymes.length
    ? uniqueRhymes
        .map(
          (r) =>
            `<span class="rhymey-chip${r.near ? " near" : ""}">${r.word}</span>`
        )
        .join("")
    : '<div class="rhymey-empty">No rhymes found</div>';

  const moreContent = renderMoreSection(similar, related, definitions);

  container.innerHTML = `
    <div class="rhymey-word">${word}</div>
    <div class="rhymey-list">${rhymesList}</div>
    <div class="rhymey-more-toggle">More</div>
    <div class="rhymey-more-content">${moreContent}</div>
  `;

  return container;
}

function renderMoreSection(similar, related, definitions) {
  let html = "";

  // Similar words section
  if (similar && similar.length > 0) {
    const similarChips = similar
      .slice(0, 15)
      .map((w) => `<span class="rhymey-chip">${w.word}</span>`)
      .join("");
    html += `
      <div class="rhymey-more-section">
        <div class="rhymey-more-label">Similar</div>
        <div class="rhymey-more-chips">${similarChips}</div>
      </div>
    `;
  }

  // Related words section
  if (related && related.length > 0) {
    const relatedChips = related
      .slice(0, 15)
      .map((w) => `<span class="rhymey-chip">${w.word}</span>`)
      .join("");
    html += `
      <div class="rhymey-more-section">
        <div class="rhymey-more-label">Related</div>
        <div class="rhymey-more-chips">${relatedChips}</div>
      </div>
    `;
  }

  // Definition section
  const defContent = renderDefinition(definitions);
  html += `
    <div class="rhymey-more-section">
      <div class="rhymey-more-label">Definition</div>
      ${defContent}
    </div>
  `;

  return html;
}

function renderDefinition(definitions) {
  if (!definitions || definitions.length === 0) {
    return '<div class="rhymey-empty">No definition found</div>';
  }

  const defs = definitions[0].defs || [];
  if (defs.length === 0) {
    return '<div class="rhymey-empty">No definition found</div>';
  }

  return defs
    .map((def) => {
      const [type, meaning] = def.split("\t");
      return `<div class="rhymey-def-item"><span class="type">${type}</span> ${meaning}</div>`;
    })
    .join("");
}

function setupDefinitionToggle(popup) {
  const toggle = popup.querySelector(".rhymey-more-toggle");
  const content = popup.querySelector(".rhymey-more-content");

  toggle?.addEventListener("click", () => {
    toggle.classList.toggle("open");
    content.classList.toggle("open");
  });
}

export function removeExistingPopup() {
  removeHighlight();
  const existingPopup = document.querySelector("#RhymeContainer");
  if (existingPopup) existingPopup.remove();
}

function highlightSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const mark = document.createElement("mark");
  mark.className = "rhymey-highlight";

  try {
    range.surroundContents(mark);
    selection.removeAllRanges();
  } catch (e) {
    // Selection spans multiple elements, skip highlighting
  }
}

function removeHighlight() {
  const highlight = document.querySelector(".rhymey-highlight");
  if (highlight) {
    const parent = highlight.parentNode;
    parent.replaceChild(
      document.createTextNode(highlight.textContent),
      highlight
    );
    parent.normalize();
  }
}

async function checkDarkMode() {
  try {
    const { darkMode = true } = await getSyncStorage(["darkMode"]);
    const popup = document.getElementById("RhymeContainer");
    if (popup) {
      if (darkMode) {
        popup.setAttribute("data-theme", "dark");
      } else {
        popup.removeAttribute("data-theme");
      }
    }
  } catch (error) {
    console.error("Error checking dark mode:", error);
  }
}
