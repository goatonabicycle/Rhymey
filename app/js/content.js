const wordMinimumLength = 1;
const apiBaseUrl = "https://api.datamuse.com/words";

document.addEventListener("dblclick", handleDoubleClick);
document.addEventListener("mouseup", handleClosePopup);
document.addEventListener("keydown", handleKeydownPopupClose);

async function handleDoubleClick() {
  const selectedWord = getSelectedText().trim();
  console.log("Selected word:", selectedWord);
  if (selectedWord.length > wordMinimumLength) {
    const wordInfo = await fetchWordInfo(selectedWord);
    displayPopup(selectedWord, wordInfo);
  }
}

function getSelectedText() {
  if (window.getSelection) {
    return window.getSelection().toString();
  } else if (document.selection && document.selection.createRange) {
    return document.selection.createRange().text;
  }
  return "";
}

async function fetchWordInfo(word) {
  const queries = ["rel_rhy", "rel_nry", "ml", "rel_trg"].map(
    (rel) => `${apiBaseUrl}?${rel}=${word}&md=d`
  );
  const requests = queries.map((query) =>
    fetch(query).then((res) => res.json())
  );
  return Promise.all(requests);
}

function displayPopup(word, results) {
  removeExistingPopup();
  const popup = createPopupElement(word, results);
  document.body.appendChild(popup);
  makeDraggable(popup);
  makeResizable(popup);
}

function createPopupElement(word, results) {
  const container = document.createElement("div");
  container.id = "RhymeContainer";
  container.className = "rhymey-popup-contain";

  container.style.cssText = `position: fixed; top: ${
    localStorage.getItem("popupTop") || "10px"
  }; left: ${localStorage.getItem("popupLeft") || "10px"}; width: ${
    localStorage.getItem("popupWidth") || "160px"
  }; height: ${localStorage.getItem("popupHeight") || "300px"};`;

  container.innerHTML = `
        <div class="rhymey-content-container" style="height: 100%; overflow: auto;">
            <div class="rhymey-word">${word}</div>
            ${results
              .map((result, index) =>
                renderBlock(
                  ["Rhymes", "Near Rhymes", "Similar meaning", "Related"][
                    index
                  ],
                  result
                )
              )
              .join("")}
        </div>`;

  return container;
}

function renderBlock(title, data) {
  const content =
    data.length > 0
      ? data
          .map((item) => `<span class='rhymey-hover'>${item.word}</span>`)
          .join(", ")
      : "Nothing found.";
  return `<div class="rhymey-title">${title}</div><div class="rhymey-content">${content}</div>`;
}

function removeExistingPopup() {
  const existingPopup = document.querySelector("#RhymeContainer");
  if (existingPopup) existingPopup.remove();
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

function makeDraggable(element) {
  element.onmousedown = function (event) {
    if (event.target.classList.contains("resizer")) return;
    dragElement(element, event);
  };
}

function dragElement(element, event) {
  const offsetX = event.clientX - element.offsetLeft;
  const offsetY = event.clientY - element.offsetTop;

  function onMouseMove(e) {
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    localStorage.setItem("popupTop", element.style.top);
    localStorage.setItem("popupLeft", element.style.left);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

function makeResizable(element) {
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
  positions.forEach((position) => {
    const resizer = document.createElement("div");
    setupResizer(element, resizer, position);
  });
}

function setupResizer(container, resizer, position) {
  resizer.className = "resizer";
  resizer.style.cssText = `width: 8px; height: 8px; background: black; position: absolute; cursor: ${
    position.includes("top") ? "n" : "s"
  }${position.includes("left") ? "w" : "e"}-resize; ${position.replace(
    "-",
    ": 0; "
  )}: 0;`;
  container.appendChild(resizer);

  resizer.onmousedown = function (event) {
    event.preventDefault();
    resizeElement(container, event, position);
  };
}

function resizeElement(element, event, position) {
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = parseInt(
    document.defaultView.getComputedStyle(element).width,
    10
  );
  const startHeight = parseInt(
    document.defaultView.getComputedStyle(element).height,
    10
  );
  const startPos = element.getBoundingClientRect();

  function onMouseMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    switch (position) {
      case "top-left":
        element.style.width = `${Math.max(100, startWidth - dx)}px`;
        element.style.height = `${Math.max(50, startHeight - dy)}px`;
        element.style.top = `${startPos.top + dy}px`;
        element.style.left = `${startPos.left + dx}px`;
        break;
      case "top-right":
        element.style.width = `${Math.max(100, startWidth + dx)}px`;
        element.style.height = `${Math.max(50, startHeight - dy)}px`;
        element.style.top = `${startPos.top + dy}px`;
        break;
      case "bottom-left":
        element.style.width = `${Math.max(100, startWidth - dx)}px`;
        element.style.height = `${Math.max(50, startHeight + dy)}px`;
        element.style.left = `${startPos.left + dx}px`;
        break;
      case "bottom-right":
        element.style.width = `${Math.max(100, startWidth + dx)}px`;
        element.style.height = `${Math.max(50, startHeight + dy)}px`;
        break;
    }
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    localStorage.setItem("popupWidth", element.style.width);
    localStorage.setItem("popupHeight", element.style.height);
    localStorage.setItem("popupTop", element.style.top);
    localStorage.setItem("popupLeft", element.style.left);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}
