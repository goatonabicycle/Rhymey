//*****************************************************************************************************//

handleMessage = (request, sender, sendResponse) => {
  try {
    var CleanWord = request.data
      .replace(/[|&;$%@"<>()+,]/g, "")
      .toLowerCase()
      .trim();

    sendResponse({ outObjects: pronouncing.rhymes(CleanWord) });
  } catch (e) {
    alert(e.message);
  }
};

chrome.extension.onMessage.addListener(handleMessage);

//*****************************************************************************************************//
