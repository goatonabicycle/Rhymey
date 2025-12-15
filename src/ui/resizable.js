import { setLocalStorage } from "../utils/storage.js";

export function makeResizable(element) {
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  for (const position of positions) {
    const resizer = document.createElement("div");
    setupResizer(element, resizer, position);
  }
}

function setupResizer(container, resizer, position) {
  resizer.className = `resizer resizer-${position}`;

  const cursorType = determineCursorType(position);
  resizer.style.cursor = cursorType;

  setPosition(resizer, position);

  container.appendChild(resizer);

  resizer.onmousedown = (event) => {
    event.preventDefault();
    resizeElement(container, event, position);
  };
}

function determineCursorType(position) {
  const verticalPosition = position.includes("top") ? "n" : "s";
  const horizontalPosition = position.includes("left") ? "w" : "e";
  return `${verticalPosition}${horizontalPosition}-resize`;
}

function setPosition(resizer, position) {
  const positions = position.split("-");

  for (const pos of positions) {
    resizer.style[pos] = "0";
  }
}

function resizeElement(element, event, position) {
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = Number.parseInt(
    document.defaultView.getComputedStyle(element).width,
    10,
  );
  const startHeight = Number.parseInt(
    document.defaultView.getComputedStyle(element).height,
    10,
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
          document.body.clientHeight - element.offsetHeight,
        )}px`;
        element.style.right = `${Math.min(
          startRight - dx,
          document.body.clientWidth - element.offsetWidth,
        )}px`;
        break;
      case "bottom-right":
        element.style.width = `${Math.max(100, startWidth + dx)}px`;
        element.style.height = `${Math.max(50, startHeight + dy)}px`;
        element.style.right = `${Math.min(
          startRight - dx,
          document.body.clientWidth - element.offsetWidth,
        )}px`;
        break;
      case "top-left":
        element.style.width = `${Math.max(100, startWidth - dx)}px`;
        element.style.height = `${Math.max(50, startHeight - dy)}px`;
        element.style.top = `${Math.min(
          startPos.top + dy,
          document.body.clientHeight - element.offsetHeight,
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
    setLocalStorage("popupWidth", element.style.width);
    setLocalStorage("popupHeight", element.style.height);
    setLocalStorage("popupTop", element.style.top);
    setLocalStorage("popupRight", element.style.right);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

export function handleWindowResize() {
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
