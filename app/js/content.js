let selectedWord = "";
const renderSeperator = ", ";
const wordMustBeAtLeastThisLong = 1;

const getRhymingSelection = () => {
  var sel =
    (document.selection && document.selection.createRange().text) ||
    (window.getSelection && window.getSelection().toString());

  if (!sel) {
    sel = googleDocImplementation().getGoogleDocument().selectedText;
    // The above is from https://github.com/JensPLarsen/ChromeExtension-GoogleDocsUtil/blob/master/googleDocsUtil.js
    // This allows the user to actually use this in a google environment.
  }
  return sel;
};

document.addEventListener("dblclick", () => {
  // Todo: Add a loading indicator here
  let selectedWord = getRhymingSelection();
  console.log("Rhymey - selected word: ", selectedWord);
  if (
    selectedWord.length &&
    selectedWord.trim().length > wordMustBeAtLeastThisLong
  ) {
    selectedWord = selectedWord.trim();
    getRhymingWords(selectedWord);
  } else {
    selectedWord = "";
  }
});

document.addEventListener("mouseup", (event) => {
  if (event.target.closest(".rhyme-popup-contain")) return;
  popup.removeExistingPopup();
});

document.addEventListener("keydown", (event) => {
  console.log("keydown");
  popup.removeExistingPopup();
});

const getRhymingWords = (selectedWord) => {
  let requestForRealRhymes = fetch(
    "https://api.datamuse.com/words?rel_rhy=" + selectedWord
  ).then(makeItJson);
  let requestForNearRhymes = fetch(
    "https://api.datamuse.com/words?rel_nry=" + selectedWord
  ).then(makeItJson);

  let requestForSimilarMeaning = fetch(
    "https://api.datamuse.com/words?ml=" + selectedWord
  ).then(makeItJson);

  Promise.all([
    requestForRealRhymes,
    requestForNearRhymes,
    requestForSimilarMeaning,
  ]).then(function (values) {
    popup.addToPage(selectedWord, values[0], values[1], values[2]);
  });
};

let popup = {
  addToPage: (selectedWord, realRhymes, nearRhymes, similarMeaning) => {
    let realRhymesDisplay = getDisplayData(realRhymes);
    let nearRhymesDisplay = getDisplayData(nearRhymes);
    let similarMeaningDisplay = getDisplayData(similarMeaning);

    popup.removeExistingPopup();

    let container = document.createElement("div");
    container.id = "RhymeContainer";
    container.className = "rhymey-popup-contain";

    container.innerHTML = `
    <div>
        <div class="rhymey-word">${selectedWord}</div>
        
        <div class="rhymey-title">Rhymes: </div>
        <div class="rhymey-content">
          ${realRhymesDisplay.replace(/,\s*$/, "")}
        </div>

        <div class="rhymey-title">Near rhymes:</div>
        <div class="rhymey-content">
          ${nearRhymesDisplay.replace(/,\s*$/, "")}
        </div>
        <div class="rhymey-title">Similar meaning:</div>
        <div class="rhymey-content">
          ${similarMeaningDisplay.replace(/,\s*$/, "")}
        </div>
    </div>`;
    document.body.appendChild(container);
  },

  removeExistingPopup: () => {
    let box = document.querySelector(".rhyme-popup-contain");
    if (box && box.parentNode) {
      box.parentNode.removeChild(box);
    }
  },
};

const getDisplayData = (data) => {
  let display = "Nothing found.";
  if (data.length > 0) {
    display = "";
    for (var i = 0; i < data.length; i++) {
      display += "" + data[i].word + renderSeperator;
    }
  }
  return display;
};

const makeItJson = (response) => {
  return response.json();
};
