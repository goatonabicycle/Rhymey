let selectedWord = ''
let renderSeperator = '<br/> '
let wordMustBeAtLeastThisLong = 2

document.addEventListener('dblclick', () => {
  let sel = window.getSelection().toString()
  if (sel.length && sel.trim().length > wordMustBeAtLeastThisLong) {
    selectedWord = sel.trim()
    getRhymingWords(selectedWord)
  } else { selectedWord = '' }
})

document.addEventListener('mouseup', (event) => {
  if (event.target.closest('.rhyme-popup-contain')) return
  popup.removeExistingPopup()
})

const getRhymingWords = (selectedWord) => {
  fetch('https://api.datamuse.com/words?rel_rhy=' + selectedWord) // merge the results of 'nry=' here 
    .then(response => response.json())
    .then(json => popup.addToPage(json))
}

var popup = {
  addToPage: (data) => {
    let display = 'Nothing found :('
    if (data.length > 0) {
      display = ''
      for (var i = 0; i < data.length; i++) {
        display += data[i].word + renderSeperator
      }
    }

    popup.removeExistingPopup()
    let container = document.createElement('div')
    container.id = 'RhymeContainer'
    container.className = 'rhyme-popup-contain'
    container.innerHTML =
      "<div><div class='rhymey-title'>" +
      'Rhyming with: <span class="word">' + selectedWord + '</span></div><br />' +
      display.replace(/,\s*$/, '') +
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
