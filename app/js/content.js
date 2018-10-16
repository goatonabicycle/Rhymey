var selectedWord = ''
var renderSeperator = ', '
var wordMustBeAtLeast = 2

const RenderResponsePopup = (response) => {
  try {
    var numberOfRhymes = response.rhymingWords.length
    var display = getStringToRender(response.rhymingWords)
    removePopup()

    var thereAreThingsThatRhyme = numberOfRhymes >= 1
    if (thereAreThingsThatRhyme) {
      renderPopup(display)
    } else {
      alert('No rhymes found for {' + selectedWord + '}') // Some sort of "Sorry... Nothing found" message maybe? Probably.
    }
  } catch (e) {
    console.log(e)
  }
}

const getStringToRender = (splitItems) => {
  var renderstring = ''

  for (var i = 0; i < splitItems.length; i++) {
    if (selectedWord !== splitItems[i]) {
      renderstring += splitItems[i] + renderSeperator
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
    chrome.extension.sendMessage({ data: sel }, null, RenderResponsePopup)
  } else { selectedWord = '' }
})

const renderPopup = (display) => {
  console.log({ display })
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
