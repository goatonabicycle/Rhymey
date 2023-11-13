// Extracts matrix values from transform attribute
function extractMatrixValues(transformMatrix) {
  // This removes the 'matrix(' from the start and ')' from the end and split the string by comma to get an array of values
  const matrixValues = transformMatrix.slice(7, -1).split(",");

  return {
    translateX: parseFloat(matrixValues[4]),
    translateY: parseFloat(matrixValues[5]),
  };
}

// // -----------------------------------------------------

// const getSelectedText = function () {
//   const overlaps = (a, b) =>
//     a.left < b.right &&
//     a.right > b.left &&
//     a.top < b.bottom &&
//     a.bottom > b.top;
//   const page = getCurrentlyVisiblePage(getPages());
//   const selectionRects = Array.from(
//     page.querySelectorAll(".kix-canvas-tile-selection > svg > rect")
//   ).map((el) => el.getBoundingClientRect());
//   return Array.from(page.querySelectorAll("svg > g[role=paragraph] > rect"))
//     .map((el) => ({ el: el, rect: el.getBoundingClientRect() }))
//     .filter((item) => selectionRects.some((rect) => overlaps(item.rect, rect)))
//     .map((item) => item.el.getAttribute("aria-label"))
//     .filter(makeDeduper())
//     .join(" ");
// };

function getPages() {
  const pages = Array.from(document.querySelectorAll(".kix-page-paginated"));

  return pages
    .map((page) => ({ page: page, top: page.getBoundingClientRect().top }))
    .sort((a, b) => a.top - b.top)
    .map((item) => item.page);
}

function getCurrentlyVisiblePage(pages) {
  const halfHeight = window.innerHeight / 2;
  for (var i = pages.length - 1; i >= 0; i--) {
    if (pages[i].getBoundingClientRect().top < halfHeight) return pages[i];
  }
  throw new Error("Can't get the currently visible page");
}

// function makeDeduper() {
//   let prev;
//   return function (text) {
//     if (text == prev) return false;
//     prev = text;
//     return true;
//   };
// }

// // -----------------------------------------------------

function getMousePosition(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;

  // This super doesn't work when used with page breaks. Sigh.
  // const cursor = document.querySelector("#kix-current-user-cursor-caret");
  // const cursorBbox = cursor.getBoundingClientRect();
  // const x = Math.floor(cursorBbox.right);
  // const y = Math.floor(cursorBbox.top);
  // const rect = document.elementFromPoint(x, y);

  return { x, y };
}

function isWithinWordBounds(mousePos, wordBounds) {
  const { x, y } = mousePos;
  const { startX, endX, startY, endY } = wordBounds;

  return x >= startX && x <= endX && y >= startY && y <= endY;
}

// Fetches word from Google Docs
function getWordFromGoogleDocs(event) {
  const canvases = document.querySelectorAll("canvas");
  console.log("canvases:", canvases);

  let clickedWord = "";

  for (let i = canvases.length - 1; i >= 0; i--) {
    const canvas = canvases[i];
    console.log("canvas:", canvas);
    const mousePosition = getMousePosition(canvas, event);
    const allNodesInThisDoc = document.querySelectorAll(
      ".kix-canvas-tile-content svg>g>rect"
    );
    // console.log("allNodesInThisDoc.length:", allNodesInThisDoc.length);

    const ctx = canvas.getContext("2d");
    let log = [];

    for (let node of allNodesInThisDoc) {
      const nodeText = node.getAttribute("aria-label");
      const transformMatrix = node.getAttribute("transform");
      const fontCSS = node.getAttribute("data-font-css");

      ctx.font = fontCSS;

      const { translateX, translateY } = extractMatrixValues(transformMatrix);
      const x = parseFloat(node.getAttribute("x")) + translateX;
      const y = parseFloat(node.getAttribute("y")) + translateY;
      const height = parseFloat(node.getAttribute("height"));

      const words = nodeText.split(" ");
      let wordStartX = x;

      for (let word of words) {
        const wordWidth = ctx.measureText(word).width;
        const wordBounds = {
          startX: wordStartX,
          endX: wordStartX + wordWidth,
          startY: y,
          endY: y + height,
        };

        if (isWithinWordBounds(mousePosition, wordBounds)) {
          console.log(
            "--------------------------------------------------------"
          );
          console.log({ mousePosition, word, wordWidth, wordBounds });
          console.log("Clicked word:", word);
          console.log(
            "--------------------------------------------------------"
          );
          clickedWord = word;
          break;
        }

        log.push({ mousePosition, word, wordWidth, wordBounds });

        wordStartX += wordWidth + ctx.measureText(" ").width;
      }

      if (clickedWord !== "") {
        break;
      }
    }

    if (clickedWord !== "") {
      break;
    }
  }

  return clickedWord;
}
