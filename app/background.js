chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  switch (request.type) {
    case "toHtmlMode":
      console.log(request.type + " received. Sending htmlMode.js");
      sendResponse("htmlMode.js");
      break;
  }
});
