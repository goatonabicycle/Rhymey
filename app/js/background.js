const handleMessage = (request, sender, sendResponse) => {
  var CleanWord = request.data
    .replace(/[|&;$%@"<>()+,]/g, '')
    .toLowerCase()
    .trim()

  sendResponse({ rhymingWords: pronouncing.rhymes(CleanWord) })
}

chrome.extension.onMessage.addListener(handleMessage)
