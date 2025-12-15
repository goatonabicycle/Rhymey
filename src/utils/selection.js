export function getSelectedText() {
  let selectedText = window.getSelection().toString() || "";

  if (!selectedText) {
    console.log(
      "Rhymey was not able to get your selected word normally. That probably means you're using Google Docs! Trying magic!",
    );

    const iframe = document.querySelector(".docs-texteventtarget-iframe");
    if (iframe?.contentDocument) {
      iframe.contentDocument.execCommand("copy");
      selectedText = iframe.contentDocument.body.innerText;
    }
  }

  return selectedText;
}
