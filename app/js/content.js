let selectedWord = ''
let renderSeperator = '<br/> '
let wordMustBeAtLeastThisLong = 2

document.addEventListener('dblclick', () => {
  let sel = window.getSelection().toString()
  if (
    sel.length &&
    sel.trim().length > wordMustBeAtLeastThisLong &&
    sel.indexOf(' ') === -1
  ) {
    selectedWord = sel.trim()
    getRhymingWords(selectedWord)
  } else {
    selectedWord = ''
  }
})

document.addEventListener('mouseup', event => {
  if (event.target.closest('.rhyme-popup-contain')) return
  popup.removeExistingPopup()
})

document.addEventListener('keydown', event => {
  console.log('keydown')
  popup.removeExistingPopup()
})

const getRhymingWords = selectedWord => {
  var requestForRealRhymes = fetch('https://api.datamuse.com/words?rel_rhy=' + selectedWord).then(makeItJson)
  var requestForNearRhymes = fetch('https://api.datamuse.com/words?rel_nry=' + selectedWord).then(makeItJson)

  Promise.all([requestForRealRhymes, requestForNearRhymes]).then(function (values) {
    popup.addToPage(values[0], values[1])
  })
}

let popup = {
  addToPage: (realRhymes, nearRhymes) => {
    let realRhymesDisplay = getDisplayData(realRhymes)
    let nearRhymesDisplay = getDisplayData(nearRhymes)

    popup.removeExistingPopup()
    let container = document.createElement('div')
    container.id = 'RhymeContainer'
    container.className = 'rhyme-popup-contain'
    container.innerHTML =
      '<div>' +
      '<div class="word">' + selectedWord + '</div><br />' +
      '<div class="rhymey-title">Rhymes: </div>' +
      realRhymesDisplay.replace(/,\s*$/, '') + '<br /><br />' +
      '<div class="rhymey-title">Near rhymes:</div>' +
      nearRhymesDisplay.replace(/,\s*$/, '') +

      '</div>' // Todo: Get a better way of rendering this out
    document.body.appendChild(container)
  },
  removeExistingPopup: () => {
    let box = document.querySelector('.rhyme-popup-contain')
    if (box && box.parentNode) {
      box.parentNode.removeChild(box)
    }
  }
}

const getDisplayData = (data) => {
  let display = 'Nothing found :('
  if (data.length > 0) {
    display = ''
    for (var i = 0; i < data.length; i++) {
      display += '- ' + data[i].word + renderSeperator
    }
  }
  return display
}

const makeItJson = (response) => { return response.json() }
