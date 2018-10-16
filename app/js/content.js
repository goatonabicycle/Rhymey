var selectedWord = ''
var renderSeperator = '<br/> '
var wordMustBeAtLeast = 2

const getRhymingWords = (selectedWord) => {
  console.log({ selectedWord })
  fetch('https://api.datamuse.com/words?rel_rhy=' + selectedWord)
    .then(response => response.json())
    .then(json => renderPopup(json))
}

const renderPopup = (data) => {
  var numberOfRhymes = data.length
  var display = getStringToRender(data)
  removePopup()

  var thereAreThingsThatRhyme = numberOfRhymes >= 1
  if (thereAreThingsThatRhyme) {
    addPopupToPage(display)
  } else {
    alert('No rhymes found for {' + selectedWord + '}') // Some sort of "Sorry... Nothing found" message maybe? Probably.
  }
}

const getStringToRender = (splitItems) => {
  var renderstring = ''

  for (var i = 0; i < splitItems.length; i++) {
    if (selectedWord !== splitItems[i].word) {
      renderstring += splitItems[i].word + renderSeperator
    }
  }

  return renderstring.replace(/,\s*$/, '')
}

document.addEventListener('mouseup', (event) => {
  if (event.target.closest('.rhyme-popup-contain')) return
  removePopup()
})

document.addEventListener('dblclick', () => {
  var sel = window.getSelection().toString()
  if (sel.length && sel.trim().length > wordMustBeAtLeast) {
    selectedWord = sel.trim()
    getRhymingWords(selectedWord)
  } else { selectedWord = '' }
})

const addPopupToPage = (display) => {
  var container = document.createElement('div')
  container.id = 'RhymeContainer'
  container.className = 'rhyme-popup-contain'
  container.innerHTML =
    "<div><div class='rhymey-title'>" +
    'Rhyming with: ' + selectedWord +
    '</div><br />' +
    display +
    '</div>'
  document.body.appendChild(container)
}

let removePopup = () => {
  var box = document.querySelector('.rhyme-popup-contain')
  if (box && box.parentNode) {
    box.parentNode.removeChild(box)
  }
}
