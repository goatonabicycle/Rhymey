chrome.runtime.sendMessage({ type: "toHtmlMode" }, (scriptFile) => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(`js/${scriptFile}`);
  document.head.appendChild(script);
  console.log(" Added script! ", scriptFile);
});
