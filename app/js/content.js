const config = {
  wordMinimumLength: 1,
  apiBaseUrl: "https://api.datamuse.com/words",
  popup: {
    top: "10px",
    right: "10px",
    width: "360px",
    height: "800px",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("dblclick", handleDoubleClick);
  document.addEventListener("mouseup", handleClosePopup);
  document.addEventListener("keydown", handleKeydownPopupClose);
  window.addEventListener("resize", handleWindowResize);
});

async function handleDoubleClick() {
  const selectedWord = getSelectedText().trim();
  console.log("Selected word:", selectedWord);
  if (selectedWord.length > config.wordMinimumLength) {
    const wordInfo = await fetchWordInfo(selectedWord);
    displayPopup(selectedWord, wordInfo);
  }
}

function getSelectedText() {
  let selectedText = document.selection
    ? document.selection.createRange().text
    : window.getSelection().toString();
  if (!selectedText) {
    console.log(
      "Rhymey was not able to get your selected word. That probably means you're using Google Docs!"
    );
    document
      .querySelector(".docs-texteventtarget-iframe")
      .contentDocument.execCommand("copy");
    selectedText = document.querySelector(".docs-texteventtarget-iframe")
      .contentDocument.body.innerText;
  }
  return selectedText;
}

async function fetchWordInfo(word) {
  const queries = ["rel_rhy", "rel_nry", "ml", "rel_trg"].map(
    (rel) => `${config.apiBaseUrl}?${rel}=${word}&md=d`
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

  function getPopupSetting(key, defaultValue) {
    return localStorage.getItem(key) || defaultValue;
  }

  const popupTop = getPopupSetting("popupTop", config.popup.top);
  const popupRight = getPopupSetting("popupRight", config.popup.right);
  const popupWidth = getPopupSetting("popupWidth", config.popup.width);
  const popupHeight = getPopupSetting("popupHeight", config.popup.height);

  container.style.cssText =
    `position: fixed; ` +
    `top: ${popupTop}; ` +
    `right: ${popupRight}; ` +
    `width: ${popupWidth}; ` +
    `height: ${popupHeight};`;

  const titles = ["Rhymes", "Near Rhymes", "Similar Meaning", "Related"];
  const blocks = results
    .map((result, index) => renderBlock(titles[index], result))
    .join("");

  container.innerHTML = `<div class="rhymey-word">${word}</div><div style="height: 100%; overflow: auto;">${blocks}</div>`;
  return container;
}

function renderBlock(title, data) {
  let content = "Nothing found.";
  if (data.length > 0) {
    const words = data.map(
      (item) => `<span class='rhymey-hover'>${item.word}</span>`
    );
    content = words.join(", ");
  }
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
  const initialMouseX = event.clientX;
  const initialMouseY = event.clientY;
  const initialRight =
    document.body.clientWidth -
    (element.getBoundingClientRect().right + window.scrollX);
  const initialTop = element.offsetTop;

  function onMouseMove(mouseEvent) {
    const deltaX = initialMouseX - mouseEvent.clientX;
    const deltaY = initialMouseY - mouseEvent.clientY;

    const newRight = Math.max(
      0,
      Math.min(
        initialRight + deltaX,
        document.body.clientWidth - element.offsetWidth
      )
    );
    const newTop = Math.max(
      0,
      Math.min(
        initialTop - deltaY,
        document.body.clientHeight - element.offsetHeight
      )
    );

    element.style.right = `${newRight}px`;
    element.style.top = `${newTop}px`;
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    localStorage.setItem("popupTop", element.style.top);
    localStorage.setItem("popupRight", element.style.right);
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
  resizer.style.width = "8px";
  resizer.style.height = "8px";
  resizer.style.background = "black";
  resizer.style.position = "absolute";

  const cursorType = determineCursorType(position);
  resizer.style.cursor = cursorType;

  setPosition(resizer, position);

  container.appendChild(resizer);

  resizer.onmousedown = function (event) {
    event.preventDefault();
    resizeElement(container, event, position);
  };

  function determineCursorType(position) {
    const verticalPosition = position.includes("top") ? "n" : "s";
    const horizontalPosition = position.includes("left") ? "w" : "e";
    return `${verticalPosition}${horizontalPosition}-resize`;
  }

  function setPosition(resizer, position) {
    const positions = position.split("-");
    positions.forEach((pos) => {
      resizer.style[pos] = "0";
    });
  }
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
  const startRight = document.body.clientWidth - startPos.right;

  function onMouseMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    switch (position) {
      case "top-right":
        element.style.width = `${Math.max(100, startWidth + dx)}px`;
        element.style.height = `${Math.max(50, startHeight - dy)}px`;
        element.style.top = `${Math.min(
          startPos.top + dy,
          document.body.clientHeight - element.offsetHeight
        )}px`;
        element.style.right = `${Math.min(
          startRight - dx,
          document.body.clientWidth - element.offsetWidth
        )}px`;
        break;
      case "bottom-right":
        element.style.width = `${Math.max(100, startWidth + dx)}px`;
        element.style.height = `${Math.max(50, startHeight + dy)}px`;
        element.style.right = `${Math.min(
          startRight - dx,
          document.body.clientWidth - element.offsetWidth
        )}px`;
        break;
      case "top-left":
        element.style.width = `${Math.max(100, startWidth - dx)}px`;
        element.style.height = `${Math.max(50, startHeight - dy)}px`;
        element.style.top = `${Math.min(
          startPos.top + dy,
          document.body.clientHeight - element.offsetHeight
        )}px`;
        element.style.right = `${startRight}px`;
        break;
      case "bottom-left":
        element.style.width = `${Math.max(100, startWidth - dx)}px`;
        element.style.height = `${Math.max(50, startHeight + dy)}px`;
        element.style.right = `${startRight}px`;
        break;
    }
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    localStorage.setItem("popupWidth", element.style.width);
    localStorage.setItem("popupHeight", element.style.height);
    localStorage.setItem("popupTop", element.style.top);
    localStorage.setItem("popupRight", element.style.right);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

function handleWindowResize() {
  const popup = document.getElementById("RhymeContainer");

  if (popup) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const popupRect = popup.getBoundingClientRect();
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;

    if (popupRect.left + popupWidth > windowWidth) {
      popup.style.right = `${windowWidth - popupRect.left}px`;
    }

    if (popupRect.top + popupHeight > windowHeight) {
      popup.style.top = `${windowHeight - popupHeight}px`;
    }

    if (popupRect.left < 0) {
      popup.style.right = `${windowWidth - popupWidth}px`;
    }

    if (popupRect.top < 0) {
      popup.style.top = "0px";
    }
  }
}
