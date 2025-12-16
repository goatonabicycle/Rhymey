import { config } from "../config.js";
import { getSyncStorage } from "../utils/storage.js";

export async function displayPopup(word, results) {
  removeExistingPopup();
  const selection = window.getSelection();
  const selectionRect = selection.rangeCount
    ? selection.getRangeAt(0).getBoundingClientRect()
    : null;

  highlightSelection();
  const popup = createPopupElement(word, results);
  document.body.appendChild(popup);

  positionPopup(popup, selectionRect);
  await checkDarkMode();
  makeDraggable(popup);
  setupMoreToggle(popup);
}

export function createPopupElement(word, results) {
  const container = document.createElement("div");
  container.id = "RhymeContainer";
  container.className = "rhymey-popup";

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
    <div class="rhymey-header">
      <div class="rhymey-word">${word}</div>
    </div>
    <div class="rhymey-list">${rhymesList}</div>
    <div class="rhymey-more-toggle">More</div>
    <div class="rhymey-more-content">${moreContent}</div>
  `;

  return container;
}

function positionPopup(popup, selectionRect) {
  const gap = 8;
  const padding = 12;

  popup.style.width = config.popup.width;

  const popupRect = popup.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!selectionRect) {
    popup.style.left = `${Math.max(padding, (vw - popupRect.width) / 2)}px`;
    popup.style.top = `${Math.max(padding, vh * 0.2)}px`;
    return;
  }

  const spaceBelow = vh - selectionRect.bottom - gap;
  const spaceAbove = selectionRect.top - gap;
  const spaceRight = vw - selectionRect.right - gap;
  const spaceLeft = selectionRect.left - gap;

  let left, top;

  // Try below first
  if (spaceBelow >= popupRect.height) {
    top = selectionRect.bottom + gap;
    left = selectionRect.left;
  }
  // Try above
  else if (spaceAbove >= popupRect.height) {
    top = selectionRect.top - popupRect.height - gap;
    left = selectionRect.left;
  }
  // Try to the right
  else if (spaceRight >= popupRect.width) {
    left = selectionRect.right + gap;
    top = selectionRect.top;
  }
  // Try to the left
  else if (spaceLeft >= popupRect.width) {
    left = selectionRect.left - popupRect.width - gap;
    top = selectionRect.top;
  }
  // Fallback: position below but constrained
  else {
    top = selectionRect.bottom + gap;
    left = selectionRect.left;
  }

  // Keep within viewport horizontally
  if (left + popupRect.width > vw - padding) {
    left = vw - popupRect.width - padding;
  }
  if (left < padding) {
    left = padding;
  }

  // Keep within viewport vertically
  if (top + popupRect.height > vh - padding) {
    top = vh - popupRect.height - padding;
  }
  if (top < padding) {
    top = padding;
  }

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function makeDraggable(popup) {
  const header = popup.querySelector(".rhymey-header");
  if (!header) return;

  header.style.cursor = "grab";

  header.addEventListener("mousedown", (e) => {
    e.preventDefault();
    header.style.cursor = "grabbing";

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = popup.offsetLeft;
    const startTop = popup.offsetTop;

    function onMouseMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const popupRect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Keep on screen
      newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - popupRect.width - padding));
      newTop = Math.max(padding, Math.min(newTop, viewportHeight - popupRect.height - padding));

      popup.style.left = `${newLeft}px`;
      popup.style.top = `${newTop}px`;
    }

    function onMouseUp() {
      header.style.cursor = "grab";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });
}

function renderMoreSection(similar, related, definitions) {
  let html = "";

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

function setupMoreToggle(popup) {
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
