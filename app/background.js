chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  switch (request.type) {
    case "GDocsAnnotate":
      console.log(request.type + " received. Sending gdocs.js");
      sendResponse("gdocs.js");
      break;
  }
});
