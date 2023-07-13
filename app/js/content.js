const injectedCode = `(function() {window[‘_docs_annotate_canvas_by_ext’] = '${chrome.runtime.id}';})();`;

const script = document.createElement("script");
script.textContent = injectedCode;
(document.head || document.documentElement).appendChild(script);
script.remove();

// For more details on the above go here: https://sites.google.com/google.com/docs-canvas-migration/home

let selectedWord = "";
const renderSeperator = ", ";
const wordMustBeAtLeastThisLong = 1;

const getRhymingSelection = (event) => {
  let selectedText =
    (document.selection && document.selection.createRange().text) ||
    (window.getSelection && window.getSelection().toString());

  if (!selectedText) {
    console.log(
      "Rhymey was not able to get your selected word. That probably means you're using Google Docs! Let's see if we can hack together some magic to get that working."
    );
    selectedText = getWordFromGoogleDocs(event);
  }
  return selectedText;
};

document.addEventListener("dblclick", (event) => {
  // Todo: Add a loading indicator here?
  let selectedWord = getRhymingSelection(event);
  console.log("Rhymey - selected word: ", selectedWord);
  if (
    selectedWord.length &&
    selectedWord.trim().length > wordMustBeAtLeastThisLong
  ) {
    selectedWord = selectedWord.trim();
    getInfoAbout(selectedWord);
  } else {
    selectedWord = "";
  }
});

function getWordFromGoogleDocs(event) {
  const mousePosition = getMousePosition(
    document.querySelector("canvas"),
    event
  );

  const allNodesInThisDoc = document.querySelectorAll(
    ".kix-canvas-tile-content svg>g>rect"
  );

  for (let i = 0; i < allNodesInThisDoc.length; i++) {
    const node = allNodesInThisDoc[i];
    const nodeText = node.getAttribute("aria-label");
    const transformMatrix = node.getAttribute("transform");
    const matrixValues = transformMatrix
      .match(/matrix\(([^)]+)\)/)[1]
      .split(",");

    const translateX = parseFloat(matrixValues[4]);
    const translateY = parseFloat(matrixValues[5]);

    const x = parseFloat(node.getAttribute("x")) + translateX;
    const y = parseFloat(node.getAttribute("y")) + translateY;
    const width = parseFloat(node.getAttribute("width"));
    const height = parseFloat(node.getAttribute("height"));

    console.log({ nodeText, rect, x, y, width, height });
    if (
      mousePosition.x >= x &&
      mousePosition.x <= x + width &&
      mousePosition.y >= y &&
      mousePosition.y <= y + height
    ) {
      console.log("Clicked word:", nodeText);

      return nodeText;
    }
  }
  return "";
}

function getMousePosition(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  console.log("Mouse -> x: " + x, "y: " + y);

  return { x, y };
}

document.addEventListener("mouseup", (event) => {
  if (event.target.closest(".rhymey-popup-contain")) return;
  popup.removeExistingPopup();
});

document.addEventListener("keydown", (event) => {
  console.log("keydown");
  popup.removeExistingPopup();
});

const getInfoAbout = (selectedWord) => {
  let requestForRealRhymes = fetch(
    "https://api.datamuse.com/words?rel_rhy=" + selectedWord + "&md=d"
  ).then(makeItJson);
  let requestForNearRhymes = fetch(
    "https://api.datamuse.com/words?rel_nry=" + selectedWord
  ).then(makeItJson);

  let requestForSimilarMeaning = fetch(
    "https://api.datamuse.com/words?ml=" + selectedWord
  ).then(makeItJson);

  let requestForRelated = fetch(
    "https://api.datamuse.com/words?rel_trg=" + selectedWord
  ).then(makeItJson);

  Promise.all([
    requestForRealRhymes,
    requestForNearRhymes,
    requestForSimilarMeaning,
    requestForRelated,
  ]).then(function (results) {
    popup.addToPage(
      selectedWord,
      results[0],
      results[1],
      results[2],
      results[3]
    );
  });
};

let popup = {
  addToPage: (
    selectedWord,
    realRhymes,
    nearRhymes,
    similarMeaning,
    related
  ) => {
    popup.removeExistingPopup();

    let container = document.createElement("div");
    container.id = "RhymeContainer";
    container.className = "rhymey-popup-contain";
    container.innerHTML = `
    <div>
        <div class="rhymey-word">${selectedWord}</div>
        ${renderBlock("Rhymes", realRhymes)}
        ${renderBlock("Near Rhymes", nearRhymes)}
        ${renderBlock("Similar meaning", similarMeaning)}
        ${renderBlock("Related", related)}
    </div>`;
    document.body.appendChild(container);
  },

  removeExistingPopup: () => {
    let box = document.querySelector(".rhymey-popup-contain");
    if (box && box.parentNode) {
      box.parentNode.removeChild(box);
    }
  },
};

const renderBlock = (title, data) => {
  let display = "Nothing found.";
  if (data.length > 0) {
    display = "";
    for (const item of data) {
      display += `<span class='rhymey-hover'>${item.word}</span>${renderSeperator}`;
    }
  }

  return ` <div class="rhymey-title">${title}</div>
  <div class="rhymey-content">
    ${display.replace(/,\s*$/, "")}
  </div>`;
};

const makeItJson = (response) => {
  return response.json();
};

/*
 * Copyright (C) 2023  Yomitan Authors
 * Copyright (C) 2022  Yomichan Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* global
 * DocumentUtil
 * TextSourceRange
 */

/**
 * This class is a helper for handling Google Docs content in content scripts.
 */
class GoogleDocsUtil {
  /**
   * Scans the document for text or elements with text information at the given coordinate.
   * Coordinates are provided in [client space](https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_View/Coordinate_systems).
   * @param {number} x The x coordinate to search at.
   * @param {number} y The y coordinate to search at.
   * @param {GetRangeFromPointOptions} options Options to configure how element detection is performed.
   * @returns {?TextSourceRange|TextSourceElement} A range for the hovered text or element, or `null` if no applicable content was found.
   */
  static getRangeFromPoint(x, y, { normalizeCssZoom }) {
    const styleNode = this._getStyleNode();
    styleNode.disabled = false;
    const element = document.elementFromPoint(x, y);
    styleNode.disabled = true;
    if (
      element !== null &&
      element.matches(".kix-canvas-tile-content svg>g>rect")
    ) {
      const ariaLabel = element.getAttribute("aria-label");
      if (typeof ariaLabel === "string" && ariaLabel.length > 0) {
        return this._createRange(element, ariaLabel, x, y, normalizeCssZoom);
      }
    }
    return null;
  }

  static _getStyleNode() {
    // This <style> node is necessary to force the SVG <rect> elements to have a fill,
    // which allows them to be included in document.elementsFromPoint's return value.
    if (this._styleNode === null) {
      const style = document.createElement("style");
      style.textContent = [
        ".kix-canvas-tile-content{pointer-events:none!important;}",
        ".kix-canvas-tile-content svg>g>rect{pointer-events:all!important;}",
      ].join("\n");
      const parent = document.head || document.documentElement;
      if (parent !== null) {
        parent.appendChild(style);
      }
      this._styleNode = style;
    }
    return this._styleNode;
  }

  static _createRange(element, text, x, y, normalizeCssZoom) {
    // Create imposter
    const content = document.createTextNode(text);
    const svgText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    const transform = element.getAttribute("transform") || "";
    const font = element.getAttribute("data-font-css") || "";
    svgText.setAttribute("x", element.getAttribute("x"));
    svgText.setAttribute("y", element.getAttribute("y"));
    svgText.appendChild(content);
    const textStyle = svgText.style;
    this._setImportantStyle(textStyle, "all", "initial");
    this._setImportantStyle(textStyle, "transform", transform);
    this._setImportantStyle(textStyle, "font", font);
    this._setImportantStyle(textStyle, "text-anchor", "start");
    element.parentNode.appendChild(svgText);

    // Adjust offset
    const elementRect = element.getBoundingClientRect();
    const textRect = svgText.getBoundingClientRect();
    const yOffset =
      (elementRect.top -
        textRect.top +
        (elementRect.bottom - textRect.bottom)) *
      0.5;
    this._setImportantStyle(
      textStyle,
      "transform",
      `translate(0px,${yOffset}px) ${transform}`
    );

    // Create range
    const range = this._getRangeWithPoint(content, x, y, normalizeCssZoom);
    this._setImportantStyle(textStyle, "pointer-events", "none");
    this._setImportantStyle(textStyle, "opacity", "0");
    return TextSourceRange.createFromImposter(range, svgText, element);
  }

  static _getRangeWithPoint(textNode, x, y, normalizeCssZoom) {
    if (normalizeCssZoom) {
      const scale = DocumentUtil.computeZoomScale(textNode);
      x /= scale;
      y /= scale;
    }
    const range = document.createRange();
    let start = 0;
    let end = textNode.nodeValue.length;
    while (end - start > 1) {
      const mid = Math.floor((start + end) / 2);
      range.setStart(textNode, mid);
      range.setEnd(textNode, end);
      if (DocumentUtil.isPointInAnyRect(x, y, range.getClientRects())) {
        start = mid;
      } else {
        end = mid;
      }
    }
    range.setStart(textNode, start);
    range.setEnd(textNode, start);
    return range;
  }

  static _setImportantStyle(style, propertyName, value) {
    style.setProperty(propertyName, value, "important");
  }
}
// eslint-disable-next-line no-underscore-dangle
GoogleDocsUtil._styleNode = null;
