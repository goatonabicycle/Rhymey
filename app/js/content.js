window._docs_force_html_by_ext = true;

let selectedWord = "";
const renderSeperator = ", ";
const wordMustBeAtLeastThisLong = 1;

const getRhymingSelection = () => {
  const sel =
    (document.selection && document.selection.createRange().text) ||
    (window.getSelection && window.getSelection().toString());

  if (!sel) {
    console.log("Rhymey was not able to get your selected word.");
    console.log("Support for Google Docs documents should be coming soon!");
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
    getInfoAbout(selectedWord);
  } else {
    selectedWord = "";
  }
});

document.addEventListener("mouseup", (event) => {
  if (event.target.closest(".rhymey-popup-contain")) return;
  popup.removeExistingPopup();
});

document.addEventListener("keydown", (event) => {
  console.log("keydown");
  popup.removeExistingPopup();
});

const getInfoAbout = (selectedWord) => {
  let requestForRealRhymes = fetch(
    "https://api.datamuse.com/words?rel_rhy=" + selectedWord + "&md=d"
  ).then(makeItJson);
  let requestForNearRhymes = fetch(
    "https://api.datamuse.com/words?rel_nry=" + selectedWord
  ).then(makeItJson);

  let requestForSimilarMeaning = fetch(
    "https://api.datamuse.com/words?ml=" + selectedWord
  ).then(makeItJson);

  let requestForRelated = fetch(
    "https://api.datamuse.com/words?rel_trg=" + selectedWord
  ).then(makeItJson);

  Promise.all([
    requestForRealRhymes,
    requestForNearRhymes,
    requestForSimilarMeaning,
    requestForRelated,
  ]).then(function (results) {
    popup.addToPage(
      selectedWord,
      results[0],
      results[1],
      results[2],
      results[3]
    );
  });
};

let popup = {
  addToPage: (
    selectedWord,
    realRhymes,
    nearRhymes,
    similarMeaning,
    related
  ) => {
    popup.removeExistingPopup();

    let container = document.createElement("div");
    container.id = "RhymeContainer";
    container.className = "rhymey-popup-contain";
    container.innerHTML = `
    <div>
        <div class="rhymey-word">${selectedWord}</div>
        ${renderBlock("Rhymes", realRhymes)}
        ${renderBlock("Near Rhymes", nearRhymes)}
        ${renderBlock("Similar meaning", similarMeaning)}
        ${renderBlock("Related", related)}
    </div>`;
    document.body.appendChild(container);
  },

  removeExistingPopup: () => {
    let box = document.querySelector(".rhymey-popup-contain");
    if (box && box.parentNode) {
      box.parentNode.removeChild(box);
    }
  },
};

const renderBlock = (title, data) => {
  let display = "Nothing found.";
  if (data.length > 0) {
    display = "";
    for (const item of data) {
      display += `<span class='rhymey-hover'>${item.word}</span>${renderSeperator}`;
    }
  }

  return ` <div class="rhymey-title">${title}</div>
  <div class="rhymey-content">
    ${display.replace(/,\s*$/, "")}
  </div>`;
};

const makeItJson = (response) => {
  return response.json();
};
