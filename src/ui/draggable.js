import { setLocalStorage } from "../utils/storage.js";

export function makeDraggable(element) {
  element.onmousedown = (event) => {
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
        document.body.clientWidth - element.offsetWidth,
      ),
    );
    const newTop = Math.max(
      0,
      Math.min(
        initialTop - deltaY,
        document.body.clientHeight - element.offsetHeight,
      ),
    );

    element.style.right = `${newRight}px`;
    element.style.top = `${newTop}px`;
  }

  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    setLocalStorage("popupTop", element.style.top);
    setLocalStorage("popupRight", element.style.right);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}
