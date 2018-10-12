var selectedWord = "";

//**************************************************************************************************//

document.addEventListener("dblclick", function(event) {
  var sel = window.getSelection().toString();
  if (sel.length) {
    // Word must be at least 3 chars big. Could maybe make this configurable?
    if (sel.trim().length > 2) {
      selectedWord = sel.trim();
      chrome.extension.sendMessage({ data: sel }, null, RenderResponsePopup);
    }
  }
});

//**************************************************************************************************//

function RenderResponsePopup(response) {
  try {
    //--Possible Settings-------------------------------------------
    var NumberOfWordsToShow = 1000;
    var top = "";
    var left = "";
    var borderColour = "";
    var renderType = 2; // 1 will be... Long list. 2 will be all next to each other?
    //---Possible Settings------------------------------------------

    var responseItems = response.outObjects;
    var renderstring = "";
    var splitItems = [];
    var renderSeperator;
    var added = 0;

    switch (renderType) {
      case 1:
        renderSeperator = "<br />";
        break;
      case 2:
        renderSeperator = ", ";
        break;
      default:
    }

    splitItems = responseItems.toString().split(",");

    for (var i = 0; i < splitItems.length; i++) {
      if (added < NumberOfWordsToShow && selectedWord !== splitItems[i]) {
        renderstring += splitItems[i] + renderSeperator;
        added++;
      }
    }

    var display = renderstring.replace(/,\s*$/, "");
    var title = "Rhyming with: " + selectedWord;
    var container = $(".rhyme-popup-contain");
    container.remove();

    if (added > 1 && !display.isEmpty()) {
      var container = document.createElement("div");
      container.id = "RhymeContainer";
      container.className = "rhyme-popup-contain";
      container.innerHTML =
        "<div><div class='title'>" +
        title +
        "</div><br />" +
        display +
        "</div>";
      document.body.appendChild(container);

      //$("#RhymeContainer").draggable().resizable("option", "minWidth", 150);

      //$(function () {
      //  $("#RhymeContainer").resizable({
      //    maxHeight: 250,
      //    maxWidth: 350,
      //    minHeight: 150,
      //    minWidth: 200
      //  });
      //});

      try {
        document
          .getElementById("RhymeCloseButton")
          .addEventListener("click", Close, false);
      } catch (e) {}
    } else {
      alert("nope");
      //Some sort of "Sorry... Nothing found" message maybe? Probably.
    }
  } catch (e) {
    alert(e.message);
  }
}

//**************************************************************************************************//

$(document).mouseup(function(e) {
  var container = $(".rhyme-popup-contain");
  if (!container.is(e.target) && container.has(e.target).length === 0) {
    container.remove();
    $(".rhyme-popup-close").remove();
  }
});

//**************************************************************************************************//

String.prototype.isEmpty = function() {
  return this.length === 0 || !this.trim();
};

//**************************************************************************************************//
